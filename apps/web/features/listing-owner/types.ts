import type { ListingDetail, Weekday } from '@/features/marketplace/types';

export type { ListingDetail };

export interface CreateListingInput {
  title: string;
  classLevel: string;
  subjectIds: string[];
  city: string;
  area: string;
  daysPerWeek: number;
}

export interface ScheduleSlotInput {
  day: Weekday;
  startTime?: string;
  endTime?: string;
}

export interface UpdateListingInput {
  title?: string;
  classLevel?: string;
  subjectIds?: string[];
  city?: string;
  area?: string;
  neighborhood?: string;
  locationDescription?: string;
  daysPerWeek?: number;
  schedules?: ScheduleSlotInput[];
  teachingMode?: 'HOME' | 'ONLINE' | 'BOTH';
  salaryMin?: number;
  salaryMax?: number;
  preferredGender?: 'NO_PREFERENCE' | 'MALE' | 'FEMALE';
  curriculumId?: string;
  universityPreferenceIds?: string[];
  description?: string;
  startDate?: string;
}
