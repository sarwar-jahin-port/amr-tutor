'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { getListingApplicants, updateApplicationStatus } from '@/features/applications/api';
import { APPLICATION_STATUS_BADGE, APPLICATION_STATUS_LABEL } from '@/features/applications/format';
import type { ApplicationDetail, OwnerSettableStatus } from '@/features/applications/types';
import { getMyListing } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';
import { createConversation } from '@/features/messaging/api';
import { AuthedApiError } from '@/lib/authed-api';

const ACADEMIC_STATUS_LABEL: Record<string, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

/** Messaging opens once the owner has shown interest (decision record §4.2 state chain). */
const MESSAGEABLE_STATUSES = new Set(['SHORTLISTED', 'CONTACT_REQUESTED', 'ACCEPTED']);

function ApplicantCard({
  application,
  onUpdated,
}: {
  application: ApplicationDetail;
  onUpdated: (updated: ApplicationDetail) => void;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<OwnerSettableStatus | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  async function handleTransition(target: OwnerSettableStatus) {
    setPendingAction(target);
    try {
      onUpdated(await updateApplicationStatus(application.id, target));
    } catch (error) {
      const message = error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
      toast({ title: "Couldn't update application", description: message, variant: 'danger' });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleMessage() {
    setIsOpeningChat(true);
    try {
      const conversation = await createConversation(application.id);
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      const message = error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
      toast({ title: "Couldn't open the conversation", description: message, variant: 'danger' });
      setIsOpeningChat(false);
    }
  }

  // ACCEPTED is only reachable from CONTACT_REQUESTED — the contact-sharing
  // step in /messages starts that transition, not this status button
  // (decision record §4.2: SUBMITTED -> VIEWED -> SHORTLISTED ->
  // CONTACT_REQUESTED -> ACCEPTED).
  const canShortlist = application.status === 'SUBMITTED' || application.status === 'VIEWED';
  const canDecline =
    application.status === 'SUBMITTED' || application.status === 'VIEWED' || application.status === 'SHORTLISTED';
  const canAccept = application.status === 'CONTACT_REQUESTED';
  const canMessage = MESSAGEABLE_STATUSES.has(application.status);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Link
            href={`/tutors/${application.tutor.id}`}
            target="_blank"
            className="font-semibold text-ink hover:text-primary"
          >
            {application.tutor.fullName}
          </Link>
          <p className="text-sm text-ink-secondary">
            {application.tutor.university.name} · {ACADEMIC_STATUS_LABEL[application.tutor.academicStatus]}
          </p>
        </div>
        <Badge variant={APPLICATION_STATUS_BADGE[application.status]}>
          {APPLICATION_STATUS_LABEL[application.status]}
        </Badge>
      </div>

      {application.tutor.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {application.tutor.subjects.map((subject) => (
            <Badge key={subject.id} variant="neutral">
              {subject.name}
            </Badge>
          ))}
        </div>
      )}

      {application.introduction && (
        <p className="whitespace-pre-line text-sm text-ink-secondary">{application.introduction}</p>
      )}

      {(canShortlist || canAccept || canDecline || canMessage) && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {canMessage && (
            <Button variant="secondary" size="sm" isLoading={isOpeningChat} onClick={() => void handleMessage()}>
              Message
            </Button>
          )}
          {canShortlist && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={pendingAction === 'SHORTLISTED'}
              disabled={pendingAction !== null}
              onClick={() => void handleTransition('SHORTLISTED')}
            >
              Shortlist
            </Button>
          )}
          {canAccept && (
            <Button
              size="sm"
              isLoading={pendingAction === 'ACCEPTED'}
              disabled={pendingAction !== null}
              onClick={() => void handleTransition('ACCEPTED')}
            >
              Accept
            </Button>
          )}
          {canDecline && (
            <Button
              variant="tertiary"
              size="sm"
              isLoading={pendingAction === 'DECLINED'}
              disabled={pendingAction !== null}
              onClick={() => void handleTransition('DECLINED')}
            >
              Decline
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ListingApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState<ListingDetail | null | undefined>(undefined);
  const [applications, setApplications] = useState<ApplicationDetail[] | undefined>(undefined);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    Promise.all([getMyListing(id), getListingApplicants(id)])
      .then(([listingResult, applicationsResult]) => {
        if (cancelled) return;
        setListing(listingResult);
        setApplications(applicationsResult);
      })
      .catch(() => {
        if (!cancelled) setListing(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status, id]);

  if (status === 'loading' || (status === 'authenticated' && listing === undefined)) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </Container>
      </>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container as="main" className="flex min-h-screen items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </Container>
    );
  }

  if (!listing) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="py-16">
          <EmptyState
            title="Listing not found"
            description="This listing doesn't exist, or isn't owned by your account."
            action={
              <Button asChild>
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            }
          />
        </Container>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <div className="flex flex-col gap-1">
          <Link href="/dashboard" className="text-sm text-ink-secondary hover:text-primary">
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Applicants for &quot;{listing.title}&quot;</h1>
        </div>

        {applications && applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Tutors who apply to this listing will show up here."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {applications?.map((application) => (
              <ApplicantCard
                key={application.id}
                application={application}
                onUpdated={(updated) =>
                  setApplications((rows) => rows?.map((a) => (a.id === updated.id ? updated : a)))
                }
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
