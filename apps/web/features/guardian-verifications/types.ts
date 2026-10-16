export type VerificationStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'NEEDS_INFORMATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type GuardianEvidenceType = 'NATIONAL_ID_CARD' | 'OTHER';

export interface GuardianVerificationEvidenceSummary {
  id: string;
  type: GuardianEvidenceType;
  originalFileName: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface GuardianVerificationRequestDetail {
  id: string;
  status: VerificationStatus;
  decisionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  guardian: { id: string; email: string | null; phone: string | null };
  evidence: GuardianVerificationEvidenceSummary[];
}

export type VerificationDecision = 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';

/** Mirrors the backend's allowed content types (RequestGuardianEvidenceUploadDto) — kept in sync by hand, not generated. */
export const ALLOWED_EVIDENCE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export const MAX_EVIDENCE_FILE_SIZE_BYTES = 10 * 1024 * 1024;
