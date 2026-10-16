import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const VERIFICATION_DECISIONS = ['APPROVE', 'REJECT', 'REQUEST_MORE_INFO'] as const;
export type VerificationDecision = (typeof VERIFICATION_DECISIONS)[number];

export class DecideVerificationDto {
  @IsIn(VERIFICATION_DECISIONS)
  decision!: VerificationDecision;

  /** Required for REJECT/REQUEST_MORE_INFO (checked in the service) — the applicant needs to know why. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
