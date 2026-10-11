import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Reflects what students actually study and tutors actually advertise across
// the four curricula below: NCTB's Bangla Medium and English Version share the
// same subjects (SSC science/commerce/arts groups), English Medium follows
// the Cambridge/Edexcel O/A Level syllabus, and Madrasah (Dakhil/Alim) adds
// its own religious subjects on top of the NCTB core.
const SUBJECTS = [
  // Core (every curriculum)
  'Bangla',
  'Bangla 1st Paper',
  'Bangla 2nd Paper',
  'English',
  'English 1st Paper',
  'English 2nd Paper',
  'English Language',
  'English Literature',
  'Mathematics',
  'Higher Mathematics',
  'Additional Mathematics',
  'ICT',
  'Computer Science',

  // Science group
  'General Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Combined Science',

  // Social science & humanities (SSC arts group)
  'Bangladesh and Global Studies',
  'History of Bangladesh and World Civilization',
  'Civics and Good Governance',
  'Geography and Environment',
  'Economics',
  'Sociology',

  // Commerce group
  'Accounting',
  'Business Entrepreneurship',
  'Finance and Banking',
  'Business Studies',

  // Religion and moral education
  'Islam and Moral Education',
  'Hindu Religious Education',

  // Madrasah (Dakhil/Alim)
  'Arabic',
  'Quran Majid and Tajwid',
  'Hadis Sharif',
  'Islamic History and Culture',

  'Agriculture Studies',
];

const CURRICULA = [
  'Bangla Medium (NCTB)',
  'English Version (NCTB)',
  'English Medium (O/A Level)',
  'Madrasah (Dakhil/Alim)',
];

// A starting pilot directory, not an exhaustive list. Administrators can
// extend it later (docs/master_implementation_blueprint.md §8.2).
const UNIVERSITIES = [
  'University of Dhaka',
  'Bangladesh University of Engineering and Technology',
  'Jahangirnagar University',
  'North South University',
  'BRAC University',
  'University of Chittagong',
  'Chittagong University of Engineering and Technology',
  'University of Rajshahi',
  'Khulna University',
  'Shahjalal University of Science and Technology',
  'University of Barisal',
  'Begum Rokeya University, Rangpur',
  'Bangladesh Agricultural University',
  'Jagannath University',
  'Islamic University of Technology',
  'Rajshahi University of Engineering and Technology',
  'Khulna University of Engineering and Technology',
  'Dhaka University of Engineering and Technology',
  'Military Institute of Science and Technology',
  'Jatiya Kabi Kazi Nazrul Islam University',
  'American International University-Bangladesh',
  'Independent University, Bangladesh',
  'East West University',
  'United International University',
  'Ahsanullah University of Science and Technology',
  'Daffodil International University',
  'Southeast University',
];

async function main(): Promise<void> {
  for (const name of SUBJECTS) {
    const normalizedName = normalize(name);
    await prisma.subject.upsert({
      where: { normalizedName },
      update: { name },
      create: { name, normalizedName },
    });
  }
  console.log(`Seeded ${SUBJECTS.length} subjects.`);

  for (const name of CURRICULA) {
    const normalizedName = normalize(name);
    await prisma.curriculum.upsert({
      where: { normalizedName },
      update: { name },
      create: { name, normalizedName },
    });
  }
  console.log(`Seeded ${CURRICULA.length} curricula.`);

  for (const name of UNIVERSITIES) {
    const normalizedName = normalize(name);
    await prisma.university.upsert({
      where: { normalizedName },
      update: { name },
      create: { name, normalizedName },
    });
  }
  console.log(`Seeded ${UNIVERSITIES.length} universities.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
