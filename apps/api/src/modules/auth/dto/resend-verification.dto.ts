import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @MaxLength(254)
  email!: string;
}
