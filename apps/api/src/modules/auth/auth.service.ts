import {
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
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { generateOpaqueToken, hashToken } from './refresh-token.util';
import type { AccessTokenPayload } from './types/access-token-payload';

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

    return toSafeUserDto(user);
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
