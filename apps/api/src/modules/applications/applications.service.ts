import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { APPLICATION_INCLUDE, ApplicationDetailDto, toApplicationDetailDto } from './dto/application.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

/**
 * Statuses the listing owner may move an application INTO, keyed by its
 * current status. Matches docs/decisions/0001-phase-0-mvp-scope.md §4.2:
 * `SUBMITTED → VIEWED → SHORTLISTED → CONTACT_REQUESTED → ACCEPTED`, with
 * DECLINED reachable only from SUBMITTED/VIEWED/SHORTLISTED. ACCEPTED is
 * deliberately NOT reachable directly from SHORTLISTED — CONTACT_REQUESTED
 * is its own step, entered as a side effect of the Phase 9 contact-sharing
 * flow (ApplicationsService.markContactRequested), not this owner-status
 * endpoint. CLOSED is likewise not owner-status-driven here — it's set in
 * bulk when the listing itself closes (ListingOwnerService.close).
 */
const OWNER_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  SUBMITTED: ['VIEWED', 'SHORTLISTED', 'DECLINED'],
  VIEWED: ['SHORTLISTED', 'DECLINED'],
  SHORTLISTED: ['DECLINED'],
  CONTACT_REQUESTED: ['ACCEPTED'],
};

/**
 * The applicant can withdraw any time before the owner has made a final
 * call, including after contact sharing has started (decision record
 * §4.2: withdraw is valid from SUBMITTED/VIEWED/SHORTLISTED/
 * CONTACT_REQUESTED). A listing closing does not itself withdraw
 * outstanding applications — closing only blocks new ones; existing
 * applications are instead moved to CLOSED in bulk (ListingOwnerService.close).
 */
