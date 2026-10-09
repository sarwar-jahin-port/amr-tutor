import { Controller, Get, Query } from '@nestjs/common';
import { PaginatedResponse, SearchQueryDto } from '../../common/dto/pagination-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Division } from './data/locations.data';
import { ReferenceNameDto } from './dto/reference-name.dto';
import { ReferenceService } from './reference.service';

/**
 * Reference data endpoints (blueprint Phase 5 "Reference data should be
 * available before users create profiles or tuition listings"). All public:
 * only administrators can create/update/deactivate reference records
 * (docs/api_spec.md §3), and no such write endpoint exists yet.
 */
@Controller('references')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Public()
  @Get('universities')
  universities(@Query() query: SearchQueryDto): Promise<PaginatedResponse<ReferenceNameDto>> {
    return this.referenceService.universities(query);
  }

  @Public()
  @Get('subjects')
  subjects(@Query() query: SearchQueryDto): Promise<PaginatedResponse<ReferenceNameDto>> {
    return this.referenceService.subjects(query);
  }

  @Public()
  @Get('curricula')
  curricula(@Query() query: SearchQueryDto): Promise<PaginatedResponse<ReferenceNameDto>> {
    return this.referenceService.curricula(query);
  }

  @Public()
  @Get('grades')
  grades(@Query() query: SearchQueryDto): PaginatedResponse<ReferenceNameDto> {
    return this.referenceService.grades(query);
  }

  @Public()
  @Get('locations')
  locations(): { data: Division[] } {
    return { data: this.referenceService.locations() };
  }
}
