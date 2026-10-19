'use client';

import { BadgeCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createVerificationFromEducationCertificates, getMyVerifications } from '@/features/verifications/api';
import { VERIFICATION_STATUS_BADGE, VERIFICATION_STATUS_LABEL } from '@/features/verifications/format';
import type { VerificationRequestDetail } from '@/features/verifications/types';
import { AuthedApiError } from '@/lib/authed-api';

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

/**
 * Onboarding Stage E "Optional verification" (ui-ux.md §14). Reuses the
 * certificates already uploaded against the SSC/HSC/University records in
 * the Academic background step as evidence, rather than asking the tutor to
 * upload the same documents again through the standalone /verification page.
 */
export function VerificationStage() {
  const [request, setRequest] = useState<VerificationRequestDetail | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyVerifications()
      .then((rows) => {
        if (cancelled) return;
        const universityAffiliation = rows.find((r) => r.type === 'UNIVERSITY_AFFILIATION') ?? null;
        setRequest(universityAffiliation);
      })
      .catch(() => {
        if (!cancelled) setRequest(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const created = await createVerificationFromEducationCertificates();
      setRequest(created);
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (request === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-11 w-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5">
        <ShieldCheck className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-ink">Verified student</p>
          <p className="text-sm text-ink-secondary">
            Verification lets guardians see that your university affiliation has been checked. It
            does not prove your teaching ability, reliability, or suitability for a particular
            child — guardians are told that explicitly.
          </p>
          <p className="text-sm text-ink-secondary">
            It uses the certificates you uploaded against your SSC, HSC, and University records in the
            Academic background step. Nothing is shared publicly — only an admin reviewer sees the files.
          </p>
        </div>
      </div>

      {request ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-ink">University affiliation</p>
            <Badge variant={VERIFICATION_STATUS_BADGE[request.status]}>
              {request.status === 'APPROVED' && <BadgeCheck className="size-3.5" aria-hidden="true" />}
              {VERIFICATION_STATUS_LABEL[request.status]}
            </Badge>
          </div>
          {request.decisionReason && (request.status === 'NEEDS_INFORMATION' || request.status === 'REJECTED') && (
            <Alert variant={request.status === 'REJECTED' ? 'danger' : 'information'} title="Reviewer note">
              {request.decisionReason}
            </Alert>
          )}
          {request.status === 'IN_REVIEW' && (
            <p className="text-sm text-ink-secondary">A reviewer will check your evidence soon.</p>
          )}
        </div>
      ) : (
        <>
          <Button isLoading={isSubmitting} className="self-start" onClick={() => void handleSubmit()}>
            Submit for verification
          </Button>
          {submitError && <Alert variant="danger">{submitError}</Alert>}
          <p className="-mt-4 text-sm text-ink-secondary">
            Verification is optional either way: you can be discovered and apply for tuition without it.
            If you haven&apos;t uploaded a certificate yet, go back to Academic background to add one first.
          </p>
        </>
      )}

      <Button asChild size="lg" variant="secondary" className="self-start">
        <Link href="/dashboard">Finish and go to your dashboard</Link>
      </Button>
    </div>
  );
}
