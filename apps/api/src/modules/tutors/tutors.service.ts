import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PaginatedResponse, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { TutorSearchQueryDto } from './dto/tutor-search-query.dto';
import {
  PublicTutorProfileDto,
  PublicTutorSummaryDto,
  toPublicTutorProfileDto,
  toPublicTutorSummaryDto,
} from './dto/public-tutor.dto';

const PUBLIC_INCLUDE = {
  university: { select: { id: true, name: true } },
  subjects: { include: { subject: { select: { id: true, name: true } } } },
  grades: { select: { gradeLevel: true } },
  curricula: { include: { curriculum: { select: { id: true, name: true } } } },
  locations: { select: { city: true, area: true, neighborhood: true } },
  availability: { select: { day: true, startMinute: true, endMinute: true } },
} satisfies Prisma.TutorProfileInclude;

@Injectable()
export class TutorsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: TutorSearchQueryDto): Promise<PaginatedResponse<PublicTutorSummaryDto>> {
    const where = this.publicWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.tutorProfile.findMany({
        where,
        include: PUBLIC_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tutorProfile.count({ where }),
    ]);

    return paginate(rows.map(toPublicTutorSummaryDto), query.page, query.limit, total);
  }

  async findPublicById(id: string): Promise<PublicTutorProfileDto> {
    const profile = await this.prisma.tutorProfile.findFirst({
      where: { id, isAvailable: true, user: { status: 'ACTIVE', deletedAt: null } },
      include: PUBLIC_INCLUDE,
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found.');
    }

    return toPublicTutorProfileDto(profile);
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
