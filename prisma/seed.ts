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
// same subjects (SSC/HSC science/commerce/arts groups), English Medium follows
// the Cambridge/Edexcel O/A Level syllabus, and Madrasah (Dakhil/Alim) adds
// its own religious subjects on top of the NCTB core. Level-specific renames
// and near-duplicates (e.g. "Amar Bangla Boi", "Civics and Citizenship") are
// collapsed into one canonical subject rather than listed separately.
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
  'Further Mathematics',
  'ICT',
  'Computer Science',

  // Science group
  'General Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Human Biology',
  'Combined Science',
  'Environmental Management',

  // Social science & humanities (SSC/HSC arts group + IGCSE humanities)
  'Bangladesh and Global Studies',
  'History of Bangladesh and World Civilization',
  'History',
  'Civics and Good Governance',
  'Geography and Environment',
  'Economics',
  'Sociology',
  'Social Work',
  'Logic',
  'Home Science',
  'Global Perspectives',
  'Psychology',
  'Politics',
  'Law',

  // Commerce group
  'Accounting',
  'Business Entrepreneurship',
  'Business Organization and Management',
  'Production Management and Marketing',
  'Finance and Banking',
  'Business Studies',
  'Commerce',

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

// UGC-recognized universities (http://www.ugc-universities.gov.bd/ and
// .../private-universities). Entries the UGC itself lists as not yet
// operational (no admissions started) or shut down are omitted.
const PUBLIC_UNIVERSITIES = [
  'University of Dhaka',
  'University of Rajshahi',
  'Bangladesh Agricultural University',
  'Bangladesh University of Engineering and Technology',
  'University of Chittagong',
  'Jahangirnagar University',
  'Islamic University, Bangladesh',
  'Shahjalal University of Science and Technology',
  'Khulna University',
  'National University',
  'Bangladesh Open University',
  'Bangladesh Medical University',
  'Gazipur Agricultural University',
  'Hajee Mohammad Danesh Science and Technology University',
  'Mawlana Bhashani Science and Technology University',
  'Patuakhali Science and Technology University',
  'Sher-e-Bangla Agricultural University',
  'Chittagong University of Engineering and Technology',
  'Rajshahi University of Engineering and Technology',
  'Khulna University of Engineering and Technology',
  'Dhaka University of Engineering and Technology',
  'Noakhali Science and Technology University',
  'Jagannath University',
  'Comilla University',
  'Jatiya Kabi Kazi Nazrul Islam University',
  'Chittagong Veterinary and Animal Sciences University',
  'Sylhet Agricultural University',
  'Jessore University of Science and Technology',
  'Pabna University of Science and Technology',
  'Begum Rokeya University, Rangpur',
  'Bangladesh University of Professionals',
  'Gopalganj Science and Technology University',
  'Bangladesh University of Textiles',
  'University of Barishal',
  'Rangamati Science and Technology University',
  'Bangladesh Maritime University',
  'Islamic Arabic University',
  'Chittagong Medical University',
  'Rajshahi Medical University',
  'Rabindra University, Bangladesh',
  'University of Frontier Technology, Bangladesh',
  'Netrokona University',
  'Khulna Agricultural University',
  'Jamalpur Science and Technology University',
  'Sylhet Medical University, Sylhet',
  'Aviation and Aerospace University, Bangladesh',
  'Chandpur Science and Technology University',
  'Kishoreganj University',
  'Hobiganj Agricultural University',
  'Khulna Medical University, Khulna',
  'Kurigram Agricultural University',
  'Sunamganj Science and Technology University',
  'Pirojpur Science and Technology University',
  'Naogaon University',
  'Meherpur University',
  'University of Bogura',
  'Dhaka Central University',
  'Thakurgaon University',
  'Lakshmipur Science and Technology University',
  'Narayanganj Science and Technology University',
  'Shariatpur Agricultural University',
];

