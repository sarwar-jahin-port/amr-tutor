import { GuardianEvidenceType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const EVIDENCE_TYPES = Object.values(GuardianEvidenceType);

/** Independently re-checked server-side at submit time via magic bytes — see GuardianVerificationsService. */
export const ALLOWED_EVIDENCE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export type AllowedEvidenceContentType = (typeof ALLOWED_EVIDENCE_CONTENT_TYPES)[number];

export const MAX_EVIDENCE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export class RequestGuardianEvidenceUploadDto {
  @IsIn(EVIDENCE_TYPES)
  evidenceType!: GuardianEvidenceType;

  @IsIn(ALLOWED_EVIDENCE_CONTENT_TYPES)
  contentType!: AllowedEvidenceContentType;

  @IsInt()
  @Min(1)
  @Max(MAX_EVIDENCE_FILE_SIZE_BYTES)
  fileSizeBytes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  originalFileName?: string;
}
