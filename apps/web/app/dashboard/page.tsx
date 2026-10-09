'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-context';

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
      <Container as="main" narrow className="flex min-h-screen flex-col justify-center gap-4 py-16">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
      </Container>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <Container as="main" className="flex min-h-screen items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </Container>
    );
  }

  return (
    <Container as="main" narrow className="flex min-h-screen flex-col gap-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Dashboard</h1>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="font-medium text-ink-secondary">Email</dt>
          <dd className="text-ink">{user.email}</dd>
          <dt className="font-medium text-ink-secondary">Phone</dt>
          <dd className="text-ink">{user.phone ?? '—'}</dd>
          <dt className="font-medium text-ink-secondary">Roles</dt>
          <dd className="text-ink">{user.roles.join(', ')}</dd>
          <dt className="font-medium text-ink-secondary">Status</dt>
          <dd>
            <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}>{user.status}</Badge>
          </dd>
        </dl>
      </div>
      <p className="text-sm text-ink-secondary">
        Profile setup, listings, and applications arrive in later phases.
      </p>
      <Button variant="secondary" className="self-start" onClick={() => void logout()}>
        Log out
      </Button>
    </Container>
  );
}
