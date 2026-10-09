'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </main>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">Redirecting to log in…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="font-medium text-stone-500">Email</dt>
          <dd>{user.email}</dd>
          <dt className="font-medium text-stone-500">Phone</dt>
          <dd>{user.phone ?? '—'}</dd>
          <dt className="font-medium text-stone-500">Roles</dt>
          <dd>{user.roles.join(', ')}</dd>
          <dt className="font-medium text-stone-500">Status</dt>
          <dd>{user.status}</dd>
        </dl>
      </div>
      <p className="text-sm text-stone-500">
        Profile setup, listings, and applications arrive in later phases.
      </p>
      <button
        type="button"
        onClick={() => void logout()}
        className="self-start rounded-full border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100"
      >
        Log out
      </button>
    </main>
  );
}
