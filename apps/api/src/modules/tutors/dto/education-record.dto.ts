import type { EducationLevel } from '@prisma/client';

/**
 * Never includes certificateKey (a private storage key) — a caller gets a
 * download URL for the certificate through its own short-lived,
 * authorization-checked endpoint instead, matching the pattern used for
 * verification evidence (see VerificationsService.getEvidenceDownloadUrl).
 */
export interface EducationRecordDto {
  id: string;
  level: EducationLevel;
  institution: string;
  gpa: string | null;
  hasCertificate: boolean;
  certificateFileName: string | null;
  isVerified: boolean;
}

interface EducationRecordRow {
  id: string;
  level: EducationLevel;
  institution: string;
  gpa: string | null;
  certificateKey: string | null;
  certificateFileName: string | null;
  isVerified: boolean;
}

export function toEducationRecordDto(row: EducationRecordRow): EducationRecordDto {
  return {
    id: row.id,
    level: row.level,
    institution: row.institution,
    gpa: row.gpa,
    hasCertificate: row.certificateKey !== null,
    certificateFileName: row.certificateFileName,
    isVerified: row.isVerified,
  };
}

export interface AdminEducationRecordDto extends EducationRecordDto {
  tutor: { id: string; fullName: string };
}

interface AdminEducationRecordRow extends EducationRecordRow {
  tutorProfile: { id: string; fullName: string };
}

export function toAdminEducationRecordDto(row: AdminEducationRecordRow): AdminEducationRecordDto {
  return {
    ...toEducationRecordDto(row),
    tutor: { id: row.tutorProfile.id, fullName: row.tutorProfile.fullName },
  };
}

/** Entry order the sequential-hierarchy UI expects: SSC, then HSC, then University. */
export const EDUCATION_LEVEL_ORDER: EducationLevel[] = ['SSC', 'HSC', 'UNIVERSITY'];
