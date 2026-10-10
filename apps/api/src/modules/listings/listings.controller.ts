import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { PaginatedResponse } from '../../common/dto/pagination-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ListingSearchQueryDto } from './dto/listing-search-query.dto';
import { PublicListingDetailDto, PublicListingSummaryDto } from './dto/public-listing.dto';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Public()
  @Get()
  search(
    @Query() query: ListingSearchQueryDto,
  ): Promise<PaginatedResponse<PublicListingSummaryDto>> {
    return this.listingsService.search(query);
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: PublicListingDetailDto }> {
    const data = await this.listingsService.findPublicById(id);
    return { data };
  }
}
