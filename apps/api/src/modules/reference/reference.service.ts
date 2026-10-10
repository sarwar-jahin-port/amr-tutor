import { Injectable } from '@nestjs/common';
import { PaginatedResponse, SearchQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { DIVISIONS, Division } from './data/locations.data';
import { GRADE_LEVELS } from './data/grades.data';
import { ReferenceNameDto } from './dto/reference-name.dto';

type ReferenceDelegate = {
  findMany: (args: {
    where: { isActive: true; name?: { contains: string; mode: 'insensitive' } };
    orderBy: { name: 'asc' };
    skip: number;
    take: number;
  }) => Promise<{ id: string; name: string }[]>;
  count: (args: {
    where: { isActive: true; name?: { contains: string; mode: 'insensitive' } };
  }) => Promise<number>;
};

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async universities(query: SearchQueryDto): Promise<PaginatedResponse<ReferenceNameDto>> {
    return this.listByName(this.prisma.university, query);
  }

  async subjects(query: SearchQueryDto): Promise<PaginatedResponse<ReferenceNameDto>> {
    return this.listByName(this.prisma.subject, query);
  }

  async curricula(query: SearchQueryDto): Promise<PaginatedResponse<ReferenceNameDto>> {
    return this.listByName(this.prisma.curriculum, query);
  }

  /** Static picker data — see data/grades.data.ts for why this isn't a DB table. */
  grades(query: SearchQueryDto): PaginatedResponse<ReferenceNameDto> {
    const matches = GRADE_LEVELS.filter((level) =>
      query.search ? level.toLowerCase().includes(query.search.toLowerCase()) : true,
    ).map((name) => ({ id: name, name }));

    return this.paginateInMemory(matches, query);
  }

  /** Static picker data — see data/locations.data.ts for why this isn't a DB table. */
  locations(): Division[] {
    return DIVISIONS;
  }

  private async listByName(
    delegate: ReferenceDelegate,
    query: SearchQueryDto,
  ): Promise<PaginatedResponse<ReferenceNameDto>> {
    const where = {
      isActive: true as const,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      delegate.count({ where }),
    ]);

    return paginate(
      rows.map((row) => ({ id: row.id, name: row.name })),
      query.page,
      query.limit,
      total,
    );
  }

  private paginateInMemory<T>(items: T[], query: SearchQueryDto): PaginatedResponse<T> {
    const start = (query.page - 1) * query.limit;
    return paginate(items.slice(start, start + query.limit), query.page, query.limit, items.length);
  }
}
