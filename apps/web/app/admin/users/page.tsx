'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { searchUsers, updateUserStatus } from '@/features/admin/users-api';
import type { AdminUser } from '@/features/admin/types';
import { AuthedApiError } from '@/lib/authed-api';

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

const STATUS_BADGE: Record<string, 'neutral' | 'success' | 'danger'> = {
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  PENDING_DELETION: 'neutral',
  DELETED: 'neutral',
};

function UserRow({ user, onUpdated }: { user: AdminUser; onUpdated: (updated: AdminUser) => void }) {
  const [reason, setReason] = useState('');
  const [showReasonFor, setShowReasonFor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSuspend() {
    if (!reason.trim()) {
      toast({ title: 'A reason is required', variant: 'danger' });
      return;
    }
    setIsSaving(true);
    try {
      onUpdated(await updateUserStatus(user.id, 'SUSPENDED', reason.trim()));
      setShowReasonFor(false);
      setReason('');
    } catch (error) {
      toast({ title: "Couldn't suspend account", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReactivate() {
    setIsSaving(true);
    try {
      onUpdated(await updateUserStatus(user.id, 'ACTIVE'));
    } catch (error) {
      toast({ title: "Couldn't reactivate account", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-ink">{user.email ?? user.phone ?? user.id}</p>
          <p className="text-sm text-ink-secondary">{user.roles.join(', ') || 'No roles'}</p>
        </div>
        <Badge variant={STATUS_BADGE[user.status] ?? 'neutral'}>{user.status}</Badge>
      </div>

      {user.status === 'ACTIVE' && !showReasonFor && (
        <Button variant="tertiary" size="sm" className="self-start" onClick={() => setShowReasonFor(true)}>
          Suspend
        </Button>
      )}

      {showReasonFor && (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Reason for suspension (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
          />
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" isLoading={isSaving} onClick={() => void handleSuspend()}>
              Confirm suspension
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => setShowReasonFor(false)} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {user.status === 'SUSPENDED' && (
        <Button variant="secondary" size="sm" className="self-start" isLoading={isSaving} onClick={() => void handleReactivate()}>
          Reactivate
        </Button>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | undefined>(undefined);
  const [search, setSearch] = useState('');

  const isAdmin = Boolean(user?.roles.includes('ADMIN'));

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    let cancelled = false;
    searchUsers().then((rows) => {
      if (!cancelled) setUsers(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, isAdmin]);

  async function handleSearch() {
    const rows = await searchUsers(search.trim() || undefined);
    setUsers(rows);
  }

  if (status === 'loading' || (status === 'authenticated' && isAdmin && users === undefined)) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-20 w-full" />
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
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Users</h1>
          <p className="text-ink-secondary">Your account doesn&apos;t have admin access.</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Users</h1>

        <Field className="flex-row gap-2">
          <Input
            placeholder="Search by email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
          />
          <Button onClick={() => void handleSearch()}>Search</Button>
        </Field>

        <div className="flex flex-col gap-3">
          {users?.map((row) => (
            <UserRow
              key={row.id}
              user={row}
              onUpdated={(updated) => setUsers((rows) => rows?.map((u) => (u.id === updated.id ? updated : u)))}
            />
          ))}
        </div>
      </Container>
    </>
  );
}
