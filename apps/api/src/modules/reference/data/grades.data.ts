/**
 * Canonical class/grade list for the `/references/grades` picker.
 * TutorGrade.gradeLevel and TuitionListing.classLevel are free-text columns
 * (no Grade table in prisma/schema.prisma), so this is suggested picker
 * data, not a DB-enforced enum — search still matches the free-text value.
 */
export const GRADE_LEVELS: string[] = [
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
