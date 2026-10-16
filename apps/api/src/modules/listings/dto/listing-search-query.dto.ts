import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { TeachingMode } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const TEACHING_MODES = Object.values(TeachingMode);
const SORT_OPTIONS = ['newest', 'salary_asc', 'salary_desc'] as const;
export type ListingSortOption = (typeof SORT_OPTIONS)[number];

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Public tuition-listing search filters (blueprint Phase 5 "Search
 * implementation rules": allowlist sortable fields, validate filter
 * values). Every field is optional — an empty query returns all published
 * listings.
 */
export class ListingSearchQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimmed)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimmed)
  area?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimmed)
  classLevel?: string;

  @IsOptional()
  @IsUUID()
  curriculumId?: string;

  @IsOptional()
  @IsUUID()
  universityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek?: number;

  @IsOptional()
  @IsIn(TEACHING_MODES)
  teachingMode?: TeachingMode;

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort: ListingSortOption = 'newest';
}
