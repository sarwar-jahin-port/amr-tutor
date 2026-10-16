import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REPORT_STATUS_TRANSITIONS = ['UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED'] as const;
export type ReportStatusTransition = (typeof REPORT_STATUS_TRANSITIONS)[number];

export class UpdateReportStatusDto {
  @IsIn(REPORT_STATUS_TRANSITIONS)
  status!: ReportStatusTransition;

  /** Required for ACTION_TAKEN/DISMISSED (checked in the service) — the record of what was decided and why. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}
