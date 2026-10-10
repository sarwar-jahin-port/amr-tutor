import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const LANGUAGES = ['bn', 'en'] as const;

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Minimum guardian profile (decision record 0001 §6: a completed minimum
 * guardian profile is required before publishing a listing — exact fields
 * left to Phase 7 DTO design). Contact info ("verified contact" in the
 * decision) isn't separately enforceable: email is already mandatory at
 * registration and phone/email verification itself is out of scope until
 * a provider is chosen (decision record 0001 §10), so a guardian always
 * already has a contact point on file. Location isn't a GuardianProfile
 * field in the implemented schema — "at least one location" is satisfied
 * per-listing instead (city/area are required to create one).
 */
export class CreateGuardianProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(trimmed)
  displayName!: string;

  @IsOptional()
  @IsIn(LANGUAGES)
  language?: string;
}

export class UpdateGuardianProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(trimmed)
  displayName?: string;

  @IsOptional()
  @IsIn(LANGUAGES)
  language?: string;
}
