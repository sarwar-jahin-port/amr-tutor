'use client';

import { HelpCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { AuthNav } from '@/features/auth/auth-nav';
import { useAuth } from '@/features/auth/auth-context';

const NAV_LINKS = [
  { href: '/tuition', label: 'Find tuition' },
  { href: '/tutors', label: 'Find tutors' },
  { href: '/how-it-works', label: 'How it works' },
];

/** Public navigation shared across marketing/browsing pages (ui-ux.md §7). */
export function SiteHeader() {
  const { status, user, logout } = useAuth();
  const isAuthenticated = status === 'authenticated' && !!user;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-ink">
          <Image src="/images/logo.png" alt="" width={32} height={32} priority className="size-8" />
          AMR Tutor
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/how-it-works"
            className="flex size-9 items-center justify-center rounded-lg text-ink-secondary transition-colors duration-fast hover:bg-soft-green hover:text-ink md:hidden"
            aria-label="How it works"
          >
            <HelpCircle className="size-5" aria-hidden="true" />
          </Link>
          <AuthNav />
        </div>
      </Container>
    </header>
  );
}
