import type { EvidenceType, Prisma, VerificationStatus, VerificationType } from '@prisma/client';

/**
 * Deliberately omits storageKey — the private object-storage location is
 * never serialized (blueprint Phase 10: "never expose ... private storage
 * keys ... in public tutor responses", schema doc §8.2). A caller gets a
 * download URL for a specific evidence item through its own short-lived,
 * authorization-checked endpoint instead (VerificationsService.getEvidenceDownloadUrl).
 */
export const VERIFICATION_INCLUDE = {
  tutorProfile: { select: { id: true, userId: true, fullName: true } },
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
} satisfies Prisma.VerificationRequestInclude;

export interface VerificationEvidenceSummaryDto {
  id: string;
  type: EvidenceType;
  originalFileName: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}

export interface VerificationRequestDetailDto {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  decisionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  expiresAt: Date | null;
  tutor: { id: string; fullName: string };
  evidence: VerificationEvidenceSummaryDto[];
}

interface VerificationRequestRow {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  decisionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  expiresAt: Date | null;
  tutorProfile: { id: string; userId: string; fullName: string };
  evidence: {
    id: string;
    type: EvidenceType;
    storageKey: string;
    originalFileName: string | null;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: Date;
  }[];
}

export function toVerificationRequestDetailDto(row: VerificationRequestRow): VerificationRequestDetailDto {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    decisionReason: row.decisionReason,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    expiresAt: row.expiresAt,
    tutor: { id: row.tutorProfile.id, fullName: row.tutorProfile.fullName },
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
