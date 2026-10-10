import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ApplicationStatus, Prisma } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { CreateListingDto, UpdateListingDto } from './dto/create-listing.dto';
import {
  LISTING_INCLUDE,
  PublicListingDetailDto,
  toPublicListingDetailDto,
} from './dto/public-listing.dto';

/** Every ApplicationStatus that isn't already a final outcome. */
const OPEN_APPLICATION_STATUSES: ApplicationStatus[] = ['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'CONTACT_REQUESTED'];

@Injectable()
export class ListingOwnerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateListingDto): Promise<PublicListingDetailDto> {
    await this.assertGuardianProfileExists(userId);
    await this.assertActiveSubjects(dto.subjectIds);

    const listing = await this.prisma.tuitionListing.create({
      data: {
        guardianUserId: userId,
        title: dto.title,
        classLevel: dto.classLevel,
        city: dto.city,
        area: dto.area,
        daysPerWeek: dto.daysPerWeek,
        subjects: { create: dto.subjectIds.map((subjectId) => ({ subjectId })) },
      },
      include: LISTING_INCLUDE,
    });

    return toPublicListingDetailDto(listing);
  }

  async listOwn(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<PublicListingDetailDto>> {
    const where = { guardianUserId: userId };

    const [rows, total] = await Promise.all([
      this.prisma.tuitionListing.findMany({
        where,
        include: LISTING_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tuitionListing.count({ where }),
    ]);

    return paginate(rows.map(toPublicListingDetailDto), query.page, query.limit, total);
  }

  async getOwn(userId: string, listingId: string): Promise<PublicListingDetailDto> {
    const listing = await this.findOwnedOrThrow(userId, listingId);
    return toPublicListingDetailDto(listing);
  }

  async update(userId: string, listingId: string, dto: UpdateListingDto): Promise<PublicListingDetailDto> {
    const existing = await this.findOwnedOrThrow(userId, listingId);

    if (dto.subjectIds) {
      await this.assertActiveSubjects(dto.subjectIds);
    }
    if (dto.curriculumId) {
      await this.assertActiveCurriculum(dto.curriculumId);
    }
    if (dto.universityPreferenceIds) {
      await this.assertActiveUniversities(dto.universityPreferenceIds);
    }
    this.assertSalaryRangeValid(
      dto.salaryMin ?? existing.salaryMin ?? undefined,
      dto.salaryMax ?? existing.salaryMax ?? undefined,
    );
    const schedules = dto.schedules?.map((slot) => this.toScheduleRow(slot));

    const listing = await this.prisma.$transaction(async (tx) => {
      if (dto.subjectIds) {
        await tx.listingSubject.deleteMany({ where: { listingId } });
        await tx.listingSubject.createMany({
          data: dto.subjectIds.map((subjectId) => ({ listingId, subjectId })),
        });
      }
      if (dto.universityPreferenceIds) {
        await tx.listingUniversityPreference.deleteMany({ where: { listingId } });
        await tx.listingUniversityPreference.createMany({
          data: dto.universityPreferenceIds.map((universityId) => ({ listingId, universityId })),
        });
      }
      if (schedules) {
        await tx.listingSchedule.deleteMany({ where: { listingId } });
        await tx.listingSchedule.createMany({
          data: schedules.map((slot) => ({ listingId, ...slot })),
        });
      }

      // Editing a published listing must not silently bypass moderation
      // (docs/api_spec.md §5) — it goes back to PENDING_REVIEW, same as a
      // fresh resubmission.
      const statusUpdate = existing.status === 'PUBLISHED' ? ({ status: 'PENDING_REVIEW' } as const) : {};

      return tx.tuitionListing.update({
        where: { id: listingId },
        data: {
          title: dto.title,
          classLevel: dto.classLevel,
          city: dto.city,
          area: dto.area,
          neighborhood: dto.neighborhood,
          locationDescription: dto.locationDescription,
          daysPerWeek: dto.daysPerWeek,
          teachingMode: dto.teachingMode,
          salaryMin: dto.salaryMin,
          salaryMax: dto.salaryMax,
          preferredGender: dto.preferredGender,
          curriculumId: dto.curriculumId,
          description: dto.description,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          ...statusUpdate,
        },
        include: LISTING_INCLUDE,
      });
    });

    return toPublicListingDetailDto(listing);
  }

  /**
   * DRAFT or REJECTED -> PENDING_REVIEW. There is no action here that moves
   * a listing to PUBLISHED — that's an admin decision (decision record
   * 0001 §10: "the final call should be admin's"), and the admin review
   * queue is explicitly blueprint Phase 11 ("Listing review... Listing
   * suspension or rejection"), not this phase.
   */
  async submit(userId: string, listingId: string): Promise<PublicListingDetailDto> {
    const existing = await this.findOwnedOrThrow(userId, listingId);

    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
      throw new BadRequestException(
        `A listing in ${existing.status} status cannot be submitted for review.`,
      );
    }
    this.assertRequiredFieldsComplete(existing);

    const listing = await this.prisma.tuitionListing.update({
      where: { id: listingId },
      data: { status: 'PENDING_REVIEW' },
      include: LISTING_INCLUDE,
    });

    return toPublicListingDetailDto(listing);
  }

  /**
   * Idempotent: closing an already-closed listing is a no-op, not an
   * error. Also moves every outstanding application to CLOSED (decision
   * record §4.2: "any non-terminal state -> CLOSED" when the listing
   * itself closes) — ACCEPTED/DECLINED/WITHDRAWN applications are already
   * final and are left untouched.
   */
  async close(userId: string, listingId: string): Promise<PublicListingDetailDto> {
    const existing = await this.findOwnedOrThrow(userId, listingId);

    if (existing.status === 'CLOSED') {
      return toPublicListingDetailDto(existing);
    }

    const listing = await this.prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: { listingId, status: { in: OPEN_APPLICATION_STATUSES } },
        data: { status: 'CLOSED' },
      });

      return tx.tuitionListing.update({
        where: { id: listingId },
        data: { status: 'CLOSED', closedAt: new Date() },
        include: LISTING_INCLUDE,
      });
    });

    return toPublicListingDetailDto(listing);
  }

  private assertRequiredFieldsComplete(listing: {
    title: string;
    classLevel: string;
    city: string;
    area: string;
    daysPerWeek: number;
    subjects: unknown[];
  }): void {
    const missing: string[] = [];
    if (!listing.title) missing.push('title');
    if (!listing.classLevel) missing.push('classLevel');
    if (!listing.city) missing.push('city');
    if (!listing.area) missing.push('area');
    if (!listing.daysPerWeek) missing.push('daysPerWeek');
    if (listing.subjects.length === 0) missing.push('subjects');

    if (missing.length > 0) {
      throw new BadRequestException(
        `This listing is missing required information before it can be submitted: ${missing.join(', ')}.`,
      );
    }
  }

  private toScheduleRow(slot: { day: string; startTime?: string; endTime?: string }) {
    if ((slot.startTime === undefined) !== (slot.endTime === undefined)) {
      throw new BadRequestException(
        `A schedule slot for ${slot.day} must include both startTime and endTime, or neither.`,
      );
    }
    if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
      throw new BadRequestException(
        `On ${slot.day}, startTime (${slot.startTime}) must be earlier than endTime (${slot.endTime}).`,
      );
    }

    return {
      day: slot.day as Prisma.ListingScheduleCreateManyInput['day'],
      startMinute: slot.startTime ? this.toMinutes(slot.startTime) : null,
      endMinute: slot.endTime ? this.toMinutes(slot.endTime) : null,
    };
  }

  private toMinutes(time: string): number {
    const [hoursPart, minutesPart] = time.split(':');
    return Number(hoursPart) * 60 + Number(minutesPart);
  }

  private async findOwnedOrThrow(userId: string, listingId: string) {
    const listing = await this.prisma.tuitionListing.findFirst({
      where: { id: listingId, guardianUserId: userId },
      include: LISTING_INCLUDE,
    });

    if (!listing) {
      throw new NotFoundException('Tuition listing not found.');
    }

    return listing;
  }

  private async assertGuardianProfileExists(userId: string): Promise<void> {
    const profile = await this.prisma.guardianProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new BadRequestException('Create your guardian profile before publishing a listing.');
    }
  }

  private async assertActiveSubjects(subjectIds: string[]): Promise<void> {
    const count = await this.prisma.subject.count({ where: { id: { in: subjectIds }, isActive: true } });
    if (count !== subjectIds.length) {
      throw new BadRequestException('Every subjectId must reference an active subject.');
    }
  }

  private async assertActiveCurriculum(curriculumId: string): Promise<void> {
    const curriculum = await this.prisma.curriculum.findFirst({ where: { id: curriculumId, isActive: true } });
    if (!curriculum) {
      throw new BadRequestException('curriculumId must reference an active curriculum.');
    }
  }

  private async assertActiveUniversities(universityIds: string[]): Promise<void> {
    const count = await this.prisma.university.count({
      where: { id: { in: universityIds }, isActive: true },
    });
    if (count !== universityIds.length) {
      throw new BadRequestException('Every universityPreferenceId must reference an active university.');
    }
  }

  private assertSalaryRangeValid(min: number | undefined, max: number | undefined): void {
    if (min !== undefined && max !== undefined && min > max) {
      throw new BadRequestException('salaryMin cannot exceed salaryMax.');
    }
  }
}
