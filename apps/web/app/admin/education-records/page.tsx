'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/features/auth/auth-context';
import {
  decideEducationRecord,
  getAdminCertificateDownloadUrl,
  getPendingEducationRecords,
} from '@/features/tutor-profile/admin-education-api';
import { EDUCATION_LEVEL_LABEL, type AdminEducationRecord } from '@/features/tutor-profile/education-types';
import { AuthedApiError } from '@/lib/authed-api';

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

function QueueCard({
  record,
  onDecided,
}: {
  record: AdminEducationRecord;
  onDecided: (id: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject' | null>(null);
  const [isViewing, setIsViewing] = useState(false);

  async function handleView() {
    setIsViewing(true);
    try {
      const url = await getAdminCertificateDownloadUrl(record.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({ title: "Couldn't open file", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsViewing(false);
    }
  }

  async function handleDecide(approve: boolean) {
    if (!approve && !reason.trim()) {
      toast({ title: 'A reason is required', description: 'Explain why, so the tutor knows what to fix.', variant: 'danger' });
      return;
    }
    setPendingDecision(approve ? 'approve' : 'reject');
    try {
      await decideEducationRecord(record.id, approve, reason.trim() || undefined);
      onDecided(record.id);
      toast({ title: 'Decision recorded', variant: 'success' });
    } catch (error) {
      toast({ title: "Couldn't record decision", description: errorMessage(error), variant: 'danger' });
    } finally {
      setPendingDecision(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold text-ink">{record.tutor.fullName}</p>
          <p className="text-sm text-ink-secondary">{EDUCATION_LEVEL_LABEL[record.level]}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-canvas px-3 py-2 text-sm">
        <span className="truncate text-ink">
          {record.institution}
          {record.gpa ? ` · GPA ${record.gpa}` : ''}
        </span>
        <Button variant="tertiary" size="sm" isLoading={isViewing} onClick={() => void handleView()}>
          View certificate
        </Button>
      </div>

      <Textarea
        placeholder="Reason (required to reject)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={1000}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          isLoading={pendingDecision === 'approve'}
          disabled={pendingDecision !== null}
          onClick={() => void handleDecide(true)}
        >
          Approve
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          isLoading={pendingDecision === 'reject'}
          disabled={pendingDecision !== null}
          onClick={() => void handleDecide(false)}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

export default function AdminEducationRecordsPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<AdminEducationRecord[] | undefined>(undefined);

  const isReviewer = Boolean(user?.roles.includes('VERIFIER') || user?.roles.includes('ADMIN'));

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !isReviewer) return;
    let cancelled = false;
    getPendingEducationRecords().then((rows) => {
      if (!cancelled) setRecords(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, isReviewer]);

  if (status === 'loading' || (status === 'authenticated' && isReviewer && records === undefined)) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </div>
    );
  }

  if (!isReviewer) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Education record certificates</h1>
        <p className="text-ink-secondary">Your account doesn&apos;t have reviewer access.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Education record certificates</h1>
        <p className="text-ink-secondary">
          SSC, HSC, and University certificates tutors uploaded in their Academic background step.
        </p>
      </div>

      {records && records.length === 0 ? (
        <EmptyState title="Nothing to review" description="No certificates are waiting right now." />
      ) : (
        <div className="flex flex-col gap-4">
          {records?.map((record) => (
            <QueueCard
              key={record.id}
              record={record}
              onDecided={(id) => setRecords((rows) => rows?.filter((r) => r.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
