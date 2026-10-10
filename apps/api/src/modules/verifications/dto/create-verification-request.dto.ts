import { VerificationType } from '@prisma/client';
import { IsIn } from 'class-validator';

const VERIFICATION_TYPES = Object.values(VerificationType);

export class CreateVerificationRequestDto {
  @IsIn(VERIFICATION_TYPES)
  type!: VerificationType;
}
