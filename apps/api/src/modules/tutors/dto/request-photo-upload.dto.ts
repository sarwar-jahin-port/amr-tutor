import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const ALLOWED_PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedPhotoContentType = (typeof ALLOWED_PHOTO_CONTENT_TYPES)[number];

export const MAX_PHOTO_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export class RequestPhotoUploadDto {
  @IsIn(ALLOWED_PHOTO_CONTENT_TYPES)
  contentType!: AllowedPhotoContentType;

  @IsInt()
  @Min(1)
  @Max(MAX_PHOTO_FILE_SIZE_BYTES)
  fileSizeBytes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  originalFileName?: string;
}
