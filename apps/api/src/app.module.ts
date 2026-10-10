import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { GuardiansModule } from './modules/guardians/guardians.module';
import { HealthModule } from './modules/health/health.module';
import { ListingsModule } from './modules/listings/listings.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TutorsModule } from './modules/tutors/tutors.module';
import { UsersModule } from './modules/users/users.module';
import { VerificationsModule } from './modules/verifications/verifications.module';

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
    // IP-based throttling on top of authentication. ttl/limit are
    // env-overridable (see env.validation.ts's AUTH_RATE_LIMIT_* doc
    // comment) for the one case that legitimately needs it — the
    // long-running API process behind the Playwright web e2e suite,
    // which registers/logs in several real accounts per journey.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('AUTH_RATE_LIMIT_TTL_MS') ?? 60_000,
          limit: config.get<number>('AUTH_RATE_LIMIT_MAX') ?? 5,
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ReferenceModule,
    TutorsModule,
    ListingsModule,
    GuardiansModule,
    ApplicationsModule,
    MessagingModule,
    VerificationsModule,
    ReportsModule,
  ],
  providers: [
    // Order matters: authenticate first, then check roles.
    // Every route is protected by default; see @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
