import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ListingStatus } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminSettableListingStatus, UpdateListingModerationStatusDto } from './dto/admin-listing-status.dto';
import { LISTING_INCLUDE, PublicListingDetailDto, toPublicListingDetailDto } from './dto/public-listing.dto';

/**
 * Matches decision record §4.1: the only way to PUBLISHED or REJECTED is an
 * admin decision from PENDING_REVIEW, and an already-live listing can be
 * paused or taken down (REJECTED) but a guardian editing it is what sends
 * it back to PENDING_REVIEW (ListingOwnerService.update), not this endpoint.
 */
const ADMIN_LISTING_TRANSITIONS: Partial<Record<ListingStatus, AdminSettableListingStatus[]>> = {
  PENDING_REVIEW: ['PUBLISHED', 'REJECTED'],
  PUBLISHED: ['PAUSED', 'REJECTED'],
  PAUSED: ['PUBLISHED', 'REJECTED'],
};

@Injectable()
export class AdminListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listQueue(
    status: ListingStatus | undefined,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<PublicListingDetailDto>> {
    const where = { status: status ?? 'PENDING_REVIEW' };

    const [rows, total] = await Promise.all([
      this.prisma.tuitionListing.findMany({
        where,
        include: LISTING_INCLUDE,
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tuitionListing.count({ where }),
    ]);

    return paginate(rows.map(toPublicListingDetailDto), query.page, query.limit, total);
  }

  async updateStatus(
    adminId: string,
    listingId: string,
    dto: UpdateListingModerationStatusDto,
  ): Promise<PublicListingDetailDto> {
    const existing = await this.prisma.tuitionListing.findUnique({
      where: { id: listingId },
      include: LISTING_INCLUDE,
    });
    if (!existing) {
      throw new NotFoundException('Listing not found.');
    }

    const allowedTargets = ADMIN_LISTING_TRANSITIONS[existing.status] ?? [];
    if (!allowedTargets.includes(dto.status)) {
      throw new BadRequestException(`A listing in ${existing.status} status cannot move to ${dto.status}.`);
    }
    if (dto.status === 'REJECTED' && !dto.reason) {
      throw new BadRequestException('A reason is required to reject a listing.');
    }

    const updated = await this.prisma.tuitionListing.update({
      where: { id: listingId },
      data: {
        status: dto.status,
        // First approval only — re-publishing after a pause keeps the
        // original publishedAt rather than resetting it.
        publishedAt: dto.status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      },
      include: LISTING_INCLUDE,
    });

    await this.auditLog.record({
      actorUserId: adminId,
      action: 'LISTING_STATUS_CHANGE',
      targetType: 'TuitionListing',
      targetId: listingId,
      outcome: dto.status,
      metadata: { reason: dto.reason },
    });

    await this.notifications.create(existing.guardianUserId, 'LISTING_UPDATED', {
      listingId,
      status: dto.status,
    });

    return toPublicListingDetailDto(updated);
  }
}
