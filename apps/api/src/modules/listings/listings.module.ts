import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminListingsController } from './admin-listings.controller';
import { AdminListingsService } from './admin-listings.service';
import { ListingOwnerController } from './listing-owner.controller';
import { ListingOwnerService } from './listing-owner.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [NotificationsModule, AuditModule],
  controllers: [ListingsController, ListingOwnerController, AdminListingsController],
  providers: [ListingsService, ListingOwnerService, AdminListingsService],
})
export class ListingsModule {}
