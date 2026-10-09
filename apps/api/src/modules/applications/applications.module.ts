import { Module } from '@nestjs/common';
import { ApplicationDetailController } from './application-detail.controller';
import { ApplicationOwnerController } from './application-owner.controller';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  controllers: [ApplicationsController, ApplicationOwnerController, ApplicationDetailController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
