'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StageStepper } from '@/components/stage-stepper';
import { useAuth } from '@/features/auth/auth-context';
import type { Division, ReferenceItem } from '@/features/marketplace/types';
import { getMyListing } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';
import { BasicsStage } from './stages/basics-stage';
import { BudgetStage } from './stages/budget-stage';
import { DescriptionStage } from './stages/description-stage';
import { PreviewStage } from './stages/preview-stage';
import { ScheduleStage } from './stages/schedule-stage';
import { SubmitStage } from './stages/submit-stage';

const STEPS = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Schedule' },
  { id: 3, label: 'Budget & preferences' },
  { id: 4, label: 'Description' },
  { id: 5, label: 'Preview' },
  { id: 6, label: 'Submit' },
];

export interface ListingWizardReferenceData {
  subjects: ReferenceItem[];
  grades: ReferenceItem[];
  curricula: ReferenceItem[];
  universities: ReferenceItem[];
  divisions: Division[];
}

export function ListingWizard({
  listingId,
  subjects,
  grades,
  curricula,
  universities,
  divisions,
}: ListingWizardReferenceData & { listingId?: string }) {
  const { status, user } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(!!listingId);
  const [stage, setStage] = useState(1);
  const [furthestReached, setFurthestReached] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !listingId) return;
    let cancelled = false;
    getMyListing(listingId)
      .then((existing) => {
        if (cancelled) return;
        if (!existing) {
          setNotFound(true);
          return;
        }
        setListing(existing);
        setFurthestReached(5);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, listingId]);

  function advanceTo(next: number) {
    setStage(next);
    setFurthestReached((f) => Math.max(f, next));
  }

  function handleSaved(updated: ListingDetail, nextStage: number) {
    const isNew = !listing;
    setListing(updated);
    if (isNew) {
      // A router.replace() here would navigate from /listings/new to the
      // /listings/[id]/edit route — a different page component — which
      // remounts ListingWizard and loses the stage we're about to advance
      // to. Swap the URL in place instead so the wizard keeps its state.
      window.history.replaceState(null, '', `/listings/${updated.id}/edit`);
    }
    advanceTo(nextStage);
  }

  if (status === 'loading' || loading) {
    return (
      <Container as="main" narrow className="flex min-h-screen flex-col gap-4 py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (status !== 'authenticated') return null;

  if (user && !user.roles.includes('GUARDIAN')) {
    return (
      <Container as="main" narrow className="py-16">
        <EmptyState
          title="You need the guardian role for this"
          description="Add the guardian role to your account from settings to publish a tuition listing."
          action={
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container as="main" narrow className="py-16">
        <EmptyState
          title="This listing isn't available"
          description="It may not exist, or it may belong to a different account."
          action={
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container as="main" narrow className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {listing ? 'Edit your tuition listing' : 'Publish a tuition listing'}
        </h1>
        <p className="text-ink-secondary">
          Each step saves on its own, so you can stop and come back without losing anything.
        </p>
      </div>

      <StageStepper steps={STEPS} current={stage} furthestReached={furthestReached} onSelect={advanceTo} />

      {stage === 1 && (
        <BasicsStage
          listing={listing}
          subjects={subjects}
          grades={grades}
          divisions={divisions}
          onSaved={(l) => handleSaved(l, 2)}
        />
      )}
      {stage === 2 && listing && <ScheduleStage listing={listing} onSaved={(l) => handleSaved(l, 3)} />}
      {stage === 3 && listing && (
        <BudgetStage
          listing={listing}
          curricula={curricula}
          universities={universities}
          onSaved={(l) => handleSaved(l, 4)}
        />
      )}
      {stage === 4 && listing && <DescriptionStage listing={listing} onSaved={(l) => handleSaved(l, 5)} />}
      {stage === 5 && listing && <PreviewStage listing={listing} onContinue={() => advanceTo(6)} />}
      {stage === 6 && listing && <SubmitStage listing={listing} onSaved={setListing} />}

      {stage === 6 && (
        <Button asChild variant="secondary" className="self-start">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      )}
    </Container>
  );
}
