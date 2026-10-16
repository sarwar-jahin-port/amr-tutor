import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { PaginatedResponse } from '../../common/dto/pagination-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { PublicTutorProfileDto, PublicTutorSummaryDto } from './dto/public-tutor.dto';
import { TutorSearchQueryDto } from './dto/tutor-search-query.dto';
import { TutorsService } from './tutors.service';

@Controller('tutors')
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Public()
  @Get()
  search(@Query() query: TutorSearchQueryDto): Promise<PaginatedResponse<PublicTutorSummaryDto>> {
    return this.tutorsService.search(query);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: PublicTutorProfileDto }> {
    const data = await this.tutorsService.findPublicById(id);
    return { data };
  }
}
