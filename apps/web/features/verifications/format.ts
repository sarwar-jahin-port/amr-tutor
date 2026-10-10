import type { VerificationStatus, VerificationType } from './types';

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  PENDING: 'Gathering evidence',
  IN_REVIEW: 'Under review',
  NEEDS_INFORMATION: 'More information needed',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const VERIFICATION_STATUS_BADGE: Record<
  VerificationStatus,
  'neutral' | 'success' | 'information' | 'warning' | 'danger'
> = {
  PENDING: 'neutral',
  IN_REVIEW: 'information',
  NEEDS_INFORMATION: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export const VERIFICATION_TYPE_LABEL: Record<VerificationType, string> = {
  UNIVERSITY_AFFILIATION: 'University affiliation',
  ACADEMIC_CREDENTIAL: 'Academic credential',
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
