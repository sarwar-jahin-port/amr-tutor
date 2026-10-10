import { ListingStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const ADMIN_SETTABLE_LISTING_STATUSES = ['PUBLISHED', 'REJECTED', 'PAUSED'] as const;
export type AdminSettableListingStatus = (typeof ADMIN_SETTABLE_LISTING_STATUSES)[number];

export class UpdateListingModerationStatusDto {
  @IsIn(ADMIN_SETTABLE_LISTING_STATUSES)
  status!: AdminSettableListingStatus;

  /** Required for REJECTED (checked in the service) — the guardian needs to know what to fix. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class AdminListingQueueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(ListingStatus))
  status?: ListingStatus;
}
