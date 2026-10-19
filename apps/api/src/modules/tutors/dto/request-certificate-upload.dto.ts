import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const ALLOWED_CERTIFICATE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export type AllowedCertificateContentType = (typeof ALLOWED_CERTIFICATE_CONTENT_TYPES)[number];

export const MAX_CERTIFICATE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export class RequestCertificateUploadDto {
  @IsIn(ALLOWED_CERTIFICATE_CONTENT_TYPES)
  contentType!: AllowedCertificateContentType;

  @IsInt()
  @Min(1)
  @Max(MAX_CERTIFICATE_FILE_SIZE_BYTES)
  fileSizeBytes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  originalFileName?: string;
}
