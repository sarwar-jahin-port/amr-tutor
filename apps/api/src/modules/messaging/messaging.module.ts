import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContactShareController } from './contact-share.controller';
import { ContactShareService } from './contact-share.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [ApplicationsModule, NotificationsModule],
  controllers: [ContactShareController, ConversationsController],
  providers: [ContactShareService, ConversationsService],
})
export class MessagingModule {}
