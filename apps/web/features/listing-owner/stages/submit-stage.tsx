'use client';

import { CircleCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { submitListingForReview } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';

export function SubmitStage({
  listing,
  onSaved,
}: {
  listing: ListingDetail;
  onSaved: (listing: ListingDetail) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const saved = await submitListingForReview(listing.id);
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to submit this listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (listing.status === 'PUBLISHED') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-soft-green p-4 text-sm text-ink">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p>
          Your listing is live. Tutors can find it at{' '}
          <Link href={`/tuition/${listing.id}`} className="font-medium text-primary hover:underline" target="_blank">
            its public page
          </Link>
          .
        </p>
      </div>
    );
  }

  if (listing.status === 'PENDING_REVIEW') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-information/20 bg-surface p-4 text-sm text-ink">
        <Clock className="mt-0.5 size-5 shrink-0 text-information" aria-hidden="true" />
        <p>Your listing is waiting for admin review. We&apos;ll let you know once it&apos;s decided.</p>
      </div>
    );
  }

  if (listing.status === 'CLOSED') {
    return <p className="text-sm text-ink-secondary">This listing is closed and no longer accepting applications.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {listing.status === 'REJECTED' && (
        <Alert variant="danger" title="This listing was rejected">
          Make any needed changes in the earlier steps, then resubmit it below.
        </Alert>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5">
        <Clock className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-ink">Every listing is reviewed before it goes live</p>
          <p className="text-sm text-ink-secondary">
            An administrator checks new and edited listings before they&apos;re shown publicly. This
            usually doesn&apos;t take long, and you can keep editing a draft in the meantime.
          </p>
        </div>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button onClick={onSubmit} isLoading={isSubmitting} className="self-start">
        {listing.status === 'REJECTED' ? 'Resubmit for review' : 'Submit for review'}
      </Button>
    </div>
  );
}

