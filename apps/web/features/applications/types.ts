import type { AcademicStatus } from '@/features/marketplace/types';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'VIEWED'
  | 'SHORTLISTED'
  | 'CONTACT_REQUESTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'WITHDRAWN'
  | 'CLOSED';

export interface ApplicationListingSummary {
  id: string;
  title: string;
  classLevel: string;
  city: string;
  area: string;
  status: string;
}

export interface ApplicationTutorSummary {
  id: string;
  fullName: string;
  university: { id: string; name: string };
  academicStatus: AcademicStatus;
  subjects: { id: string; name: string }[];
  grades: string[];
}

export interface ApplicationDetail {
  id: string;
  status: ApplicationStatus;
  introduction: string | null;
  submittedAt: string;
  updatedAt: string;
  listing: ApplicationListingSummary;
  tutor: ApplicationTutorSummary;
}

/** Statuses the listing owner may move an application into directly (mirrors the API's state machine). */
export const OWNER_SETTABLE_STATUSES = ['SHORTLISTED', 'ACCEPTED', 'DECLINED'] as const;
export type OwnerSettableStatus = (typeof OWNER_SETTABLE_STATUSES)[number];
