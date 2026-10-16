import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { toSafeUserDto, type SafeUserDto } from '../../common/dto/safe-user.dto';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto, SelfRegisterableRole } from './dto/register.dto';
import type { GoogleProfile } from './strategies/google.strategy';
import { generateOpaqueToken, hashToken } from './refresh-token.util';
import type { AccessTokenPayload } from './types/access-token-payload';
import type { PendingGoogleSignupPayload } from './types/pending-google-signup-payload';

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_GOOGLE_SIGNUP_TTL_SECONDS = 10 * 60;

export interface IssuedTokens {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  refreshTokenId: string;
  refreshTokenExpiresAt: Date;
}

export interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  async register(dto: RegisterDto): Promise<SafeUserDto> {
    const existingByEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingByEmail) {
      throw new ConflictException('An account with this email already exists.');
    }

    if (dto.phone) {
      const existingByPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existingByPhone) {
        throw new ConflictException('An account with this phone number already exists.');
      }
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        roles: { create: dto.roles.map((role) => ({ role })) },
      },
      include: { roles: true },
    });

    await this.sendVerificationEmail(user.id, dto.email);

    return toSafeUserDto(user);
  }

  /**
   * Soft-gated verification: issuing/sending never blocks registration or
   * login. `emailVerifiedAt` just stays null until the link is clicked.
   */
  private async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const rawToken = generateOpaqueToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
      },
    });

    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const verifyUrl = `${frontendUrl}/verify-email?token=${rawToken}`;
    await this.mailer.sendVerificationEmail(email, verifyUrl);
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    // Atomically claims the token — if two requests race on the same token
    // (e.g. a double-click, or React re-firing an effect), only one can
    // flip consumedAt from null, so only one proceeds to verify the user.
    const claimed = await this.prisma.emailVerificationToken.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    if (claimed.count === 0) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  /**
   * Always resolves successfully, whether or not the email belongs to an
   * account or is already verified — same anti-enumeration rationale as
   * login (blueprint Phase 3/12).
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) {
      return;
    }

    await this.prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await this.sendVerificationEmail(user.id, email);
  }

  /**
   * Resolves an authenticated Google profile to a user session: matches an
   * already-linked Google account, links Google to an existing
   * password-based account by email, or signals that a new account needs
   * to be created (caller then issues a pending-signup token so the
   * frontend can collect a role before we create anything).
   */
  async loginWithGoogle(
    profile: GoogleProfile,
    meta: SessionMeta,
  ): Promise<{ tokens: IssuedTokens; user: SafeUserDto } | { needsSignup: true }> {
    const linked = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: 'GOOGLE', providerAccountId: profile.googleId } },
      include: { user: { include: { roles: true } } },
    });

    if (linked) {
      const tokens = await this.issueTokens(linked.user.id, linked.user.roles.map((r) => r.role), meta);
      return { tokens, user: toSafeUserDto(linked.user) };
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
      include: { roles: true },
    });

    if (existingUser) {
      await this.prisma.oAuthAccount.create({
        data: { userId: existingUser.id, provider: 'GOOGLE', providerAccountId: profile.googleId },
      });
      if (!existingUser.emailVerifiedAt) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerifiedAt: new Date() },
        });
      }
      const tokens = await this.issueTokens(existingUser.id, existingUser.roles.map((r) => r.role), meta);
      return { tokens, user: await this.getSafeUserOrThrow(existingUser.id) };
    }

    return { needsSignup: true };
  }

  issuePendingGoogleSignupToken(profile: GoogleProfile): string {
    const payload: PendingGoogleSignupPayload = {
      purpose: 'google_signup',
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
    };
    return this.jwt.sign(payload, { expiresIn: PENDING_GOOGLE_SIGNUP_TTL_SECONDS });
  }

  async completeGoogleSignup(
    pendingToken: string,
    roles: SelfRegisterableRole[],
    meta: SessionMeta,
  ): Promise<{ tokens: IssuedTokens; user: SafeUserDto }> {
    let payload: PendingGoogleSignupPayload;
    try {
      payload = this.jwt.verify<PendingGoogleSignupPayload>(pendingToken);
    } catch {
      throw new UnauthorizedException('This sign-up link is invalid or has expired.');
    }

    if (payload.purpose !== 'google_signup') {
      throw new UnauthorizedException('This sign-up link is invalid or has expired.');
    }

    const existingByEmail = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (existingByEmail) {
      throw new ConflictException('An account with this email already exists.');
    }

    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        emailVerifiedAt: new Date(),
        roles: { create: roles.map((role) => ({ role })) },
        oauthAccounts: {
          create: { provider: 'GOOGLE', providerAccountId: payload.googleId },
        },
      },
      include: { roles: true },
    });

    const tokens = await this.issueTokens(user.id, user.roles.map((r) => r.role), meta);
    return { tokens, user: toSafeUserDto(user) };
  }

  /**
   * Returns the same generic error whether the account doesn't exist or the
   * password is wrong, so a failed login can't be used to enumerate
   * registered emails (blueprint Phase 3/12).
   */
  async validateCredentials(dto: LoginDto): Promise<{ id: string; roles: Role[] }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: true },
    });

    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      // Only reachable once the correct password was already supplied, so
      // this doesn't leak account existence to anyone but the account holder.
      throw new ForbiddenException('This account is not active.');
    }

    return { id: user.id, roles: user.roles.map((r) => r.role) };
  }

  /**
   * A support "view as" session: access-token only, same TTL as a normal
   * login (ACCESS_TOKEN_TTL_SECONDS, currently 15m) but deliberately issues
   * no refresh token, so it cannot be silently renewed — it just expires
   * and the admin falls back to their own session.
   */
  issueImpersonationToken(targetUserId: string, targetRoles: Role[], adminUserId: string): { accessToken: string; expiresInSeconds: number } {
    const expiresInSeconds = this.config.getOrThrow<number>('ACCESS_TOKEN_TTL_SECONDS');
    const payload: AccessTokenPayload = { sub: targetUserId, roles: targetRoles, impersonatedBy: adminUserId };
    const accessToken = this.jwt.sign(payload, { expiresIn: expiresInSeconds });
    return { accessToken, expiresInSeconds };
  }

  async issueTokens(userId: string, roles: Role[], meta: SessionMeta): Promise<IssuedTokens> {
    const accessTokenExpiresInSeconds = this.config.getOrThrow<number>('ACCESS_TOKEN_TTL_SECONDS');
    const payload: AccessTokenPayload = { sub: userId, roles };
    const accessToken = this.jwt.sign(payload, { expiresIn: accessTokenExpiresInSeconds });

    const refreshToken = generateOpaqueToken();
    const refreshTokenTtlDays = this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    const created = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return {
      accessToken,
      accessTokenExpiresInSeconds,
      refreshToken,
      refreshTokenId: created.id,
      refreshTokenExpiresAt,
    };
  }

  async login(
    dto: LoginDto,
    meta: SessionMeta,
  ): Promise<{ tokens: IssuedTokens; user: SafeUserDto }> {
    const { id, roles } = await this.validateCredentials(dto);
    const tokens = await this.issueTokens(id, roles, meta);
    const user = await this.getSafeUserOrThrow(id);
    return { tokens, user };
  }

  /**
   * Validates, rotates, and re-issues a refresh session. If the presented
   * token was already rotated away (reuse of a revoked token — a strong
   * signal of theft), the entire session chain for that user is revoked.
   */
  async refresh(
    rawToken: string,
    meta: SessionMeta,
  ): Promise<{ tokens: IssuedTokens; user: SafeUserDto }> {
    const tokenHash = hashToken(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh session.');
    }

    if (existing.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid refresh session.');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh session expired.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: existing.userId },
      include: { roles: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid refresh session.');
    }

    const tokens = await this.issueTokens(
      user.id,
      user.roles.map((r) => r.role),
      meta,
    );

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedByTokenId: tokens.refreshTokenId },
    });

    return { tokens, user: toSafeUserDto(user) };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getSafeUserOrThrow(userId: string): Promise<SafeUserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: true },
    });
    return toSafeUserDto(user);
  }
}
