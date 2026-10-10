'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/features/notifications/notification-bell';
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
    <nav className="flex items-center gap-2 text-sm font-medium sm:gap-3">
      <span className="hidden text-ink-secondary lg:inline">
        {user.email} ({user.roles.join(', ')})
      </span>
      <Link href="/messages" className="hidden text-ink hover:text-primary md:inline">
        Messages
      </Link>
      <Link href="/dashboard" className="hidden text-ink hover:text-primary md:inline">
        Dashboard
      </Link>
      <NotificationBell />
      <Button variant="secondary" size="sm" onClick={() => void logout()} className="hidden md:inline-flex">
        Log out
      </Button>
    </nav>
  );
}
