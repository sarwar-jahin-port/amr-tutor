import { ReportCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const REPORT_CATEGORIES = Object.values(ReportCategory);

/**
 * Exactly one target field is required (checked in the service, not here —
 * class-validator has no clean built-in for "exactly one of"). Matches the
 * Report model's actual shape (three nullable target FKs, no generic
 * targetType/targetId pair) — `tutorProfileId` is the one exception,
 * resolved to the tutor's userId server-side, because a public tutor
 * profile never exposes the raw userId to report against directly.
 */
export class CreateReportDto {
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @IsOptional()
  @IsUUID()
  tutorProfileId?: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsIn(REPORT_CATEGORIES)
  category!: ReportCategory;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
