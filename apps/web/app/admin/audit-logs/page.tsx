'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-context';
import { getAuditLogs } from '@/features/admin/audit-api';
import type { AuditLogEntry } from '@/features/admin/types';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminAuditLogsPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[] | undefined>(undefined);

  const isAdmin = Boolean(user?.roles.includes('ADMIN'));

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    let cancelled = false;
    getAuditLogs().then((rows) => {
      if (!cancelled) setLogs(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, isAdmin]);

  if (status === 'loading' || (status === 'authenticated' && isAdmin && logs === undefined)) {
    return (
      <>
        
        <div className="flex flex-col gap-4 max-w-5xl mx-auto py-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
      </>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <>
        
        <div className="flex flex-col gap-4 max-w-5xl mx-auto py-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Audit logs</h1>
          <p className="text-ink-secondary">Your account doesn&apos;t have admin access.</p>
        </div>
      </>
    );
  }

  return (
    <>
      
      <div className="flex flex-col gap-6 max-w-5xl mx-auto py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Audit logs</h1>

        {logs && logs.length === 0 ? (
          <EmptyState title="No activity yet" description="Administrative actions will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {logs?.map((log) => (
              <div key={log.id} className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-ink">{log.action}</span>
                  <Badge variant="neutral">{log.outcome}</Badge>
                </div>
                <p className="text-ink-secondary">
                  {log.targetType}
                  {log.targetId ? ` (${log.targetId.slice(0, 8)}…)` : ''} · by {log.actor?.email ?? 'system'} ·{' '}
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
