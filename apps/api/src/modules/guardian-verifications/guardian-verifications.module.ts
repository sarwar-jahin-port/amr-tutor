import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminGuardianVerificationsController } from './admin-guardian-verifications.controller';
import { GuardianVerificationsController } from './guardian-verifications.controller';
import { GuardianVerificationsService } from './guardian-verifications.service';

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [GuardianVerificationsController, AdminGuardianVerificationsController],
  providers: [GuardianVerificationsService],
  exports: [GuardianVerificationsService],
})
export class GuardianVerificationsModule {}
