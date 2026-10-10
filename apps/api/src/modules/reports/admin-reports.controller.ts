import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ReportQueueQueryDto } from './dto/report-queue-query.dto';
import { ReportModeratorDto } from './dto/report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
@Roles(Role.MODERATOR, Role.ADMIN)
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async listQueue(@Query() query: ReportQueueQueryDto): Promise<PaginatedResponse<ReportModeratorDto>> {
    return this.reportsService.listQueue(query.status, query);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportStatusDto,
  ): Promise<{ data: ReportModeratorDto }> {
    const data = await this.reportsService.updateStatus(user.id, id, dto);
    return { data };
  }
}