const WITHDRAWABLE_STATUSES: ApplicationStatus[] = ['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'CONTACT_REQUESTED'];

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async apply(
    tutorUserId: string,
    listingId: string,
    dto: CreateApplicationDto,
  ): Promise<ApplicationDetailDto> {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({ where: { userId: tutorUserId } });
    if (!tutorProfile) {
      throw new BadRequestException('Create your tutor profile before applying.');
    }

    // Same 404-for-unpublished semantics as ListingsService.findPublicById,
    // so a probing tutor can't distinguish a draft/paused listing from one
    // that doesn't exist at all.
    const listing = await this.prisma.tuitionListing.findFirst({
      where: { id: listingId, status: 'PUBLISHED' },
    });
    if (!listing) {
      throw new NotFoundException('Tuition listing not found.');
    }
    if (listing.guardianUserId === tutorUserId) {
      throw new BadRequestException('You cannot apply to your own listing.');
    }

    let application;
    try {
      application = await this.prisma.application.create({
        data: { listingId, tutorProfileId: tutorProfile.id, introduction: dto.introduction },
        include: APPLICATION_INCLUDE,
      });
    } catch (error) {
      // The @@unique([listingId, tutorProfileId]) constraint is what
      // actually stops two simultaneous applications racing each other —
      // this just converts the resulting DB error into the documented 409.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already applied to this listing.');
      }
      throw error;
    }

    await this.notifications.create(listing.guardianUserId, 'APPLICATION_RECEIVED', {
      applicationId: application.id,
      listingId,
    });

    return toApplicationDetailDto(application);
  }

  async listOwn(
    tutorUserId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ApplicationDetailDto>> {
    const where = { tutorProfile: { userId: tutorUserId } };

    const [rows, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: APPLICATION_INCLUDE,
        orderBy: { submittedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return paginate(rows.map(toApplicationDetailDto), query.page, query.limit, total);
  }

  async listForListing(
    guardianUserId: string,
    listingId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ApplicationDetailDto>> {
    await this.assertOwnsListing(guardianUserId, listingId);

    const where = { listingId };
    const [rows, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: APPLICATION_INCLUDE,
        orderBy: { submittedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return paginate(rows.map(toApplicationDetailDto), query.page, query.limit, total);
  }

  /** Reachable by either side of the relationship — the applicant or the listing owner. */
  async getDetail(userId: string, applicationId: string): Promise<ApplicationDetailDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: APPLICATION_INCLUDE,
    });

    if (
      !application ||
      (application.tutorProfile.userId !== userId && application.listing.guardianUserId !== userId)
    ) {
      throw new NotFoundException('Application not found.');
    }

    return toApplicationDetailDto(application);
  }

  async withdraw(tutorUserId: string, applicationId: string): Promise<ApplicationDetailDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: APPLICATION_INCLUDE,
    });

    if (!application || application.tutorProfile.userId !== tutorUserId) {
      throw new NotFoundException('Application not found.');
    }
    if (!WITHDRAWABLE_STATUSES.includes(application.status)) {
      throw new BadRequestException(`An application in ${application.status} status cannot be withdrawn.`);
    }

    const updated = await this.transitionOrThrow(application, 'WITHDRAWN');

    await this.notifications.create(application.listing.guardianUserId, 'APPLICATION_UPDATED', {
      applicationId: application.id,
      listingId: application.listing.id,
      status: 'WITHDRAWN',
    });

    return updated;
  }

  async updateStatus(
    guardianUserId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<ApplicationDetailDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: APPLICATION_INCLUDE,
    });

    if (!application || application.listing.guardianUserId !== guardianUserId) {
      throw new NotFoundException('Application not found.');
    }

    const allowedTargets = OWNER_TRANSITIONS[application.status] ?? [];
    if (!allowedTargets.includes(dto.status)) {
      throw new BadRequestException(
        `An application in ${application.status} status cannot move to ${dto.status}.`,
      );
    }

    const updated = await this.transitionOrThrow(application, dto.status);

    await this.notifications.create(application.tutorProfile.userId, 'APPLICATION_UPDATED', {
      applicationId: application.id,
      listingId: application.listing.id,
      status: dto.status,
    });

    return updated;
  }

  /**
   * Applies the transition with a conditional UPDATE scoped to the status
   * already read (`WHERE id = ... AND status = <expected>`). Postgres
   * commits at most one of two conflicting, concurrently-raced transitions
   * (e.g. the owner accepting while the tutor withdraws); the loser's
   * updateMany matches zero rows instead of silently overwriting the
   * winner (blueprint Phase 8 concurrency requirement).
   */
  private async transitionOrThrow(
    application: { id: string; status: ApplicationStatus },
    target: ApplicationStatus,
  ): Promise<ApplicationDetailDto> {
    const result = await this.prisma.application.updateMany({
      where: { id: application.id, status: application.status },
      data: { status: target },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'This application was just updated by someone else. Please refresh and try again.',
      );
    }

    const updated = await this.prisma.application.findUniqueOrThrow({
      where: { id: application.id },
      include: APPLICATION_INCLUDE,
    });

    return toApplicationDetailDto(updated);
  }

  private async assertOwnsListing(guardianUserId: string, listingId: string): Promise<void> {
    const listing = await this.prisma.tuitionListing.findFirst({
      where: { id: listingId, guardianUserId },
      select: { id: true },
    });
    if (!listing) {
      throw new NotFoundException('Tuition listing not found.');
    }
  }

  /**
   * Shared by the Phase 9 contact-sharing and messaging flows, both scoped
   * to one application: confirms the caller is the applicant or the
   * listing owner (same 404-for-non-participant rule as getDetail) and
   * returns just the ids those flows need.
   */
  async assertParticipant(
    userId: string,
    applicationId: string,
  ): Promise<{
    id: string;
    status: ApplicationStatus;
    listingId: string;
    tutorUserId: string;
    guardianUserId: string;
  }> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
        listingId: true,
        listing: { select: { guardianUserId: true } },
        tutorProfile: { select: { userId: true } },
      },
    });

    if (
      !application ||
      (application.tutorProfile.userId !== userId && application.listing.guardianUserId !== userId)
    ) {
      throw new NotFoundException('Application not found.');
    }

    return {
      id: application.id,
      status: application.status,
      listingId: application.listingId,
      tutorUserId: application.tutorProfile.userId,
      guardianUserId: application.listing.guardianUserId,
    };
  }

  /**
   * The one status change the contact-sharing flow drives directly (Phase
   * 9): SHORTLISTED -> CONTACT_REQUESTED on the first contact-share
   * request. A no-op, not an error, once the application has moved past
   * SHORTLISTED by the time this runs (already CONTACT_REQUESTED/ACCEPTED,
   * or raced by a withdrawal/decline) — contact sharing itself stays valid
   * in all of those cases; only this status bump becomes irrelevant.
   */
  async markContactRequested(applicationId: string, currentStatus: ApplicationStatus): Promise<void> {
    if (currentStatus !== 'SHORTLISTED') return;
    await this.prisma.application.updateMany({
      where: { id: applicationId, status: 'SHORTLISTED' },
      data: { status: 'CONTACT_REQUESTED' },
    });
  }
}
