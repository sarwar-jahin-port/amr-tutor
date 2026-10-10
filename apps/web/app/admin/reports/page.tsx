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
import { getReportQueue, updateReportStatus } from '@/features/reports/api';
import { REPORT_CATEGORY_LABEL, REPORT_STATUS_BADGE, REPORT_STATUS_LABEL } from '@/features/reports/format';
import type { ReportModerator } from '@/features/reports/types';
import { AuthedApiError } from '@/lib/authed-api';

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

function ReportCard({ report, onUpdated }: { report: ReportModerator; onUpdated: (updated: ReportModerator) => void }) {
  const [resolution, setResolution] = useState('');
  const [pending, setPending] = useState<'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED' | null>(null);

  async function handleUpdate(targetStatus: 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED') {
    if (targetStatus !== 'UNDER_REVIEW' && !resolution.trim()) {
      toast({ title: 'A resolution note is required', variant: 'danger' });
      return;
    }
    setPending(targetStatus);
    try {
      const updated = await updateReportStatus(report.id, targetStatus, resolution.trim() || undefined);
      onUpdated(updated);
      toast({ title: 'Report updated', variant: 'success' });
    } catch (error) {
      toast({ title: "Couldn't update report", description: errorMessage(error), variant: 'danger' });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold text-ink">{REPORT_CATEGORY_LABEL[report.category]}</p>
          <p className="text-sm text-ink-secondary">
            Target: {report.target.type} ({report.target.id.slice(0, 8)}…) · Reported by {report.reporter.email ?? report.reporter.id}
          </p>
        </div>
        <Badge variant={REPORT_STATUS_BADGE[report.status]}>{REPORT_STATUS_LABEL[report.status]}</Badge>
      </div>

      {report.description && <p className="whitespace-pre-line text-sm text-ink-secondary">{report.description}</p>}

      {report.status !== 'ACTION_TAKEN' && report.status !== 'DISMISSED' && (
        <>
          <Textarea
            placeholder="Resolution note (required to take action or dismiss)"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            maxLength={2000}
          />
          <div className="flex flex-wrap gap-2">
            {report.status === 'OPEN' && (
              <Button
                variant="secondary"
                size="sm"
                isLoading={pending === 'UNDER_REVIEW'}
                disabled={pending !== null}
                onClick={() => void handleUpdate('UNDER_REVIEW')}
              >
                Start review
              </Button>
            )}
            {report.status === 'UNDER_REVIEW' && (
              <>
                <Button size="sm" isLoading={pending === 'ACTION_TAKEN'} disabled={pending !== null} onClick={() => void handleUpdate('ACTION_TAKEN')}>
                  Take action
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  isLoading={pending === 'DISMISSED'}
                  disabled={pending !== null}
                  onClick={() => void handleUpdate('DISMISSED')}
                >
                  Dismiss
                </Button>
              </>
            )}
          </div>
        </>
      )}

      {report.resolution && <p className="text-sm text-ink-secondary">Resolution: {report.resolution}</p>}
    </div>
  );
}

export default function AdminReportsPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportModerator[] | undefined>(undefined);

  const isModerator = Boolean(user?.roles.includes('MODERATOR') || user?.roles.includes('ADMIN'));

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !isModerator) return;
    let cancelled = false;
    getReportQueue().then((rows) => {
      if (!cancelled) setReports(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, isModerator]);

  if (status === 'loading' || (status === 'authenticated' && isModerator && reports === undefined)) {
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

  if (!isModerator) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Reports</h1>
          <p className="text-ink-secondary">Your account doesn&apos;t have moderator access.</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Reports</h1>

        {reports && reports.length === 0 ? (
          <EmptyState title="No reports" description="Nothing has been reported yet." />
        ) : (
          <div className="flex flex-col gap-4">
            {reports?.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onUpdated={(updated) => setReports((rows) => rows?.map((r) => (r.id === updated.id ? updated : r)))}
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
