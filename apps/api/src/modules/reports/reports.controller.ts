import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { PaginatedResponse, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportSummaryDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

/** Any authenticated user may file a report (blueprint Phase 11) — moderation itself is a separate, role-gated surface (AdminReportsController). */
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ): Promise<{ data: ReportSummaryDto }> {
    const data = await this.reportsService.create(user.id, dto);
    return { data };
  }

  @Get('users/me/reports')
  async listOwn(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ReportSummaryDto>> {
    return this.reportsService.listOwn(user.id, query);
  }
}
