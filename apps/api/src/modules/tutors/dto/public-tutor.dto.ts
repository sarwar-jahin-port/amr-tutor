import type { AcademicStatus, Prisma, VerificationStatus, Weekday } from '@prisma/client';

/**
 * The relations every tutor-profile response (public or the owner's own
 * view) needs. Shared so the public search/detail endpoints (Phase 5) and
 * the authenticated "me" endpoints (Phase 6) stay in sync by construction.
 */
export const TUTOR_PROFILE_INCLUDE = {
  university: { select: { id: true, name: true } },
  subjects: { include: { subject: { select: { id: true, name: true } } } },
  grades: { select: { gradeLevel: true } },
  curricula: { include: { curriculum: { select: { id: true, name: true } } } },
  locations: { select: { city: true, area: true, neighborhood: true } },
  availability: { select: { day: true, startMinute: true, endMinute: true } },
  // Only ever reduced to the boolean `isVerified` below — the request
  // status/expiry themselves, let alone evidence, are never serialized
  // (blueprint Phase 10: "Public users see only the approved verification
  // result, not the evidence itself").
  verificationRequests: { select: { status: true, expiresAt: true } },
} satisfies Prisma.TutorProfileInclude;

/**
 * Public-safe tutor shapes. Deliberately excludes userId, profilePhotoKey
 * (a private storage key, not a servable URL yet), and any raw
 * verification record — never serialize a raw Prisma TutorProfile
 * (blueprint Phase 5: "Never expose ... in public tutor search" / "Return
 * only public response DTOs"). The owner's own view (Phase 6) reuses the
 * same shape — there is no extra private field on TutorProfile itself
 * (contact info lives on User), so what's safe to show the public is also
 * everything there is to show the owner.
 */
export interface PublicTutorSummaryDto {
  id: string;
  fullName: string;
  university: { id: string; name: string };
  academicStatus: AcademicStatus;
  subjects: { id: string; name: string }[];
  grades: string[];
  /** APPROVED and not expired (blueprint Phase 10: "only display a verified badge if ... approved and still valid"). */
  isVerified: boolean;
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
  verificationRequests: { status: VerificationStatus; expiresAt: Date | null }[];
}

function computeIsVerified(requests: { status: VerificationStatus; expiresAt: Date | null }[]): boolean {
  const now = new Date();
  return requests.some((r) => r.status === 'APPROVED' && (!r.expiresAt || r.expiresAt > now));
}

export function toPublicTutorSummaryDto(row: TutorProfileRow): PublicTutorSummaryDto {
  return {
    id: row.id,
    fullName: row.fullName,
    university: row.university,
    academicStatus: row.academicStatus,
    subjects: row.subjects.map((s) => s.subject),
    grades: row.grades.map((g) => g.gradeLevel),
    isVerified: computeIsVerified(row.verificationRequests),
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
