import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type TeachingMode, type Weekday } from '@prisma/client';

/**
 * Dev-only demo content: published tuition listings and available tutor
 * profiles, so the marketplace pages have enough cards to design/test
 * against. Never run against a production database — it creates throwaway
 * `demo.*@example.test` accounts.
 *
 * Usage: `pnpm db:seed:demo` (reads the same DATABASE_URL as prisma/seed.ts).
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const WEEKDAYS: Weekday[] = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const GRADE_LEVELS = [
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

const LOCATIONS: { city: string; area: string }[] = [
  { city: 'Dhaka', area: 'Dhanmondi' },
  { city: 'Dhaka', area: 'Mirpur' },
  { city: 'Dhaka', area: 'Uttara' },
  { city: 'Dhaka', area: 'Gulshan' },
  { city: 'Dhaka', area: 'Banani' },
  { city: 'Dhaka', area: 'Mohammadpur' },
  { city: 'Dhaka', area: 'Badda' },
  { city: 'Dhaka', area: 'Rampura' },
  { city: 'Gazipur', area: 'Tongi' },
  { city: 'Narayanganj', area: 'Siddhirganj' },
  { city: 'Chattogram', area: 'Panchlaish' },
  { city: 'Chattogram', area: 'Agrabad' },
  { city: 'Rajshahi', area: 'Shaheb Bazar' },
  { city: 'Khulna', area: 'Khalishpur' },
  { city: 'Sylhet', area: 'Zindabazar' },
  { city: 'Barishal', area: 'Band Road' },
  { city: 'Rangpur', area: 'Station Road' },
];

const FIRST_NAMES = [
  'Ahnaf',
  'Rafi',
  'Tanvir',
  'Mehedi',
  'Shakib',
  'Imran',
  'Nayeem',
  'Fahim',
  'Arif',
  'Sajid',
  'Nusrat',
  'Tasnim',
  'Farzana',
  'Sadia',
  'Mim',
  'Promi',
  'Jannatul',
  'Sumaiya',
  'Rifat',
  'Mahin',
];

const LAST_NAMES = ['Rahman', 'Islam', 'Hossain', 'Ahmed', 'Chowdhury', 'Karim', 'Khan', 'Akter', 'Haque', 'Siddique'];

const TRACKS: { department: string; degreeProgram: string; subjectPool: string[] }[] = [
  {
    department: 'Computer Science and Engineering',
    degreeProgram: 'BSc in CSE',
    subjectPool: ['Mathematics', 'Higher Mathematics', 'ICT', 'Computer Science', 'Physics'],
  },
  {
    department: 'Electrical and Electronic Engineering',
    degreeProgram: 'BSc in EEE',
    subjectPool: ['Physics', 'Mathematics', 'Higher Mathematics', 'ICT'],
  },
  {
    department: 'English',
    degreeProgram: 'BA (Hons) in English',
    subjectPool: ['English', 'English Language', 'English Literature', 'English 1st Paper', 'English 2nd Paper'],
  },
  {
    department: 'Business Administration',
    degreeProgram: 'BBA',
    subjectPool: ['Accounting', 'Business Studies', 'Finance and Banking', 'Economics', 'Business Entrepreneurship'],
  },
  {
    department: 'Bangla',
    degreeProgram: 'BA (Hons) in Bangla',
    subjectPool: ['Bangla', 'Bangla 1st Paper', 'Bangla 2nd Paper'],
  },
  {
    department: 'Biochemistry and Molecular Biology',
    degreeProgram: 'BSc in Biochemistry',
    subjectPool: ['Biology', 'Chemistry', 'General Science'],
  },
  {
    department: 'Economics',
    degreeProgram: 'BSS in Economics',
    subjectPool: ['Economics', 'Sociology', 'Civics and Good Governance', 'Bangladesh and Global Studies'],
  },
];

const LISTING_TITLE_TEMPLATES = [
  (subject: string, grade: string) => `${subject} tutor needed for ${grade}`,
  (subject: string, grade: string) => `Looking for a ${subject} tutor — ${grade}`,
  (subject: string, grade: string) => `${grade} ${subject} home tutor wanted`,
  (subject: string) => `Experienced tutor needed for ${subject}`,
];

const LISTING_DESCRIPTIONS = [
  'Looking for a dedicated and experienced tutor for my child. Needs help building strong fundamentals and regular practice.',
  'My child is preparing for upcoming exams and needs focused, consistent guidance a few times a week.',
  'Seeking a patient tutor who can explain concepts clearly and keep lessons engaging.',
  'Need someone reliable for regular home tuition — punctuality and clear communication matter most to us.',
  'Looking for a tutor who can also help with homework and exam preparation, not just new topics.',
  null,
];

const TUTOR_INTROS = [
  "I've been tutoring for the past two years and enjoy helping students build confidence in subjects they find difficult.",
  'Patient and structured teaching style — I focus on fundamentals before moving to harder problems.',
  'I love teaching and have helped several students improve their grades significantly over the past year.',
  "Currently a student myself, so I understand what's actually hard about these subjects from a student's point of view.",
  null,
];

function pick<T>(arr: T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)];
  if (item === undefined) throw new Error('pick() called on empty array');
  return item;
}

function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main(): Promise<void> {
  const [universities, subjects, curricula] = await Promise.all([
    prisma.university.findMany({ where: { isActive: true, normalizedName: { not: { contains: 'test university' } } } }),
    prisma.subject.findMany({ where: { isActive: true, name: { not: { startsWith: 'Moderation Spec' } } } }),
    prisma.curriculum.findMany({ where: { isActive: true } }),
  ]);

  if (universities.length === 0 || subjects.length === 0 || curricula.length === 0) {
    throw new Error('Run `pnpm db:seed` first to populate reference data (universities/subjects/curricula).');
  }

  // --- Tutors -----------------------------------------------------------
  const TUTOR_COUNT = 20;
  for (let i = 0; i < TUTOR_COUNT; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const email = `demo.tutor${i + 1}@example.test`;
    const track = pick(TRACKS);
    const university = pick(universities);
    const academicStatus = pick(['CURRENT_STUDENT', 'CURRENT_STUDENT', 'CURRENT_STUDENT', 'GRADUATED'] as const);
    const academicYear =
      academicStatus === 'CURRENT_STUDENT' ? pick(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year']) : null;
    const feeMin = randomInt(2, 6) * 500;
    const feeMax = feeMin + randomInt(2, 6) * 500;
    const location = pick(LOCATIONS);
    const gradeStart = randomInt(0, GRADE_LEVELS.length - 4);
    const gradeCount = randomInt(2, 5);
    const grades = GRADE_LEVELS.slice(gradeStart, gradeStart + gradeCount);
    const availabilityDays = pickMany(WEEKDAYS, randomInt(2, 5));
    const startMinute = pick([900, 960, 1020, 1080]); // 3pm/4pm/5pm/6pm
    const endMinute = startMinute + pick([60, 90, 120]);

    const existing = await prisma.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          email,
          status: 'ACTIVE',
          roles: { create: [{ role: 'TUTOR' }] },
        },
      }));

    await prisma.tutorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        universityId: university.id,
        fullName,
        department: track.department,
        degreeProgram: track.degreeProgram,
        academicStatus,
        academicYear,
        introduction: pick(TUTOR_INTROS),
        preferredFeeMin: feeMin,
        preferredFeeMax: feeMax,
        isAvailable: true,
        subjects: {
          create: pickMany(
            subjects.filter((s) => track.subjectPool.includes(s.name)),
            randomInt(2, 4),
          ).map((s) => ({ subjectId: s.id })),
        },
        grades: { create: grades.map((gradeLevel) => ({ gradeLevel })) },
        curricula: { create: pickMany(curricula, randomInt(1, 2)).map((c) => ({ curriculumId: c.id })) },
        locations: { create: [{ city: location.city, area: location.area }] },
        availability: {
          create: availabilityDays.map((day) => ({ day, startMinute, endMinute })),
        },
      },
    });
  }
  console.log(`Seeded ${TUTOR_COUNT} demo tutor profiles.`);

  // --- Guardians + listings ----------------------------------------------
  const GUARDIAN_COUNT = 10;
  const guardianIds: string[] = [];
  for (let i = 0; i < GUARDIAN_COUNT; i++) {
    const email = `demo.guardian${i + 1}@example.test`;
    const existing = await prisma.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          email,
          status: 'ACTIVE',
          roles: { create: [{ role: 'GUARDIAN' }] },
        },
      }));
    guardianIds.push(user.id);
  }

  const LISTING_COUNT = 20;
  for (let i = 0; i < LISTING_COUNT; i++) {
    const track = pick(TRACKS);
    const primarySubject = pick(track.subjectPool);
    const grade = pick(GRADE_LEVELS.slice(5)); // skip Play/Nursery/KG/Class 1-2 for titles
    const titleTemplate = pick(LISTING_TITLE_TEMPLATES);
    const location = pick(LOCATIONS);
    const salaryMin = randomInt(2, 6) * 500;
    const salaryMax = salaryMin + randomInt(2, 6) * 500;
    const daysPerWeek = randomInt(2, 5);
    const teachingMode = pick<TeachingMode>(['HOME', 'HOME', 'HOME', 'ONLINE', 'BOTH']);
    const scheduleDays = pickMany(WEEKDAYS, daysPerWeek);
    const startMinute = pick([900, 960, 1020, 1080]);
    const endMinute = startMinute + pick([60, 90]);
    const matchedSubjects = subjects.filter((s) => track.subjectPool.includes(s.name));

    await prisma.tuitionListing.create({
      data: {
        guardianUserId: pick(guardianIds),
        title: titleTemplate(primarySubject, grade),
        description: pick(LISTING_DESCRIPTIONS),
        classLevel: grade,
        curriculumId: Math.random() > 0.15 ? pick(curricula).id : null,
        city: location.city,
        area: location.area,
        salaryMin,
        salaryMax,
        daysPerWeek,
        preferredGender: pick(['NO_PREFERENCE', 'MALE', 'FEMALE', null]),
        teachingMode,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - randomInt(0, 20) * 86_400_000),
        subjects: { create: pickMany(matchedSubjects, randomInt(1, 3)).map((s) => ({ subjectId: s.id })) },
        schedules: { create: scheduleDays.map((day) => ({ day, startMinute, endMinute })) },
      },
    });
  }
  console.log(`Seeded ${LISTING_COUNT} demo tuition listings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
