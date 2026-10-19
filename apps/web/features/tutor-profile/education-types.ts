export type EducationLevel = 'SSC' | 'HSC' | 'UNIVERSITY';

export interface EducationRecord {
  id: string;
  level: EducationLevel;
  institution: string;
  gpa: string | null;
  hasCertificate: boolean;
  certificateFileName: string | null;
  isVerified: boolean;
}

/** Mirrors the backend's RequestCertificateUploadDto allow-list — kept in sync by hand, not generated. */
export const ALLOWED_CERTIFICATE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export const MAX_CERTIFICATE_FILE_SIZE_BYTES = 10 * 1024 * 1024;
