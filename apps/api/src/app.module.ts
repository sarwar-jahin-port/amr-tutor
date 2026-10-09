import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // apps/api is the process cwd when run via its own package scripts,
      // so the monorepo-root .env is one level up from there.
      envFilePath: ['../../.env', '.env'],
      validate: validateEnv,
    }),
    // Bound via @UseGuards() only on the specific routes that need it
    // (register/login — see AuthController), not globally: APP_GUARD-bound
    // guards can't be overridden per-test, and most routes don't need
    // IP-based throttling on top of authentication.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // Order matters: authenticate first, then check roles.
    // Every route is protected by default; see @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
