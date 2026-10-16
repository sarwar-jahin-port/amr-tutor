import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

/**
 * A user may self-register as TUTOR and/or GUARDIAN only. ADMIN, VERIFIER,
 * and MODERATOR are granted exclusively through an authorized administrative
 * process (blueprint Phase 3: "Never accept an account role or privilege
 * directly from an untrusted request").
 */
export const SELF_REGISTERABLE_ROLES = [Role.TUTOR, Role.GUARDIAN] as const;
export type SelfRegisterableRole = (typeof SELF_REGISTERABLE_ROLES)[number];

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @Matches(/^(?:\+?88)?01[3-9]\d{8}$/, {
    message: 'phone must be a valid Bangladesh mobile number',
  })
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(SELF_REGISTERABLE_ROLES, { each: true })
  roles!: SelfRegisterableRole[];
}
