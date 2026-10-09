import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AdminListingsService } from './admin-listings.service';
import { AdminListingQueueQueryDto, UpdateListingModerationStatusDto } from './dto/admin-listing-status.dto';
import { PublicListingDetailDto } from './dto/public-listing.dto';

/** Listing moderation — ADMIN only (decision record item 10: "the final call should be admin's"). */
@Controller('admin/listings')
@Roles(Role.ADMIN)
export class AdminListingsController {
  constructor(private readonly adminListingsService: AdminListingsService) {}

  @Get()
  async listQueue(@Query() query: AdminListingQueueQueryDto): Promise<PaginatedResponse<PublicListingDetailDto>> {
    return this.adminListingsService.listQueue(query.status, query);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingModerationStatusDto,
  ): Promise<{ data: PublicListingDetailDto }> {
    const data = await this.adminListingsService.updateStatus(user.id, id, dto);
    return { data };
  }
}
