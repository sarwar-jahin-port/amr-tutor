'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  LogOut,
  MapPin,
  Megaphone,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { getMyApplications } from '@/features/applications/api';
import type { ApplicationDetail } from '@/features/applications/types';
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

const INACTIVE_APPLICATION_STATUSES = new Set(['WITHDRAWN', 'DECLINED', 'CLOSED']);

function TutorProfileCard() {
  const [profile, setProfile] = useState<TutorProfile | null | undefined>(undefined);
  const [applications, setApplications] = useState<ApplicationDetail[]>([]);

  useEffect(() => {
    let cancelled = false;
    getOwnTutorProfile().then((result) => {
      if (cancelled) return;
      setProfile(result);
      if (result) {
        getMyApplications().then((rows) => {
          if (!cancelled) setApplications(rows);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (profile === undefined) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  if (profile === null) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Set up your tutor profile"
        description="Guardians can't find or apply for you yet — add your academic background, subjects, and availability to become discoverable."
        action={
          <Button asChild>
            <Link href="/onboarding/tutor">Set up profile</Link>
          </Button>
        }
      />
    );
  }

  const isComplete = profile.subjects.length > 0 && profile.locations.length > 0;
  const activeCount = applications.filter((a) => !INACTIVE_APPLICATION_STATUSES.has(a.status)).length;
  const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile icon={ClipboardList} label="Applications sent" value={applications.length} />
        <StatTile icon={Clock} label="Active" value={activeCount} />
        <StatTile icon={CheckCircle2} label="Accepted" value={acceptedCount} />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <GraduationCap className="size-4 text-primary" aria-hidden="true" />
            Your tutor profile
          </h2>
          <Badge variant={isComplete ? 'success' : 'warning'}>{isComplete ? 'Discoverable' : 'Incomplete'}</Badge>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {profile.university.name} · {ACADEMIC_STATUS_LABEL[profile.academicStatus]}
        </p>
        {!isComplete && (
          <p className="text-sm text-ink-secondary">
            Add your subjects and at least one area to appear in tutor search results.
          </p>
        )}
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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
    </section>
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
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ink">{listing.title}</p>
          <Badge variant={LISTING_STATUS_BADGE[listing.status]}>{LISTING_STATUS_LABEL[listing.status]}</Badge>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          {listing.area}, {listing.city}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/listings/${listing.id}/applicants`}>
            <Users className="size-3.5" aria-hidden="true" />
            Applicants
          </Link>
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
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  if (profile === null) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Set up your guardian profile"
        description="Add your name so tutors know who they're applying to before you publish a listing."
        action={
          <Button asChild>
            <Link href="/onboarding/guardian">Set up profile</Link>
          </Button>
        }
      />
    );
  }

  const publishedCount = listings.filter((l) => l.status === 'PUBLISHED').length;
  const pendingCount = listings.filter((l) => l.status === 'PENDING_REVIEW').length;

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile icon={FileText} label="Total listings" value={listings.length} />
        <StatTile icon={CheckCircle2} label="Published" value={publishedCount} />
        <StatTile icon={Clock} label="Pending review" value={pendingCount} />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Megaphone className="size-4 text-primary" aria-hidden="true" />
            Your tuition listings
          </h2>
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
    </section>
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
      <>
        <SiteHeader />
        <Container as="main" className="flex flex-col gap-6 py-10">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </Container>
      </>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <>
        <SiteHeader />
        <Container as="main" className="flex min-h-[60vh] items-center justify-center">
          <p className="text-ink-secondary">Redirecting to log in…</p>
        </Container>
      </>
    );
  }

  const isModerator = user.roles.some((role) => role === 'VERIFIER' || role === 'MODERATOR' || role === 'ADMIN');

  return (
    <>
      <SiteHeader />
      <Container as="main" className="flex flex-col gap-8 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Welcome back</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
              <span>
                {user.email}
                {user.phone ? ` · ${user.phone}` : ''}
              </span>
              <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}>{user.status}</Badge>
              {user.roles.map((role) => (
                <Badge key={role} variant="information">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="secondary" onClick={() => void logout()}>
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        </header>

        {user.roles.includes('TUTOR') && <TutorProfileCard />}

        {user.roles.includes('GUARDIAN') && <GuardianListingsCard />}

        {isModerator && (
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
              Moderation tools
            </h2>
            <Button asChild variant="secondary" size="sm" className="self-start">
              <Link href="/admin">Open moderation dashboard</Link>
            </Button>
          </section>
        )}
      </Container>
    </>
  );
}
