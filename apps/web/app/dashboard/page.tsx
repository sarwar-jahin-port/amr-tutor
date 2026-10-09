'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-context';
import { getOwnGuardianProfile } from '@/features/guardian-profile/api';
import type { GuardianProfile } from '@/features/guardian-profile/types';
import { closeListing, getMyListings } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';
import { getOwnTutorProfile } from '@/features/tutor-profile/api';
import type { TutorProfile } from '@/features/tutor-profile/types';

const ACADEMIC_STATUS_LABEL: Record<string, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

function TutorProfileCard() {
  const [profile, setProfile] = useState<TutorProfile | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getOwnTutorProfile().then((result) => {
      if (!cancelled) setProfile(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (profile === undefined) {
    return <Skeleton className="h-28 w-full rounded-2xl" />;
  }

  if (profile === null) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-5">
        <p className="font-semibold text-ink">Set up your tutor profile</p>
        <p className="text-sm text-ink-secondary">
          Guardians can&apos;t find or apply for you yet — add your academic background, subjects,
          and availability to become discoverable.
        </p>
        <Button asChild className="self-start">
          <Link href="/onboarding/tutor">Set up profile</Link>
        </Button>
      </div>
    );
  }

  const isComplete = profile.subjects.length > 0 && profile.locations.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-ink">Your tutor profile</p>
        <Badge variant={isComplete ? 'success' : 'warning'}>
          {isComplete ? 'Discoverable' : 'Incomplete'}
        </Badge>
      </div>
      <p className="text-sm text-ink-secondary">
        {profile.university.name} · {ACADEMIC_STATUS_LABEL[profile.academicStatus]}
      </p>
      {!isComplete && (
        <p className="text-sm text-ink-secondary">
          Add your subjects and at least one area to appear in tutor search results.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href="/onboarding/tutor">{isComplete ? 'Edit profile' : 'Continue setup'}</Link>
        </Button>
        <Button asChild variant="tertiary" size="sm">
          <Link href={`/tutors/${profile.id}`} target="_blank">
            View public profile
          </Link>
        </Button>
        <Button asChild variant="tertiary" size="sm">
          <Link href="/applications">My applications</Link>
        </Button>
        <Button asChild variant="tertiary" size="sm">
          <Link href="/verification">Verification</Link>
        </Button>
      </div>
    </div>
  );
}

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

function ListingRow({ listing, onClosed }: { listing: ListingDetail; onClosed: (updated: ListingDetail) => void }) {
  const [isClosing, setIsClosing] = useState(false);
  const canEdit = listing.status !== 'CLOSED';
  const canClose = listing.status !== 'CLOSED';

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="font-medium text-ink">{listing.title}</p>
        <div className="flex items-center gap-2">
          <Badge variant={LISTING_STATUS_BADGE[listing.status]}>{LISTING_STATUS_LABEL[listing.status]}</Badge>
          <span className="text-sm text-ink-secondary">
            {listing.area}, {listing.city}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/listings/${listing.id}/applicants`}>Applicants</Link>
        </Button>
        {canEdit && (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
          </Button>
        )}
        {listing.status === 'PUBLISHED' && (
          <Button asChild variant="tertiary" size="sm">
            <Link href={`/tuition/${listing.id}`} target="_blank">
              View
            </Link>
          </Button>
        )}
        {canClose && (
          <Button
            variant="tertiary"
            size="sm"
            isLoading={isClosing}
            onClick={async () => {
              setIsClosing(true);
              try {
                onClosed(await closeListing(listing.id));
              } finally {
                setIsClosing(false);
              }
            }}
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

function GuardianListingsCard() {
  const [profile, setProfile] = useState<GuardianProfile | null | undefined>(undefined);
  const [listings, setListings] = useState<ListingDetail[]>([]);

  useEffect(() => {
    let cancelled = false;
    getOwnGuardianProfile().then((result) => {
      if (cancelled) return;
      setProfile(result);
      if (result) {
        getMyListings().then((rows) => {
          if (!cancelled) setListings(rows);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (profile === undefined) {
    return <Skeleton className="h-28 w-full rounded-2xl" />;
  }

  if (profile === null) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-5">
        <p className="font-semibold text-ink">Set up your guardian profile</p>
        <p className="text-sm text-ink-secondary">
          Add your name so tutors know who they&apos;re applying to before you publish a listing.
        </p>
        <Button asChild className="self-start">
          <Link href="/onboarding/guardian">Set up profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-ink">Your tuition listings</p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/listings/new">Publish a listing</Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-ink-secondary">
          You haven&apos;t published a tuition listing yet. Create one to start hearing from tutors.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onClosed={(updated) =>
                setListings((rows) => rows.map((l) => (l.id === updated.id ? updated : l)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { status, user, logout } = useAuth();
  const router = useRouter();

  // Route protection: the frontend guard is for usability only — every
  // endpoint this page will eventually call still enforces authorization
  // on the server independently (blueprint Phase 3).
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Container as="main" narrow className="flex min-h-screen flex-col justify-center gap-4 py-16">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
      </Container>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <Container as="main" className="flex min-h-screen items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </Container>
    );
  }

  return (
    <Container as="main" narrow className="flex min-h-screen flex-col gap-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Dashboard</h1>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="font-medium text-ink-secondary">Email</dt>
          <dd className="text-ink">{user.email}</dd>
          <dt className="font-medium text-ink-secondary">Phone</dt>
          <dd className="text-ink">{user.phone ?? '—'}</dd>
          <dt className="font-medium text-ink-secondary">Roles</dt>
          <dd className="text-ink">{user.roles.join(', ')}</dd>
          <dt className="font-medium text-ink-secondary">Status</dt>
          <dd>
            <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}>{user.status}</Badge>
          </dd>
        </dl>
      </div>

      {user.roles.includes('TUTOR') && <TutorProfileCard />}

      {user.roles.includes('GUARDIAN') && <GuardianListingsCard />}

      {(user.roles.includes('VERIFIER') || user.roles.includes('ADMIN')) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
          <p className="font-semibold text-ink">Reviewer tools</p>
          <Button asChild variant="secondary" size="sm" className="self-start">
            <Link href="/admin/verifications">Review verification requests</Link>
          </Button>
        </div>
      )}

      <Button variant="secondary" className="self-start" onClick={() => void logout()}>
        Log out
      </Button>
    </Container>
  );
}
