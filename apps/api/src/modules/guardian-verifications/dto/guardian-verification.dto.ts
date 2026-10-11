import type { GuardianEvidenceType, Prisma, VerificationStatus } from '@prisma/client';

/** Deliberately omits storageKey — see getEvidenceDownloadUrl for the authorization-checked way to reach the file. */
export const GUARDIAN_VERIFICATION_INCLUDE = {
  guardianUser: { select: { id: true, email: true, phone: true } },
  evidence: {
    select: {
      id: true,
      type: true,
      storageKey: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true,
    },
  },
} satisfies Prisma.GuardianVerificationRequestInclude;

export interface GuardianVerificationEvidenceSummaryDto {
  id: string;
  type: GuardianEvidenceType;
  originalFileName: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}

export interface GuardianVerificationRequestDetailDto {
  id: string;
  status: VerificationStatus;
  decisionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  guardian: { id: string; email: string | null; phone: string | null };
  evidence: GuardianVerificationEvidenceSummaryDto[];
}

interface GuardianVerificationRequestRow {
  id: string;
  status: VerificationStatus;
  decisionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  guardianUser: { id: string; email: string | null; phone: string | null };
  evidence: {
    id: string;
    type: GuardianEvidenceType;
    storageKey: string;
    originalFileName: string | null;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: Date;
  }[];
}

export function toGuardianVerificationRequestDetailDto(
  row: GuardianVerificationRequestRow,
): GuardianVerificationRequestDetailDto {
  return {
    id: row.id,
    status: row.status,
    decisionReason: row.decisionReason,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    guardian: row.guardianUser,
    evidence: row.evidence.map((e) => ({
      id: e.id,
      type: e.type,
      originalFileName: e.originalFileName,
      mimeType: e.mimeType,
      sizeBytes: e.sizeBytes,
      uploadedAt: e.uploadedAt,
    })),
  };
}
