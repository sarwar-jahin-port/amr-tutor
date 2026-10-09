'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-context';
import type { Division, ReferenceItem } from '@/features/marketplace/types';
import { getOwnTutorProfile } from '@/features/tutor-profile/api';
import type { TutorProfile } from '@/features/tutor-profile/types';
import { StageStepper } from './stage-stepper';
import { AcademicStage } from './stages/academic-stage';
import { AvailabilityStage } from './stages/availability-stage';
import { ExperienceStage } from './stages/experience-stage';
import { RateStage } from './stages/rate-stage';
import { ReviewStage } from './stages/review-stage';
import { TeachingStage } from './stages/teaching-stage';
import { VerificationStage } from './stages/verification-stage';

const STEPS = [
  { id: 1, label: 'Academic background' },
  { id: 2, label: 'Subjects & classes' },
  { id: 3, label: 'Teaching approach' },
  { id: 4, label: 'Areas & availability' },
  { id: 5, label: 'Expected rate' },
  { id: 6, label: 'Review' },
  { id: 7, label: 'Verification' },
];

export interface OnboardingReferenceData {
  universities: ReferenceItem[];
  subjects: ReferenceItem[];
  grades: ReferenceItem[];
  curricula: ReferenceItem[];
  divisions: Division[];
}

export function OnboardingWizard({ universities, subjects, grades, curricula, divisions }: OnboardingReferenceData) {
  const { status } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [stage, setStage] = useState(1);
  const [furthestReached, setFurthestReached] = useState(1);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let cancelled = false;
    getOwnTutorProfile()
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          setProfile(existing);
          // Resuming: every stage up to Review already has data to show.
          setStage(2);
          setFurthestReached(6);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  function advanceTo(next: number) {
    setStage(next);
    setFurthestReached((f) => Math.max(f, next));
  }

  function handleSaved(updated: TutorProfile, nextStage: number) {
    setProfile(updated);
    advanceTo(nextStage);
  }

  if (status === 'loading' || loadingProfile) {
    return (
      <Container as="main" narrow className="flex min-h-screen flex-col gap-4 py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <Container as="main" narrow className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Set up your tutor profile</h1>
        <p className="text-ink-secondary">
          Each step saves on its own, so you can stop and come back without losing anything.
        </p>
      </div>

      <StageStepper steps={STEPS} current={stage} furthestReached={furthestReached} onSelect={advanceTo} />

      {loadError && (
        <p className="text-sm text-danger">
          We couldn&apos;t check whether you already have a profile — starting fresh. If you already
          created one, reload this page.
        </p>
      )}

      {stage === 1 && (
        <AcademicStage profile={profile} universities={universities} onSaved={(p) => handleSaved(p, 2)} />
      )}
      {stage === 2 && profile && (
        <TeachingStage
          profile={profile}
          subjects={subjects}
          grades={grades}
          curricula={curricula}
          onSaved={(p) => handleSaved(p, 3)}
        />
      )}
      {stage === 3 && profile && <ExperienceStage profile={profile} onSaved={(p) => handleSaved(p, 4)} />}
      {stage === 4 && profile && (
        <AvailabilityStage profile={profile} divisions={divisions} onSaved={(p) => handleSaved(p, 5)} />
      )}
      {stage === 5 && profile && <RateStage profile={profile} onSaved={(p) => handleSaved(p, 6)} />}
      {stage === 6 && profile && <ReviewStage profile={profile} onContinue={() => advanceTo(7)} />}
      {stage === 7 && <VerificationStage />}
    </Container>
  );
}
