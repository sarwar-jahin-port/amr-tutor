import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TeachingMode } from '@prisma/client';
import { GRADE_LEVELS } from '../../reference/data/grades.data';
import { ScheduleSlotInputDto } from './schedule-slot-input.dto';

const TEACHING_MODES = Object.values(TeachingMode);
const GENDER_PREFERENCES = ['NO_PREFERENCE', 'MALE', 'FEMALE'] as const;

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Wizard "Basics" step — everything the schema requires to create a row
 * (title/classLevel/city/area/daysPerWeek are all NOT NULL columns) plus
 * subjects, which the blueprint groups with class as step 1. Everything
 * else is added by PATCH as later steps complete — see UpdateListingDto.
 */
export class CreateListingDto {
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  @Transform(trimmed)
  title!: string;

  @IsIn(GRADE_LEVELS)
  classLevel!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  subjectIds!: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  city!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  area!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek!: number;
}

/** Every later wizard step (Schedule, Budget & preferences, Description & context). */
export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  @Transform(trimmed)
  title?: string;

  @IsOptional()
  @IsIn(GRADE_LEVELS)
  classLevel?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  subjectIds?: string[];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimmed)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimmed)
  locationDescription?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(14)
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotInputDto)
  schedules?: ScheduleSlotInputDto[];

  @IsOptional()
  @IsIn(TEACHING_MODES)
  teachingMode?: TeachingMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  salaryMax?: number;

  @IsOptional()
  @IsIn(GENDER_PREFERENCES)
  preferredGender?: string;

  @IsOptional()
  @IsUUID()
  curriculumId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  universityPreferenceIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  @Transform(trimmed)
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
