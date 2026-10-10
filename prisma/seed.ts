import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Bangla', 'ICT'];

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
