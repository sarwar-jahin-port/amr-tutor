import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PaginatedResponse, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { ListingSearchQueryDto, ListingSortOption } from './dto/listing-search-query.dto';
import {
  LISTING_INCLUDE,
  PublicListingDetailDto,
  PublicListingSummaryDto,
  toPublicListingDetailDto,
  toPublicListingSummaryDto,
} from './dto/public-listing.dto';

const SORT_ORDER_BY: Record<ListingSortOption, Prisma.TuitionListingOrderByWithRelationInput> = {
  newest: { publishedAt: 'desc' },
  salary_asc: { salaryMin: 'asc' },
  salary_desc: { salaryMax: 'desc' },
};

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: ListingSearchQueryDto): Promise<PaginatedResponse<PublicListingSummaryDto>> {
    const where = this.publicWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.tuitionListing.findMany({
        where,
        include: LISTING_INCLUDE,
        orderBy: SORT_ORDER_BY[query.sort],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tuitionListing.count({ where }),
    ]);

    return paginate(rows.map(toPublicListingSummaryDto), query.page, query.limit, total);
  }

  async findPublicById(id: string): Promise<PublicListingDetailDto> {
    const listing = await this.prisma.tuitionListing.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: LISTING_INCLUDE,
    });

    if (!listing) {
      throw new NotFoundException('Tuition listing not found.');
    }

    return toPublicListingDetailDto(listing);
  }

  /**
   * Only PUBLISHED listings are ever publicly visible — drafts, listings
   * pending review, paused/filled/closed/expired, and rejected listings are
   * all excluded (blueprint Phase 5: "Exclude drafts, rejected listings,
   * and suspended content from public search").
   */
  private publicWhere(query: ListingSearchQueryDto): Prisma.TuitionListingWhereInput {
    return {
      status: 'PUBLISHED',
      ...(query.city && { city: { equals: query.city, mode: 'insensitive' as const } }),
      ...(query.area && { area: { contains: query.area, mode: 'insensitive' as const } }),
      ...(query.classLevel && {
        classLevel: { equals: query.classLevel, mode: 'insensitive' as const },
      }),
      ...(query.curriculumId && { curriculumId: query.curriculumId }),
      ...(query.daysPerWeek && { daysPerWeek: query.daysPerWeek }),
      ...(query.teachingMode && { teachingMode: query.teachingMode }),
      ...(query.subjectId && { subjects: { some: { subjectId: query.subjectId } } }),
      ...(query.universityId && {
        universityPreferences: { some: { universityId: query.universityId } },
      }),
      // Range-overlap match: a listing qualifies if its own salary range
      // overlaps the searcher's. The salaryMax check is wrapped in `AND`
      // because a plain object can only hold one `OR` key — if salaryMin is
      // also set, that key is already in use above.
      ...(query.salaryMin !== undefined && {
        OR: [{ salaryMax: null }, { salaryMax: { gte: query.salaryMin } }],
      }),
      ...(query.salaryMax !== undefined && {
        AND: [{ OR: [{ salaryMin: null }, { salaryMin: { lte: query.salaryMax } }] }],
      }),
    };
  }
}
