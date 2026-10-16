import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ApplicationsService } from './applications.service';
import { ApplicationDetailDto } from './dto/application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

/**
 * The listing owner's side of the application workflow (blueprint Phase
 * 8): see applicants for a listing owned by this account, and move an
 * application through the state machine (shortlist, accept, decline).
 */
@Controller()
@Roles(Role.GUARDIAN)
export class ApplicationOwnerController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('listings/:id/applications')
  async listForListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) listingId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ApplicationDetailDto>> {
    return this.applicationsService.listForListing(user.id, listingId, query);
  }

  @Patch('applications/:id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ): Promise<{ data: ApplicationDetailDto }> {
    const data = await this.applicationsService.updateStatus(user.id, id, dto);
    return { data };
  }
}
