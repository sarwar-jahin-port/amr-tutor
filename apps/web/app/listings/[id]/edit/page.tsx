import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { getCurricula, getGrades, getLocations, getSubjects, getUniversities } from '@/features/marketplace/api';
import { ListingWizard } from '@/features/listing-owner/listing-wizard';

export const metadata: Metadata = {
  title: 'Edit your tuition listing — AMR Tutor',
};

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;

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
        listingId={id}
        subjects={subjects}
        grades={grades}
        curricula={curricula}
        universities={universities}
        divisions={divisions}
      />
    </>
  );
}
