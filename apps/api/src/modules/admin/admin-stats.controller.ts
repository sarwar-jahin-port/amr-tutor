import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminStatsService } from './admin-stats.service';
import { AdminStatsQueryDto } from './dto/admin-stats-query.dto';
import type { AdminStatsDto } from './dto/admin-stats.dto';

@Controller('admin/stats')
@Roles(Role.ADMIN, Role.MODERATOR, Role.VERIFIER)
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @Get()
  async getStats(@Query() query: AdminStatsQueryDto): Promise<{ data: AdminStatsDto }> {
    const data = await this.adminStatsService.getStats(query.days);
    return { data };
  }
}
