'use client';

import { ArrowLeft, GraduationCap, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
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
import { formatSalaryRange } from '@/features/marketplace/format';
import { getMyListing } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';
import { createConversation } from '@/features/messaging/api';
import { AuthedApiError } from '@/lib/authed-api';

const ACADEMIC_STATUS_LABEL: Record<string, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

const LISTING_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  PUBLISHED: 'Published',
  PAUSED: 'Paused',
  FILLED: 'Filled',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};

const LISTING_STATUS_BADGE: Record<string, 'neutral' | 'success' | 'information' | 'warning' | 'danger'> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'information',
  PUBLISHED: 'success',
  PAUSED: 'warning',
  FILLED: 'information',
  CLOSED: 'neutral',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
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
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={application.tutor.fullName} className="size-11 shrink-0 text-sm" />
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/tutors/${application.tutor.id}`}
              target="_blank"
              className="font-semibold text-ink hover:text-primary"
            >
              {application.tutor.fullName}
            </Link>
            <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
              <GraduationCap className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              {application.tutor.university.name} · {ACADEMIC_STATUS_LABEL[application.tutor.academicStatus]}
            </p>
          </div>
        </div>
        <Badge variant={APPLICATION_STATUS_BADGE[application.status]}>
          {APPLICATION_STATUS_LABEL[application.status]}
        </Badge>
      </div>

      {application.tutor.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {application.tutor.subjects.map((subject) => (
            <Badge key={subject.id} variant="success">
              {subject.name}
            </Badge>
          ))}
        </div>
      )}

      {application.introduction && (
        <p className="whitespace-pre-line text-sm text-ink-secondary">{application.introduction}</p>
      )}

      {(canShortlist || canAccept || canDecline || canMessage) && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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

function ListingSummaryCard({ listing }: { listing: ListingDetail }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <Badge variant={LISTING_STATUS_BADGE[listing.status]} className="w-fit">
          {LISTING_STATUS_LABEL[listing.status]}
        </Badge>
        <h2 className="text-lg font-semibold leading-snug text-ink">{listing.title}</h2>
        <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {listing.area}, {listing.city}
        </p>
      </div>

      {listing.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {listing.subjects.map((subject) => (
            <Badge key={subject.id} variant="neutral">
              {subject.name}
            </Badge>
          ))}
          <Badge variant="neutral">{listing.classLevel}</Badge>
        </div>
      )}

      <p className="border-t border-border pt-4 text-base font-bold tabular-nums text-primary">
        {formatSalaryRange(listing.salaryMin, listing.salaryMax, listing.currency)}
      </p>

      <div className="flex flex-col gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/listings/${listing.id}/edit`}>Edit listing</Link>
        </Button>
        {listing.status === 'PUBLISHED' && (
          <Button asChild variant="tertiary" size="sm">
            <Link href={`/tuition/${listing.id}`} target="_blank">
              View public listing
            </Link>
          </Button>
        )}
      </div>
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
        <Container as="main" className="flex flex-col gap-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </Container>
      </>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container as="main" className="flex min-h-[60vh] items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </Container>
    );
  }

  if (!listing) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="py-10">
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
      <Container as="main" className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <Link href="/dashboard" className="flex w-fit items-center gap-1.5 text-sm text-ink-secondary hover:text-primary">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to dashboard
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Applicants</h1>
              <p className="text-ink-secondary">
                {applications?.length ?? 0} applicant{applications?.length === 1 ? '' : 's'} for &quot;{listing.title}
                &quot;
              </p>
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
          </div>

          <aside className="lg:sticky lg:top-20">
            <ListingSummaryCard listing={listing} />
          </aside>
        </div>
      </Container>
    </>
  );
}
