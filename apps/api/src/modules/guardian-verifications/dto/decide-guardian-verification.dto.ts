import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const GUARDIAN_VERIFICATION_DECISIONS = ['APPROVE', 'REJECT', 'REQUEST_MORE_INFO'] as const;
export type GuardianVerificationDecision = (typeof GUARDIAN_VERIFICATION_DECISIONS)[number];

export class DecideGuardianVerificationDto {
  @IsIn(GUARDIAN_VERIFICATION_DECISIONS)
  decision!: GuardianVerificationDecision;

  /** Required for REJECT/REQUEST_MORE_INFO (checked in the service). */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