const PRIVATE_UNIVERSITIES = [
  'North South University',
  'University of Science and Technology Chittagong',
  'Independent University, Bangladesh',
  "Central Women's University",
  'International University of Business Agriculture and Technology',
  'International Islamic University Chittagong',
  'Ahsanullah University of Science and Technology',
  'American International University-Bangladesh',
  'East West University',
  'University of Asia Pacific',
  'Gono Bishwabidyalay',
  "The People's University of Bangladesh",
  'Asian University of Bangladesh',
  'Dhaka International University',
  'Manarat International University',
  'BRAC University',
  'Bangladesh University',
  'Leading University',
  'BGC Trust University Bangladesh',
  'Sylhet International University',
  'University of Development Alternative',
  'Premier University',
  'Southeast University',
  'Daffodil International University',
  'Stamford University Bangladesh',
  'State University of Bangladesh',
  'City University',
  'Prime University',
  'Northern University Bangladesh',
  'Southern University Bangladesh',
  'Green University of Bangladesh',
  'Pundra University of Science and Technology',
  'World University of Bangladesh',
  'Shanto-Mariam University of Creative Technology',
  'The Millennium University',
  'Eastern University',
  'Metropolitan University',
  'Uttara University',
  'United International University',
  'University of South Asia',
  'Victoria University of Bangladesh',
  'Bangladesh University of Business and Technology',
  'Presidency University',
  'University of Information Technology and Sciences',
  'Primeasia University',
  'Royal University of Dhaka',
  'University of Liberal Arts Bangladesh',
  'Atish Dipankar University of Science and Technology',
  'Bangladesh Islami University',
  'ASA University Bangladesh',
  'East Delta University',
  'European University of Bangladesh',
  'Varendra University',
  'Hamdard University Bangladesh',
  'BGMEA University of Fashion and Technology',
  'North East University Bangladesh',
  'First Capital University of Bangladesh',
  'Ishakha International University, Bangladesh',
  'Z.H Sikder University of Science and Technology',
  'Exim Bank Agricultural University, Bangladesh',
  'North Western University',
  'Khwaja Yunus Ali University',
  'Sonargaon University',
  'Feni University',
  'Britannia University',
  'Port City International University',
  'Bangladesh University of Health Sciences',
  'Chittagong Independent University',
  'Notre Dame University Bangladesh',
  'Times University, Bangladesh',
  'North Bengal International University',
  'Fareast International University',
  'Rajshahi Science and Technology University, Natore',
  'Brahmaputra International University',
  "Cox's Bazar International University",
  'R. P. Shaha University',
  'German University Bangladesh',
  'Global University Bangladesh',
  'CCN University of Science and Technology',
  'Bangladesh Army University of Science and Technology, Saidpur',
  'Bangladesh Army University of Engineering and Technology, Qadirabad',
  'Bangladesh Army International University of Science and Technology, Comilla',
  'University of Scholars',
  'Canadian University of Bangladesh',
  'N.P.I University of Bangladesh',
  'Northern University of Business and Technology, Khulna',
  'Rabindra Maitree University, Kushtia',
  'University of Creative Technology, Chittagong',
  'Central University of Science and Technology',
  'Tagore University of Creative Arts, Uttara, Dhaka, Bangladesh',
  'University of Global Village',
  'Anwer Khan Modern University',
  'ZNRF University of Management Sciences',
  'Ahsania Mission University of Science and Technology',
  'Khulna Khan Bahadur Ahsanullah University',
  'Bandarban University',
  'Trust University, Barishal',
  'International Standard University',
  'University of Brahmanbaria',
  'R.T.M Al-Kabir Technical University',
  'Dr. Momtaz Begum University of Science and Technology',
  'Chattogram BGMEA University of Fashion and Technology',
  'Bangladesh Army University of Science and Technology, Khulna',
  'Teesta University, Rangpur',
  'International Islami University of Science and Technology Bangladesh',
  'Lalon University of Science and Arts',
];

const UNIVERSITIES = [...PUBLIC_UNIVERSITIES, ...PRIVATE_UNIVERSITIES];

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
