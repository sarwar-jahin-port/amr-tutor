import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AcademicStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const ACADEMIC_STATUSES = Object.values(AcademicStatus);
const SORT_OPTIONS = ['newest'] as const;
export type TutorSortOption = (typeof SORT_OPTIONS)[number];

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Public tutor search filters (blueprint Phase 5 "Search implementation
 * rules": allowlist sortable fields, validate filter values). Every field is
 * optional — an empty query returns all publicly visible tutors.
 */
export class TutorSearchQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  universityId?: string;

  @IsOptional()
  @IsUUID()
  curriculumId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimmed)
  gradeLevel?: string;

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
  @IsIn(ACADEMIC_STATUSES)
  academicStatus?: AcademicStatus;

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort: TutorSortOption = 'newest';
}
