import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateListingDto, UpdateListingDto } from './dto/create-listing.dto';
import { PublicListingDetailDto } from './dto/public-listing.dto';
import { ListingOwnerService } from './listing-owner.service';

/**
 * The guardian's own listing management (blueprint Phase 7). Separate
 * from ListingsController's public search/detail (Phase 5) — these routes
 * require the GUARDIAN role and see every status, not just PUBLISHED.
 */
@Controller()
@Roles(Role.GUARDIAN)
export class ListingOwnerController {
  constructor(private readonly listingOwnerService: ListingOwnerService) {}

  @Post('listings')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateListingDto,
  ): Promise<{ data: PublicListingDetailDto }> {
    const data = await this.listingOwnerService.create(user.id, dto);
    return { data };
  }

  @Get('users/me/listings')
  async listOwn(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<PublicListingDetailDto>> {
    return this.listingOwnerService.listOwn(user.id, query);
  }

  @Get('users/me/listings/:id')
  async getOwn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: PublicListingDetailDto }> {
    const data = await this.listingOwnerService.getOwn(user.id, id);
    return { data };
  }

  @Patch('users/me/listings/:id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
  ): Promise<{ data: PublicListingDetailDto }> {
    const data = await this.listingOwnerService.update(user.id, id, dto);
    return { data };
  }

  @Post('users/me/listings/:id/submit')
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: PublicListingDetailDto }> {
    const data = await this.listingOwnerService.submit(user.id, id);
    return { data };
  }

  @Post('users/me/listings/:id/close')
  async close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: PublicListingDetailDto }> {
    const data = await this.listingOwnerService.close(user.id, id);
    return { data };
  }
}
