import { IsIn } from 'class-validator';

/**
 * Statuses a listing owner may set directly (blueprint Phase 8). WITHDRAWN
 * is only reachable through the applicant's own withdraw action, and
 * CONTACT_REQUESTED/CLOSED are not owner-triggered status changes.
 */
export const OWNER_SETTABLE_STATUSES = ['VIEWED', 'SHORTLISTED', 'ACCEPTED', 'DECLINED'] as const;
export type OwnerSettableStatus = (typeof OWNER_SETTABLE_STATUSES)[number];

export class UpdateApplicationStatusDto {
  @IsIn(OWNER_SETTABLE_STATUSES)
  status!: OwnerSettableStatus;
}
