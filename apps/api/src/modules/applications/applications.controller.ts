import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ApplicationsService } from './applications.service';
import { ApplicationDetailDto } from './dto/application.dto';
import { CreateApplicationDto } from './dto/create-application.dto';

/**
 * The applying tutor's own side of the workflow (blueprint Phase 8): apply
 * to a listing, see application history, withdraw. See
 * ApplicationOwnerController for the listing owner's side of the same
 * workflow, and ApplicationDetailController for the shared detail route.
 */
@Controller()
@Roles(Role.TUTOR)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('listings/:id/applications')
  @HttpCode(HttpStatus.CREATED)
  async apply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) listingId: string,
    @Body() dto: CreateApplicationDto,
  ): Promise<{ data: ApplicationDetailDto }> {
    const data = await this.applicationsService.apply(user.id, listingId, dto);
    return { data };
  }

  @Get('users/me/applications')
  async listOwn(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ApplicationDetailDto>> {
    return this.applicationsService.listOwn(user.id, query);
  }

  @Patch('applications/:id/withdraw')
  async withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: ApplicationDetailDto }> {
    const data = await this.applicationsService.withdraw(user.id, id);
    return { data };
  }
}
