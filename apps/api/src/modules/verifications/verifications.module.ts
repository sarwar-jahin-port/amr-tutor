import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../../storage/storage.module';
import { AdminVerificationsController } from './admin-verifications.controller';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [VerificationsController, AdminVerificationsController],
  providers: [VerificationsService],
})
export class VerificationsModule {}
