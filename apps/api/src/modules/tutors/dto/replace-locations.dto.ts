import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class LocationInputDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimmed)
  neighborhood?: string;
}

/** Stage D "Availability" (ui-ux.md §14). A complete replacement list, not a diff. */
export class ReplaceLocationsDto {
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => LocationInputDto)
  locations!: LocationInputDto[];
}
