import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { AcademicStatus } from '@prisma/client';

const ACADEMIC_STATUSES = Object.values(AcademicStatus);

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Onboarding Stage B "Academic background" (ui-ux.md §14). Creates the
 * profile — fullName/university/department/degreeProgram/academicStatus
 * are the schema's required columns, so they're required here too; every
 * other field (and every subject/grade/curriculum/location/availability
 * assignment) is added by a later stage/endpoint, so a partial profile is
 * still accurately represented (blueprint Phase 6 acceptance criteria).
 */
export class CreateTutorProfileDto {
  @IsUUID()
  universityId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Transform(trimmed)
  fullName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  department!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  degreeProgram!: string;

  @IsIn(ACADEMIC_STATUSES)
  academicStatus!: AcademicStatus;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimmed)
  academicYear?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trimmed)
  introduction?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  preferredFeeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  preferredFeeMax?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
