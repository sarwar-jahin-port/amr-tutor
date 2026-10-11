import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { GuardiansModule } from '../guardians/guardians.module';
import { TutorsModule } from '../tutors/tutors.module';
import { AdminUserDetailService } from './admin-user-detail.service';
import { AdminUsersController } from './admin-users.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuditModule, TutorsModule, GuardiansModule, AuthModule],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, AdminUserDetailService],
  exports: [UsersService],
})
export class UsersModule {}
