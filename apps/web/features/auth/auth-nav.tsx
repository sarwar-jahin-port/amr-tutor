'use client';

import Link from 'next/link';
import { useAuth } from './auth-context';

/** Role-aware navigation: shows different links depending on auth status. */
export function AuthNav() {
  const { status, user, logout } = useAuth();

  if (status === 'loading') {
    return <span className="text-sm text-stone-400">Loading…</span>;
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <nav className="flex items-center gap-4 text-sm font-medium">
        <Link href="/login" className="text-stone-700 hover:text-stone-900">
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-emerald-700 px-4 py-1.5 text-white hover:bg-emerald-800"
        >
          Register
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4 text-sm font-medium">
      <span className="text-stone-600">
        {user.email} ({user.roles.join(', ')})
      </span>
      <Link href="/dashboard" className="text-stone-700 hover:text-stone-900">
        Dashboard
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="rounded-full border border-stone-300 px-4 py-1.5 hover:bg-stone-100"
      >
        Log out
      </button>
    </nav>
  );
}
