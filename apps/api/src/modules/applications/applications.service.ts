import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, NotificationType, Prisma } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { APPLICATION_INCLUDE, ApplicationDetailDto, toApplicationDetailDto } from './dto/application.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

/**
 * Statuses the listing owner may move an application INTO, keyed by its
 * current status (blueprint Phase 8 state machine). Every status missing
 * from this map (ACCEPTED, DECLINED, WITHDRAWN, CLOSED, CONTACT_REQUESTED)
 * is terminal from the owner's side — CONTACT_REQUESTED belongs to the
 * Phase 9 contact-sharing flow, not an owner-triggered status change.
 */
const OWNER_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  SUBMITTED: ['VIEWED', 'SHORTLISTED', 'DECLINED'],
  VIEWED: ['SHORTLISTED', 'DECLINED'],
  SHORTLISTED: ['ACCEPTED', 'DECLINED'],
};

/**
 * The applicant can withdraw any time before the owner has made a final
 * call. A listing closing does not itself withdraw outstanding
 * applications — closing only blocks new ones; existing applications stay
 * reviewable (blueprint Phase 8: "Define explicitly whether existing
 * applications can still be reviewed" — here, yes).
 */
const WITHDRAWABLE_STATUSES: ApplicationStatus[] = ['SUBMITTED', 'VIEWED', 'SHORTLISTED'];

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

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

    await this.notify(listing.guardianUserId, 'APPLICATION_RECEIVED', {
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

    await this.notify(application.listing.guardianUserId, 'APPLICATION_UPDATED', {
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

    await this.notify(application.tutorProfile.userId, 'APPLICATION_UPDATED', {
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

  private async notify(userId: string, type: NotificationType, payload: Record<string, unknown>): Promise<void> {
    await this.prisma.notification.create({ data: { userId, type, payload: payload as Prisma.InputJsonValue } });
  }
}
