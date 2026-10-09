'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/features/auth/auth-context';
import { AuthedApiError } from '@/lib/authed-api';
import { applyToListing, getMyApplications, withdrawApplication } from './api';
import { APPLICATION_STATUS_BADGE, APPLICATION_STATUS_LABEL } from './format';
import type { ApplicationDetail } from './types';

const WITHDRAWABLE_STATUSES = new Set(['SUBMITTED', 'VIEWED', 'SHORTLISTED']);

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

/**
 * The tuition detail page's bottom CTA (blueprint Phase 8 tutor views:
 * "Application form", "Application confirmation"). Client-rendered because
 * it depends on the viewer's auth state and their own application history,
 * neither of which the server-rendered listing detail page has.
 */
export function ApplySection({ listingId, listingStatus }: { listingId: string; listingStatus: string }) {
  const { status, user } = useAuth();
  const [application, setApplication] = useState<ApplicationDetail | null | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [introduction, setIntroduction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const isTutor = Boolean(user?.roles.includes('TUTOR'));

  useEffect(() => {
    if (status !== 'authenticated' || !isTutor) return;
    let cancelled = false;
    getMyApplications()
      .then((rows) => {
        if (!cancelled) setApplication(rows.find((a) => a.listing.id === listingId) ?? null);
      })
      .catch(() => {
        if (!cancelled) setApplication(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status, isTutor, listingId]);

  async function handleApply() {
    setIsSubmitting(true);
    try {
      const created = await applyToListing(listingId, introduction.trim() || undefined);
      setApplication(created);
      setShowForm(false);
      toast({
        title: 'Application sent',
        description: 'The guardian will review your application.',
        variant: 'success',
      });
    } catch (error) {
      toast({ title: "Couldn't send your application", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWithdraw() {
    if (!application) return;
    setIsWithdrawing(true);
    try {
      const updated = await withdrawApplication(application.id);
      setApplication(updated);
      toast({ title: 'Application withdrawn' });
    } catch (error) {
      toast({ title: "Couldn't withdraw", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsWithdrawing(false);
    }
  }

  // Avoids a flash of the wrong CTA while auth state resolves.
  if (status === 'loading') {
    return <div className="h-12 w-48 animate-pulse rounded-lg bg-canvas" aria-hidden="true" />;
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <div className="flex flex-col gap-3">
        <Button size="lg" className="self-start" asChild>
          <Link href="/login">Sign in to apply</Link>
        </Button>
        <p className="text-sm text-ink-secondary">
          Applying sends your tutor profile to the guardian; your phone number stays private unless
          both of you agree to share contact details.
        </p>
      </div>
    );
  }

  if (!isTutor) {
    return (
      <p className="text-sm text-ink-secondary">
        Only accounts with a tutor profile can apply to tuition opportunities.
      </p>
    );
  }

  if (listingStatus !== 'PUBLISHED') {
    return <p className="text-sm text-ink-secondary">This listing is no longer accepting applications.</p>;
  }

  // Only reached once we're actually fetching this tutor's own application
  // for this listing (the effect above only runs for an authenticated
  // tutor), so `undefined` here means that fetch is still in flight.
  if (application === undefined) {
    return <div className="h-12 w-48 animate-pulse rounded-lg bg-canvas" aria-hidden="true" />;
  }

  if (application) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">Your application</span>
          <Badge variant={APPLICATION_STATUS_BADGE[application.status]}>
            {APPLICATION_STATUS_LABEL[application.status]}
          </Badge>
        </div>
        {WITHDRAWABLE_STATUSES.has(application.status) && (
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            isLoading={isWithdrawing}
            onClick={() => void handleWithdraw()}
          >
            Withdraw application
          </Button>
        )}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex flex-col gap-3">
        <Field>
          <FieldLabel htmlFor="application-introduction">Introduce yourself (optional)</FieldLabel>
          <Textarea
            id="application-introduction"
            maxLength={1000}
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            placeholder="Share your relevant teaching experience and availability."
          />
        </Field>
        <div className="flex gap-2">
          <Button isLoading={isSubmitting} onClick={() => void handleApply()}>
            Send application
          </Button>
          <Button variant="tertiary" onClick={() => setShowForm(false)} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" className="self-start" onClick={() => setShowForm(true)}>
        Apply for this tuition
      </Button>
      <p className="text-sm text-ink-secondary">
        Applying sends your tutor profile to the guardian; your phone number stays private unless
        both of you agree to share contact details.
      </p>
    </div>
  );
}
