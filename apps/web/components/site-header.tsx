'use client';

import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
          <AuthNav />
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-lg text-ink-secondary transition-colors duration-fast hover:bg-soft-green hover:text-ink md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle>Menu</SheetTitle>
              <nav className="mt-4 flex flex-col gap-4 text-sm font-medium text-ink">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link href={link.href} className="hover:text-primary">
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {isAuthenticated && (
                  <>
                    <div className="border-t border-border pt-4" />
                    <SheetClose asChild>
                      <Link href="/messages" className="hover:text-primary">
                        Messages
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/dashboard" className="hover:text-primary">
                        Dashboard
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <button type="button" className="text-left hover:text-primary" onClick={() => void logout()}>
                        Log out
                      </button>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
