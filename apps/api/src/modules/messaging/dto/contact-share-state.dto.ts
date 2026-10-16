/**
 * Mutual-consent contact-sharing state for one application (blueprint
 * Phase 9 / decision record §8: "explicit, logged consent from both
 * parties before private contact info is exchanged" — never inferred from
 * an application status change alone). `contact` only carries a field once
 * BOTH participants have consented to share it; until then it's null, even
 * if the caller themself already shared.
 */
export interface ContactShareStateDto {
  applicationId: string;
  myShared: { phone: boolean; email: boolean };
  counterpartShared: { phone: boolean; email: boolean };
  contact: { phone: string | null; email: string | null };
  updatedAt: Date | null;
}
