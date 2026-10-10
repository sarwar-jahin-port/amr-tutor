export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface ReferenceItem {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
}

export interface Division {
  id: string;
  name: string;
  isDefault: boolean;
  districts: District[];
}

export type AcademicStatus = 'CURRENT_STUDENT' | 'GRADUATED' | 'OTHER';
export type TeachingMode = 'HOME' | 'ONLINE' | 'BOTH';
export type Weekday =
  | 'SATURDAY'
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY';

export interface TutorSummary {
  id: string;
  fullName: string;
  university: ReferenceItem;
  academicStatus: AcademicStatus;
  subjects: ReferenceItem[];
  grades: string[];
  isVerified: boolean;
}

export interface TutorProfile extends TutorSummary {
  department: string;
  degreeProgram: string;
  academicYear: string | null;
  introduction: string | null;
  curricula: ReferenceItem[];
  locations: { city: string; area: string; neighborhood: string | null }[];
  availability: { day: Weekday; startMinute: number; endMinute: number }[];
  preferredFeeMin: number | null;
  preferredFeeMax: number | null;
  feeCurrency: string;
}

export interface ListingSummary {
  id: string;
  title: string;
  classLevel: string;
  city: string;
  area: string;
  subjects: ReferenceItem[];
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  daysPerWeek: number;
  teachingMode: TeachingMode;
  status: string;
  publishedAt: string | null;
}

export interface ListingDetail extends ListingSummary {
  description: string | null;
  neighborhood: string | null;
  locationDescription: string | null;
  preferredGender: string | null;
  curriculum: ReferenceItem | null;
  universityPreferences: ReferenceItem[];
  schedules: { day: Weekday; startMinute: number | null; endMinute: number | null }[];
  startDate: string | null;
}
