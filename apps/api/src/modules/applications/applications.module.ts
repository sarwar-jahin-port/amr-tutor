import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApplicationDetailController } from './application-detail.controller';
import { ApplicationOwnerController } from './application-owner.controller';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ApplicationsController, ApplicationOwnerController, ApplicationDetailController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
