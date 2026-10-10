import type { TeachingMode, Weekday } from './types';

/** Displays a BDT salary range per docs/ui-ux.md §5: "৳ 4,000–৳ 6,000 / month". */
export function formatSalaryRange(min: number | null, max: number | null, currency = 'BDT'): string {
  const symbol = currency === 'BDT' ? '৳' : currency;
  const format = (n: number) => `${symbol} ${n.toLocaleString('en-US')}`;

  if (min !== null && max !== null) return `${format(min)}–${format(max)} / month`;
  if (min !== null) return `From ${format(min)} / month`;
  if (max !== null) return `Up to ${format(max)} / month`;
  return 'Budget not specified';
}

export const TEACHING_MODE_LABEL: Record<TeachingMode, string> = {
  HOME: "Student's home",
  ONLINE: 'Online',
  BOTH: 'Home/online',
};

/** Single source of truth for teaching-mode dropdowns (filters, the listing form). */
export const TEACHING_MODE_OPTIONS: { id: TeachingMode; name: string }[] = (
  Object.entries(TEACHING_MODE_LABEL) as [TeachingMode, string][]
).map(([id, name]) => ({ id, name }));

export const GENDER_PREFERENCE_LABEL: Record<string, string> = {
  NO_PREFERENCE: 'No preference',
  MALE: 'Male tutor',
  FEMALE: 'Female tutor',
};

export const WEEKDAY_LABEL: Record<string, string> = {
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
};

/** The week as it's conventionally shown in Bangladesh (Saturday first). */
export const WEEKDAY_ORDER: Weekday[] = [
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
];

export function formatMinutes(minutes: number): string {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

/**
 * Mirrors apps/api's GRADE_LEVELS picker order (grades.data.ts) so a tutor's
 * free-text grade list renders youngest-to-oldest instead of insertion order.
 */
const GRADE_ORDER = [
  'Play',
  'Nursery',
  'KG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'SSC / O Level',
  'Class 11',
  'Class 12',
  'HSC / A Level',
];

export function sortGrades(grades: string[]): string[] {
  return [...grades].sort((a, b) => {
    const indexA = GRADE_ORDER.indexOf(a);
    const indexB = GRADE_ORDER.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}
