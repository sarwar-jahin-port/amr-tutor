import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Body for PUT /tutors/me/education/:level (SSC/HSC only — University is derived from the tutor profile itself). */
export class UpsertEducationRecordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  @Transform(trimmed)
  institution!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(trimmed)
  gpa?: string;
}
