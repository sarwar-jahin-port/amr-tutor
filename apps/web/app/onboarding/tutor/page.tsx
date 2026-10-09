import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { getCurricula, getGrades, getLocations, getSubjects, getUniversities } from '@/features/marketplace/api';
import { OnboardingWizard } from '@/features/tutor-profile/onboarding-wizard';

export const metadata: Metadata = {
  title: 'Set up your tutor profile — AMR Tutor',
};

export default async function TutorOnboardingPage() {
  const [universities, subjects, grades, curricula, divisions] = await Promise.all([
    getUniversities(),
    getSubjects(),
    getGrades(),
    getCurricula(),
    getLocations(),
  ]);

  return (
    <>
      <SiteHeader />
      <OnboardingWizard
        universities={universities}
        subjects={subjects}
        grades={grades}
        curricula={curricula}
        divisions={divisions}
      />
    </>
  );
}
