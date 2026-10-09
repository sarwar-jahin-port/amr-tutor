import type { AcademicStatus, Weekday } from '@prisma/client';

/**
 * Public-safe tutor shapes. Deliberately excludes userId, profilePhotoKey
 * (a private storage key, not a servable URL yet), and any verification
 * record — never serialize a raw Prisma TutorProfile (blueprint Phase 5:
 * "Never expose ... in public tutor search" / "Return only public response
 * DTOs").
 */
export interface PublicTutorSummaryDto {
  id: string;
  fullName: string;
  university: { id: string; name: string };
  academicStatus: AcademicStatus;
  subjects: { id: string; name: string }[];
  grades: string[];
}

export interface PublicTutorProfileDto extends PublicTutorSummaryDto {
  department: string;
  degreeProgram: string;
  academicYear: string | null;
  introduction: string | null;
  curricula: { id: string; name: string }[];
  locations: { city: string; area: string; neighborhood: string | null }[];
  availability: { day: Weekday; startMinute: number; endMinute: number }[];
  preferredFeeMin: number | null;
  preferredFeeMax: number | null;
  feeCurrency: string;
}

interface TutorProfileRow {
  id: string;
  fullName: string;
  department: string;
  degreeProgram: string;
  academicStatus: AcademicStatus;
  academicYear: string | null;
  introduction: string | null;
  preferredFeeMin: number | null;
  preferredFeeMax: number | null;
  feeCurrency: string;
  university: { id: string; name: string };
  subjects: { subject: { id: string; name: string } }[];
  grades: { gradeLevel: string }[];
  curricula: { curriculum: { id: string; name: string } }[];
  locations: { city: string; area: string; neighborhood: string | null }[];
  availability: { day: Weekday; startMinute: number; endMinute: number }[];
}

export function toPublicTutorSummaryDto(row: TutorProfileRow): PublicTutorSummaryDto {
  return {
    id: row.id,
    fullName: row.fullName,
    university: row.university,
    academicStatus: row.academicStatus,
    subjects: row.subjects.map((s) => s.subject),
    grades: row.grades.map((g) => g.gradeLevel),
  };
}

export function toPublicTutorProfileDto(row: TutorProfileRow): PublicTutorProfileDto {
  return {
    ...toPublicTutorSummaryDto(row),
    department: row.department,
    degreeProgram: row.degreeProgram,
    academicYear: row.academicYear,
    introduction: row.introduction,
    curricula: row.curricula.map((c) => c.curriculum),
    locations: row.locations,
    availability: row.availability,
    preferredFeeMin: row.preferredFeeMin,
    preferredFeeMax: row.preferredFeeMax,
    feeCurrency: row.feeCurrency,
  };
}
