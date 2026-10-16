import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaginatedResponse, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogEntryDto, toAuditLogEntryDto } from './dto/audit-log.dto';

/** The most sensitive admin surface — ADMIN only, never MODERATOR (TRD §3.2: "explicitly authorized"). */
@Controller('admin/audit-logs')
@Roles(Role.ADMIN)
export class AuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: AuditLogQueryDto): Promise<PaginatedResponse<AuditLogEntryDto>> {
    const where = {
      ...(query.actorUserId && { actorUserId: query.actorUserId }),
      ...(query.targetType && { targetType: query.targetType }),
      ...(query.action && { action: query.action }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(rows.map(toAuditLogEntryDto), query.page, query.limit, total);
  }
}
