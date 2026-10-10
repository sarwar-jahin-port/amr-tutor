import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trimmed)
  introduction?: string;
}
