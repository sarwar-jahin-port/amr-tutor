import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { AcademicStatus } from '@prisma/client';

const ACADEMIC_STATUSES = Object.values(AcademicStatus);

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Every field optional — PATCH only touches what's provided. */
export class UpdateTutorProfileDto {
  @IsOptional()
  @IsUUID()
  universityId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Transform(trimmed)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  department?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  degreeProgram?: string;

  @IsOptional()
  @IsIn(ACADEMIC_STATUSES)
  academicStatus?: AcademicStatus;

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
