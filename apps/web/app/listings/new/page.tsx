import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { getCurricula, getGrades, getLocations, getSubjects, getUniversities } from '@/features/marketplace/api';
import { ListingWizard } from '@/features/listing-owner/listing-wizard';

export const metadata: Metadata = {
  title: 'Publish a tuition listing — AMR Tutor',
};

export default async function NewListingPage() {
  const [subjects, grades, curricula, universities, divisions] = await Promise.all([
    getSubjects(),
    getGrades(),
    getCurricula(),
    getUniversities(),
    getLocations(),
  ]);

  return (
    <>
      <SiteHeader />
      <ListingWizard
        subjects={subjects}
        grades={grades}
        curricula={curricula}
        universities={universities}
        divisions={divisions}
      />
    </>
  );
}
