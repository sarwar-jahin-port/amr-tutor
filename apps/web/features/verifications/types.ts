export type VerificationType = 'UNIVERSITY_AFFILIATION' | 'ACADEMIC_CREDENTIAL';

export type VerificationStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'NEEDS_INFORMATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type EvidenceType = 'STUDENT_ID' | 'UNIVERSITY_DOCUMENT' | 'ACADEMIC_TRANSCRIPT' | 'OTHER';

export interface VerificationEvidenceSummary {
  id: string;
  type: EvidenceType;
  originalFileName: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface VerificationRequestDetail {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  decisionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  expiresAt: string | null;
  tutor: { id: string; fullName: string };
  evidence: VerificationEvidenceSummary[];
}

export type VerificationDecision = 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';

/** Mirrors the backend's allowed content types (RequestEvidenceUploadDto) — kept in sync by hand, not generated. */
export const ALLOWED_EVIDENCE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export const MAX_EVIDENCE_FILE_SIZE_BYTES = 10 * 1024 * 1024;
