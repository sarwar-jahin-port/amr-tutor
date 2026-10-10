import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @Length(1, 5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  body!: string;
}
