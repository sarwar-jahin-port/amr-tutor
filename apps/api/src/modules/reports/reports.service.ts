import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, ReportStatus } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { PaginatedResponse, PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationsService } from '../applications/applications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportModeratorDto, ReportSummaryDto, toReportModeratorDto, toReportSummaryDto } from './dto/report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

const REPORT_INCLUDE = { reporter: { select: { id: true, email: true } } } satisfies Prisma.ReportInclude;

/** Reports are terminal once resolved — only OPEN/UNDER_REVIEW ones block a duplicate report of the same target. */
const ACTIVE_REPORT_STATUSES: ReportStatus[] = ['OPEN', 'UNDER_REVIEW'];

/** Matches decision record §4.5 exactly: `OPEN → UNDER_REVIEW → ACTION_TAKEN | DISMISSED`. */
const STATUS_TRANSITIONS: Partial<Record<ReportStatus, ReportStatus[]>> = {
  OPEN: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['ACTION_TAKEN', 'DISMISSED'],
};
const TERMINAL_STATUSES: ReportStatus[] = ['ACTION_TAKEN', 'DISMISSED'];

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly notifications: NotificationsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto): Promise<ReportSummaryDto> {
    const targets = [dto.targetUserId, dto.tutorProfileId, dto.listingId, dto.applicationId].filter(Boolean);
    if (targets.length !== 1) {
      throw new BadRequestException(
        'Provide exactly one of targetUserId, tutorProfileId, listingId, or applicationId.',
      );
    }

    const data = await this.resolveTarget(reporterId, dto);

    const existing = await this.prisma.report.findFirst({
      where: { reporterUserId: reporterId, status: { in: ACTIVE_REPORT_STATUSES }, ...data },
    });
    if (existing) {
      throw new ConflictException('You already have an open report against this target.');
    }

    const report = await this.prisma.report.create({
      data: { reporterUserId: reporterId, category: dto.category, description: dto.description, ...data },
      include: REPORT_INCLUDE,
    });

    return toReportSummaryDto(report);
  }

  async listOwn(reporterId: string, query: PaginationQueryDto): Promise<PaginatedResponse<ReportSummaryDto>> {
    const where = { reporterUserId: reporterId };

    const [rows, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: REPORT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return paginate(rows.map(toReportSummaryDto), query.page, query.limit, total);
  }

  async listQueue(
    status: ReportStatus | undefined,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ReportModeratorDto>> {
    const where = status ? { status } : {};

    const [rows, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: REPORT_INCLUDE,
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return paginate(rows.map(toReportModeratorDto), query.page, query.limit, total);
  }

  async updateStatus(
    moderatorId: string,
    reportId: string,
    dto: UpdateReportStatusDto,
  ): Promise<ReportModeratorDto> {
    const report = await this.prisma.report.findUnique({ where: { id: reportId }, include: REPORT_INCLUDE });
    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    const allowedTargets = STATUS_TRANSITIONS[report.status] ?? [];
    if (!allowedTargets.includes(dto.status)) {
      throw new BadRequestException(`A report in ${report.status} status cannot move to ${dto.status}.`);
    }
    if (TERMINAL_STATUSES.includes(dto.status) && !dto.resolution) {
      throw new BadRequestException('A resolution note is required to take action or dismiss a report.');
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        assignedModeratorId: moderatorId,
        resolvedAt: TERMINAL_STATUSES.includes(dto.status) ? new Date() : undefined,
      },
      include: REPORT_INCLUDE,
    });

    await this.auditLog.record({
      actorUserId: moderatorId,
      action: 'REPORT_STATUS_CHANGE',
      targetType: 'Report',
      targetId: reportId,
      outcome: dto.status,
      metadata: { resolution: dto.resolution },
    });

    if (TERMINAL_STATUSES.includes(dto.status)) {
      await this.notifications.create(report.reporterUserId, 'REPORT_UPDATED', { reportId, status: dto.status });
    }

    return toReportModeratorDto(updated);
  }

  private async resolveTarget(
    reporterId: string,
    dto: CreateReportDto,
  ): Promise<{ targetUserId?: string; listingId?: string; applicationId?: string }> {
    if (dto.listingId) {
      const listing = await this.prisma.tuitionListing.findUnique({ where: { id: dto.listingId } });
      if (!listing) throw new NotFoundException('Listing not found.');
      return { listingId: dto.listingId };
    }

    if (dto.applicationId) {
      // Only a participant may report an application — same privacy-preserving 404 pattern as the application/messaging modules.
      await this.applications.assertParticipant(reporterId, dto.applicationId);
      return { applicationId: dto.applicationId };
    }

    let targetUserId = dto.targetUserId;
    if (dto.tutorProfileId) {
      const profile = await this.prisma.tutorProfile.findUnique({
        where: { id: dto.tutorProfileId },
        select: { userId: true },
      });
      if (!profile) throw new NotFoundException('Tutor not found.');
      targetUserId = profile.userId;
    }

    if (!targetUserId) {
      throw new BadRequestException('Unable to resolve a report target.');
    }
    if (targetUserId === reporterId) {
      throw new BadRequestException('You cannot report yourself.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return { targetUserId };
  }
}
