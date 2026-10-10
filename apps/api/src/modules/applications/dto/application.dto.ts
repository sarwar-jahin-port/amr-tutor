import type { AcademicStatus, ApplicationStatus, ListingStatus, Prisma } from '@prisma/client';

/**
 * The relations every application response needs — the applicant's own
 * history, the listing owner's applicant list, and the shared detail view
 * (blueprint Phase 8). Kept intentionally separate from TUTOR_PROFILE_INCLUDE
 * (tutors module): an applicant card only needs the summary fields, not the
 * tutor's full locations/availability/curricula.
 */
export const APPLICATION_INCLUDE = {
  listing: {
    select: {
      id: true,
      title: true,
      classLevel: true,
      city: true,
      area: true,
      status: true,
      guardianUserId: true,
    },
  },
  tutorProfile: {
    select: {
      id: true,
      userId: true,
      fullName: true,
      academicStatus: true,
      university: { select: { id: true, name: true } },
      subjects: { include: { subject: { select: { id: true, name: true } } } },
      grades: { select: { gradeLevel: true } },
    },
  },
} satisfies Prisma.ApplicationInclude;

export interface ApplicationListingSummaryDto {
  id: string;
  title: string;
  classLevel: string;
  city: string;
  area: string;
  status: ListingStatus;
}

export interface ApplicationTutorSummaryDto {
  id: string;
  fullName: string;
  university: { id: string; name: string };
  academicStatus: AcademicStatus;
  subjects: { id: string; name: string }[];
  grades: string[];
}

/**
 * Deliberately omits the listing owner's identity and the tutor's userId
 * — both are only used server-side for authorization checks, never
 * serialized (same rule as PublicListingDetailDto/PublicTutorProfileDto).
 */
export interface ApplicationDetailDto {
  id: string;
  status: ApplicationStatus;
  introduction: string | null;
  submittedAt: Date;
  updatedAt: Date;
  listing: ApplicationListingSummaryDto;
  tutor: ApplicationTutorSummaryDto;
}

interface ApplicationRow {
  id: string;
  status: ApplicationStatus;
  introduction: string | null;
  submittedAt: Date;
  updatedAt: Date;
  listing: {
    id: string;
    title: string;
    classLevel: string;
    city: string;
    area: string;
    status: ListingStatus;
    guardianUserId: string;
  };
  tutorProfile: {
    id: string;
    userId: string;
    fullName: string;
    academicStatus: AcademicStatus;
    university: { id: string; name: string };
    subjects: { subject: { id: string; name: string } }[];
    grades: { gradeLevel: string }[];
  };
}

export function toApplicationDetailDto(row: ApplicationRow): ApplicationDetailDto {
  return {
    id: row.id,
    status: row.status,
    introduction: row.introduction,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
    listing: {
      id: row.listing.id,
      title: row.listing.title,
      classLevel: row.listing.classLevel,
      city: row.listing.city,
      area: row.listing.area,
      status: row.listing.status,
    },
    tutor: {
      id: row.tutorProfile.id,
      fullName: row.tutorProfile.fullName,
      university: row.tutorProfile.university,
      academicStatus: row.tutorProfile.academicStatus,
      subjects: row.tutorProfile.subjects.map((s) => s.subject),
      grades: row.tutorProfile.grades.map((g) => g.gradeLevel),
    },
  };
}
