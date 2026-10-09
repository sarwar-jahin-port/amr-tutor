'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from './auth-context';

/** Role-aware navigation: shows different links depending on auth status. */
export function AuthNav() {
  const { status, user, logout } = useAuth();

  if (status === 'loading') {
    return <span className="text-sm text-ink-secondary">Loading…</span>;
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <nav className="flex items-center gap-3 text-sm font-medium">
        <Link href="/login" className="text-ink hover:text-primary">
          Sign in
        </Link>
        <Button asChild size="sm">
          <Link href="/register">Create account</Link>
        </Button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm font-medium">
      <span className="hidden text-ink-secondary sm:inline">
        {user.email} ({user.roles.join(', ')})
      </span>
      <Link href="/messages" className="text-ink hover:text-primary">
        Messages
      </Link>
      <Link href="/dashboard" className="text-ink hover:text-primary">
        Dashboard
      </Link>
      <Button variant="secondary" size="sm" onClick={() => void logout()}>
        Log out
      </Button>
    </nav>
  );
}
