import type { AcademicStatus, TutorProfile, Weekday } from '@/features/marketplace/types';

export type { TutorProfile };

export interface CreateTutorProfileInput {
  universityId: string;
  fullName: string;
  department: string;
  degreeProgram: string;
  academicStatus: AcademicStatus;
  academicYear?: string;
  introduction?: string;
  preferredFeeMin?: number;
  preferredFeeMax?: number;
}

export type UpdateTutorProfileInput = Partial<CreateTutorProfileInput> & { isAvailable?: boolean };

export interface LocationInput {
  city: string;
  area: string;
  neighborhood?: string;
}

export interface AvailabilitySlotInput {
  day: Weekday;
  startTime: string;
  endTime: string;
}
