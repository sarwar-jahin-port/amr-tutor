import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PaginatedResponse, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { TutorSearchQueryDto } from './dto/tutor-search-query.dto';
import {
  PublicTutorProfileDto,
  PublicTutorSummaryDto,
  TUTOR_PROFILE_INCLUDE,
  toPublicTutorProfileDto,
  toPublicTutorSummaryDto,
} from './dto/public-tutor.dto';

@Injectable()
export class TutorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async search(query: TutorSearchQueryDto): Promise<PaginatedResponse<PublicTutorSummaryDto>> {
    const where = this.publicWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.tutorProfile.findMany({
        where,
        include: TUTOR_PROFILE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tutorProfile.count({ where }),
    ]);

    const dtos = await Promise.all(
      rows.map((row) => this.withPhotoUrl(toPublicTutorSummaryDto(row), row.profilePhotoKey)),
    );

    return paginate(dtos, query.page, query.limit, total);
  }

  async findPublicById(id: string): Promise<PublicTutorProfileDto> {
    const profile = await this.prisma.tutorProfile.findFirst({
      where: { id, isAvailable: true, user: { status: 'ACTIVE', deletedAt: null } },
      include: TUTOR_PROFILE_INCLUDE,
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found.');
    }

    return this.withPhotoUrl(toPublicTutorProfileDto(profile), profile.profilePhotoKey);
  }

  /** Signs profilePhotoKey into a short-lived URL — never done inside the pure DTO mapper, which has no access to StorageService. */
  private async withPhotoUrl<T extends { profilePhotoUrl: string | null }>(dto: T, key: string | null): Promise<T> {
    if (!key) return dto;
    return { ...dto, profilePhotoUrl: await this.storage.generateDownloadUrl(key) };
  }

  /**
   * Only currently-available tutors from active, non-deleted accounts are
   * ever publicly visible — matches the detail endpoint's own check so a
   * profile can't be reached one way but not the other.
   */
  private publicWhere(query: TutorSearchQueryDto): Prisma.TutorProfileWhereInput {
    return {
      isAvailable: true,
      user: { status: 'ACTIVE', deletedAt: null },
      ...(query.universityId && { universityId: query.universityId }),
      ...(query.academicStatus && { academicStatus: query.academicStatus }),
      ...(query.subjectId && { subjects: { some: { subjectId: query.subjectId } } }),
      ...(query.curriculumId && { curricula: { some: { curriculumId: query.curriculumId } } }),
      ...(query.gradeLevel && { grades: { some: { gradeLevel: query.gradeLevel } } }),
      ...((query.city || query.area) && {
        locations: {
          some: {
            ...(query.city && { city: { equals: query.city, mode: 'insensitive' as const } }),
            ...(query.area && { area: { contains: query.area, mode: 'insensitive' as const } }),
          },
        },
      }),
    };
  }
}
