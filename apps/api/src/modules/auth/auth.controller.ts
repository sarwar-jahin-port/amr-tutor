import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { SafeUserDto } from '../../common/dto/safe-user.dto';
import { AuthService, type IssuedTokens, type SessionMeta } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './types/authenticated-user';

const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<{ data: SafeUserDto }> {
    const user = await this.authService.register(dto);
    return { data: user };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: { accessToken: string; expiresIn: number; user: SafeUserDto } }> {
    const { tokens, user } = await this.authService.login(dto, this.extractMeta(req));
    this.setRefreshCookie(res, tokens);
    return { data: this.toLoginResponse(tokens, user) };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: { accessToken: string; expiresIn: number; user: SafeUserDto } }> {
    const rawToken = this.readRefreshCookie(req);
    if (!rawToken) {
      throw new UnauthorizedException('No refresh session found.');
    }

    const { tokens, user } = await this.authService.refresh(rawToken, this.extractMeta(req));
    this.setRefreshCookie(res, tokens);
    return { data: this.toLoginResponse(tokens, user) };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const rawToken = this.readRefreshCookie(req);
    await this.authService.logout(rawToken);
    this.clearRefreshCookie(res);
  }

  @Get('me')
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<{ data: SafeUserDto }> {
    const user = await this.authService.getSafeUserOrThrow(currentUser.id);
    return { data: user };
  }

  private toLoginResponse(tokens: IssuedTokens, user: SafeUserDto) {
    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.accessTokenExpiresInSeconds,
      user,
    };
  }

  private extractMeta(req: Request): SessionMeta {
    return {
      userAgent: req.get('user-agent') ?? undefined,
      ipAddress: req.ip,
    };
  }

  private readRefreshCookie(req: Request): string | undefined {
    const cookies = req.cookies as Record<string, string> | undefined;
    return cookies?.[REFRESH_COOKIE_NAME];
  }

  private setRefreshCookie(res: Response, tokens: IssuedTokens): void {
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      ...this.cookieOptions(),
      expires: tokens.refreshTokenExpiresAt,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  private cookieOptions() {
    const apiPrefix = this.config.getOrThrow<string>('API_PREFIX');
    return {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: `/${apiPrefix}/auth`,
    };
  }
}
