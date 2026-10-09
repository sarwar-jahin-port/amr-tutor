import { Module } from '@nestjs/common';
import { ListingOwnerController } from './listing-owner.controller';
import { ListingOwnerService } from './listing-owner.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  controllers: [ListingsController, ListingOwnerController],
  providers: [ListingsService, ListingOwnerService],
})
export class ListingsModule {}
