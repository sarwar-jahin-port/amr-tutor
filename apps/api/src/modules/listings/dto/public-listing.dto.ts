import type { ListingStatus, Prisma, TeachingMode, Weekday } from '@prisma/client';

/**
 * The relations every listing response (public or the owner's own view)
 * needs. Shared so the public search/detail endpoints (Phase 5) and the
 * authenticated "me" endpoints (Phase 7) stay in sync by construction.
 */
export const LISTING_INCLUDE = {
  curriculum: { select: { id: true, name: true } },
  subjects: { include: { subject: { select: { id: true, name: true } } } },
  universityPreferences: { include: { university: { select: { id: true, name: true } } } },
  schedules: { select: { day: true, startMinute: true, endMinute: true } },
} satisfies Prisma.TuitionListingInclude;

/**
 * Public-safe tuition-listing shapes. Deliberately excludes guardianUserId
 * — the guardian's identity is never exposed in a public listing (contact
 * happens only through the consent-based sharing flow, a later phase).
 * Never serialize a raw Prisma TuitionListing (blueprint Phase 5: "Return
 * only public response DTOs"). The owner's own view (Phase 7) reuses the
 * same shape plus its own id is already in scope; there's no extra field
 * worth hiding from the owner that we'd otherwise show the public.
 */
export interface PublicListingSummaryDto {
  id: string;
  title: string;
  classLevel: string;
  city: string;
  area: string;
  subjects: { id: string; name: string }[];
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  daysPerWeek: number;
  teachingMode: TeachingMode;
  status: ListingStatus;
  publishedAt: Date | null;
}

export interface PublicListingDetailDto extends PublicListingSummaryDto {
  description: string | null;
  neighborhood: string | null;
  locationDescription: string | null;
  preferredGender: string | null;
  curriculum: { id: string; name: string } | null;
  universityPreferences: { id: string; name: string }[];
  schedules: { day: Weekday; startMinute: number | null; endMinute: number | null }[];
  startDate: Date | null;
}

interface ListingRow {
  id: string;
  title: string;
  description: string | null;
  classLevel: string;
  city: string;
  area: string;
  neighborhood: string | null;
  locationDescription: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  daysPerWeek: number;
  preferredGender: string | null;
  teachingMode: TeachingMode;
  startDate: Date | null;
  publishedAt: Date | null;
  status: ListingStatus;
  curriculum: { id: string; name: string } | null;
  subjects: { subject: { id: string; name: string } }[];
  universityPreferences: { university: { id: string; name: string } }[];
  schedules: { day: Weekday; startMinute: number | null; endMinute: number | null }[];
}

export function toPublicListingSummaryDto(row: ListingRow): PublicListingSummaryDto {
  return {
    id: row.id,
    title: row.title,
    classLevel: row.classLevel,
    city: row.city,
    area: row.area,
    subjects: row.subjects.map((s) => s.subject),
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    daysPerWeek: row.daysPerWeek,
    teachingMode: row.teachingMode,
    status: row.status,
    publishedAt: row.publishedAt,
  };
}

export function toPublicListingDetailDto(row: ListingRow): PublicListingDetailDto {
  return {
    ...toPublicListingSummaryDto(row),
    description: row.description,
    neighborhood: row.neighborhood,
    locationDescription: row.locationDescription,
    preferredGender: row.preferredGender,
    curriculum: row.curriculum,
    universityPreferences: row.universityPreferences.map((p) => p.university),
    schedules: row.schedules,
    startDate: row.startDate,
  };
}
