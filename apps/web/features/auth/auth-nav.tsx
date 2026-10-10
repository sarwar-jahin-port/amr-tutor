'use client';

import { LayoutDashboard, LogOut, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      <nav className="hidden md:flex items-center gap-3 text-sm font-medium">
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
      {/* Mobile Messages Icon */}
      <Link
        href="/messages"
        className="flex size-9 items-center justify-center rounded-lg text-ink-secondary transition-colors duration-fast hover:bg-soft-green hover:text-ink md:hidden"
        aria-label="Messages"
      >
        <MessageSquare className="size-5" aria-hidden="true" />
      </Link>

      <NotificationBell />

      {/* Desktop Avatar & Dropdown */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <Avatar name={user.email || 'User'} className="size-9 transition-opacity hover:opacity-80" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1.5">
                <p className="truncate text-sm font-medium">{user.email}</p>
                <p className="truncate text-xs text-ink-secondary">{user.roles.join(', ')}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="w-full">
                <LayoutDashboard className="size-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/messages" className="w-full">
                <MessageSquare className="size-4" />
                <span>Messages</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => void logout()}>
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
