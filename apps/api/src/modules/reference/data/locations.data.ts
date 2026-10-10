/**
 * Bangladesh's administrative Division -> District hierarchy, used to power
 * the `/references/locations` picker (decision record 0001 §11: all
 * divisions enabled at launch, Dhaka pre-selected as default).
 *
 * There is no Location table in prisma/schema.prisma — TutorLocation and
 * TuitionListing store `city`/`area` as free-text strings deliberately (see
 * docs/decisions/0001-phase-0-mvp-scope.md §11: "No schema distinction
 * between launch and future divisions is needed"). This static list is the
 * canonical picker data; search still matches against the free-text columns.
 */
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function division(name: string, districtNames: string[], isDefault = false): Division {
  const divisionSlug = slugify(name);
  return {
    id: divisionSlug,
    name,
    isDefault,
    districts: districtNames.map((districtName) => ({
      id: `${divisionSlug}/${slugify(districtName)}`,
      name: districtName,
    })),
  };
}

export const DIVISIONS: Division[] = [
  division(
    'Dhaka',
    [
      'Dhaka',
      'Faridpur',
      'Gazipur',
      'Gopalganj',
      'Kishoreganj',
      'Madaripur',
      'Manikganj',
      'Munshiganj',
      'Narayanganj',
      'Narsingdi',
      'Rajbari',
      'Shariatpur',
      'Tangail',
    ],
    true,
  ),
  division('Chittagong', [
    'Bandarban',
    'Brahmanbaria',
    'Chandpur',
    'Chattogram',
    'Comilla',
    "Cox's Bazar",
    'Feni',
    'Khagrachhari',
    'Lakshmipur',
    'Noakhali',
    'Rangamati',
  ]),
  division('Rajshahi', [
    'Bogura',
    'Joypurhat',
    'Naogaon',
    'Natore',
    'Chapai Nawabganj',
    'Pabna',
    'Rajshahi',
    'Sirajganj',
  ]),
  division('Khulna', [
    'Bagerhat',
    'Chuadanga',
    'Jashore',
    'Jhenaidah',
    'Khulna',
    'Kushtia',
    'Magura',
    'Meherpur',
    'Narail',
    'Satkhira',
  ]),
  division('Barisal', ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur']),
  division('Sylhet', ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet']),
  division('Rangpur', [
    'Dinajpur',
    'Gaibandha',
    'Kurigram',
    'Lalmonirhat',
    'Nilphamari',
    'Panchagarh',
    'Rangpur',
    'Thakurgaon',
  ]),
  division('Mymensingh', ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur']),
];
