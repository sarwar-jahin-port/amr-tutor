import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  body!: string;
}

export interface AdminNoteDto {
  id: string;
  body: string;
  author: { id: string; email: string | null };
  createdAt: Date;
}
