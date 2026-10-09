'use client';

import { FileWarning, Flag, Gavel, ScrollText, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import type { Role } from '@/features/auth/types';

const SECTIONS: { href: string; label: string; description: string; icon: typeof Users; roles: Role[] }[] = [
  {
    href: '/admin/users',
    label: 'Users',
    description: 'Search accounts and suspend or reactivate them.',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/listings',
    label: 'Listings',
    description: 'Review, approve, reject, or pause tuition listings.',
    icon: FileWarning,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    description: 'Investigate and resolve user-filed reports.',
    icon: Flag,
    roles: ['MODERATOR', 'ADMIN'],
  },
  {
    href: '/admin/verifications',
    label: 'Verifications',
    description: 'Review student verification requests.',
    icon: ShieldCheck,
    roles: ['VERIFIER', 'ADMIN'],
  },
  {
    href: '/admin/audit-logs',
    label: 'Audit logs',
    description: 'Review sensitive administrative actions.',
    icon: ScrollText,
    roles: ['ADMIN'],
  },
];

export default function AdminHubPage() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
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

  const sections = SECTIONS.filter((section) => section.roles.some((role) => user.roles.includes(role)));

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          <Gavel className="mr-2 inline size-7 align-text-bottom" aria-hidden="true" />
          Moderation
        </h1>

        {sections.length === 0 ? (
          <p className="text-ink-secondary">Your account doesn&apos;t have any moderation access.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 transition-colors duration-fast hover:border-primary"
              >
                <section.icon className="size-5 text-primary" aria-hidden="true" />
                <p className="font-semibold text-ink">{section.label}</p>
                <p className="text-sm text-ink-secondary">{section.description}</p>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
