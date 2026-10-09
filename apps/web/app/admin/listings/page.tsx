'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { getListingQueue, updateListingModerationStatus } from '@/features/admin/listings-api';
import type { ListingDetail } from '@/features/listing-owner/types';
import { AuthedApiError } from '@/lib/authed-api';

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

type Decision = 'PUBLISHED' | 'REJECTED' | 'PAUSED';

function ListingQueueCard({ listing, onDecided }: { listing: ListingDetail; onDecided: (id: string) => void }) {
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState<Decision | null>(null);

  async function handleDecide(decision: Decision) {
    if (decision === 'REJECTED' && !reason.trim()) {
      toast({ title: 'A reason is required to reject', variant: 'danger' });
      return;
    }
    setPending(decision);
    try {
      await updateListingModerationStatus(listing.id, decision, reason.trim() || undefined);
      onDecided(listing.id);
      toast({ title: 'Decision recorded', variant: 'success' });
    } catch (error) {
      toast({ title: "Couldn't update listing", description: errorMessage(error), variant: 'danger' });
    } finally {
      setPending(null);
    }
  }

  const canApprove = listing.status === 'PENDING_REVIEW' || listing.status === 'PAUSED';
  const canPause = listing.status === 'PUBLISHED';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <Link href={`/tuition/${listing.id}`} target="_blank" className="font-semibold text-ink hover:text-primary">
            {listing.title}
          </Link>
          <p className="text-sm text-ink-secondary">
            {listing.classLevel} · {listing.area}, {listing.city}
          </p>
        </div>
        <Badge variant="neutral">{listing.status}</Badge>
      </div>

      {listing.description && <p className="whitespace-pre-line text-sm text-ink-secondary">{listing.description}</p>}

      <Textarea
        placeholder="Reason (required to reject)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={1000}
      />

      <div className="flex flex-wrap gap-2">
        {canApprove && (
          <Button size="sm" isLoading={pending === 'PUBLISHED'} disabled={pending !== null} onClick={() => void handleDecide('PUBLISHED')}>
            Approve
          </Button>
        )}
        {canPause && (
          <Button
            variant="secondary"
            size="sm"
            isLoading={pending === 'PAUSED'}
            disabled={pending !== null}
            onClick={() => void handleDecide('PAUSED')}
          >
            Pause
          </Button>
        )}
        <Button variant="tertiary" size="sm" isLoading={pending === 'REJECTED'} disabled={pending !== null} onClick={() => void handleDecide('REJECTED')}>
          Reject
        </Button>
      </div>
    </div>
  );
}

export default function AdminListingsPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<ListingDetail[] | undefined>(undefined);

  const isAdmin = Boolean(user?.roles.includes('ADMIN'));

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    let cancelled = false;
    getListingQueue().then((rows) => {
      if (!cancelled) setListings(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, isAdmin]);

  if (status === 'loading' || (status === 'authenticated' && isAdmin && listings === undefined)) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 w-full" />
        </Container>
      </>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <Container as="main" className="flex min-h-screen items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Listing review</h1>
          <p className="text-ink-secondary">Your account doesn&apos;t have admin access.</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Listing review</h1>

        {listings && listings.length === 0 ? (
          <EmptyState title="Nothing pending" description="No listings are waiting for review right now." />
        ) : (
          <div className="flex flex-col gap-4">
            {listings?.map((listing) => (
              <ListingQueueCard
                key={listing.id}
                listing={listing}
                onDecided={(id) => setListings((rows) => rows?.filter((l) => l.id !== id))}
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
