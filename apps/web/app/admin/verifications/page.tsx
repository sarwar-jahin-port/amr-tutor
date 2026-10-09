'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { decideVerification, getEvidenceDownloadUrl, getVerificationQueue } from '@/features/verifications/api';
import { VERIFICATION_STATUS_BADGE, VERIFICATION_STATUS_LABEL, VERIFICATION_TYPE_LABEL, formatFileSize } from '@/features/verifications/format';
import type { VerificationDecision, VerificationRequestDetail } from '@/features/verifications/types';
import { AuthedApiError } from '@/lib/authed-api';

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

function QueueCard({
  request,
  onDecided,
}: {
  request: VerificationRequestDetail;
  onDecided: (id: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [pendingDecision, setPendingDecision] = useState<VerificationDecision | null>(null);

  async function handleDecide(decision: VerificationDecision) {
    if (decision !== 'APPROVE' && !reason.trim()) {
      toast({ title: 'A reason is required', description: 'Explain why, so the tutor knows what to fix.', variant: 'danger' });
      return;
    }
    setPendingDecision(decision);
    try {
      await decideVerification(request.id, decision, reason.trim() || undefined);
      onDecided(request.id);
      toast({ title: 'Decision recorded', variant: 'success' });
    } catch (error) {
      toast({ title: "Couldn't record decision", description: errorMessage(error), variant: 'danger' });
    } finally {
      setPendingDecision(null);
    }
  }

  async function handleViewEvidence(evidenceId: string) {
    try {
      const url = await getEvidenceDownloadUrl(request.id, evidenceId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({ title: "Couldn't open file", description: errorMessage(error), variant: 'danger' });
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold text-ink">{request.tutor.fullName}</p>
          <p className="text-sm text-ink-secondary">{VERIFICATION_TYPE_LABEL[request.type]}</p>
        </div>
        <Badge variant={VERIFICATION_STATUS_BADGE[request.status]}>{VERIFICATION_STATUS_LABEL[request.status]}</Badge>
      </div>

      <div className="flex flex-col gap-2">
        {request.evidence.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-canvas px-3 py-2 text-sm">
            <span className="truncate text-ink">{e.originalFileName ?? e.type}</span>
            <div className="flex shrink-0 items-center gap-2 text-ink-secondary">
              <span>{formatFileSize(e.sizeBytes)}</span>
              <Button variant="tertiary" size="sm" onClick={() => void handleViewEvidence(e.id)}>
                View
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Textarea
        placeholder="Reason (required to reject or request more information)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={1000}
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" isLoading={pendingDecision === 'APPROVE'} disabled={pendingDecision !== null} onClick={() => void handleDecide('APPROVE')}>
          Approve
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isLoading={pendingDecision === 'REQUEST_MORE_INFO'}
          disabled={pendingDecision !== null}
          onClick={() => void handleDecide('REQUEST_MORE_INFO')}
        >
          Request more info
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          isLoading={pendingDecision === 'REJECT'}
          disabled={pendingDecision !== null}
          onClick={() => void handleDecide('REJECT')}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

export default function AdminVerificationsPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequestDetail[] | undefined>(undefined);

  const isReviewer = Boolean(user?.roles.includes('VERIFIER') || user?.roles.includes('ADMIN'));

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !isReviewer) return;
    let cancelled = false;
    getVerificationQueue().then((rows) => {
      if (!cancelled) setRequests(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, isReviewer]);

  if (status === 'loading' || (status === 'authenticated' && isReviewer && requests === undefined)) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
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

  if (!isReviewer) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Verification queue</h1>
          <p className="text-ink-secondary">Your account doesn&apos;t have reviewer access.</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Verification queue</h1>

        {requests && requests.length === 0 ? (
          <EmptyState title="Nothing to review" description="No verification requests are waiting right now." />
        ) : (
          <div className="flex flex-col gap-4">
            {requests?.map((request) => (
              <QueueCard
                key={request.id}
                request={request}
                onDecided={(id) => setRequests((rows) => rows?.filter((r) => r.id !== id))}
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
