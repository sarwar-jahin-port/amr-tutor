'use client';

import {
  FileWarning,
  Flag,
  IdCard,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { FunnelChart } from '@/features/admin/components/funnel-chart';
import { KpiTile } from '@/features/admin/components/kpi-tile';
import { QueueCard } from '@/features/admin/components/queue-card';
import { SignupTrendChart } from '@/features/admin/components/signup-trend-chart';
import { SupplyDemandChart } from '@/features/admin/components/supply-demand-chart';
import { getAdminStats } from '@/features/admin/stats-api';
import type { AdminStats } from '@/features/admin/types';
import { useAuth } from '@/features/auth/auth-context';
import type { Role } from '@/features/auth/types';
import { cn } from '@/lib/cn';

const PERIOD_OPTIONS = [7, 30, 90] as const;

const SECTIONS: { href: string; label: string; icon: typeof Users; roles: Role[] }[] = [
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { href: '/admin/listings', label: 'Listings', icon: FileWarning, roles: ['ADMIN'] },
  { href: '/admin/reports', label: 'Reports', icon: Flag, roles: ['MODERATOR', 'ADMIN'] },
  { href: '/admin/verifications', label: 'Tutor verifications', icon: ShieldCheck, roles: ['VERIFIER', 'ADMIN'] },
  { href: '/admin/guardian-verifications', label: 'Guardian verifications', icon: IdCard, roles: ['VERIFIER', 'ADMIN'] },
  { href: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText, roles: ['ADMIN'] },
];

export default function AdminHubPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [days, setDays] = useState<(typeof PERIOD_OPTIONS)[number]>(30);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    getAdminStats(days)
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard stats.');
      });
    return () => {
      cancelled = true;
    };
  }, [status, days]);

  if (status === 'loading' || (status === 'authenticated' && !stats && !error)) {
    return (
      <div className="flex flex-col gap-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </div>
    );
  }

  const sections = SECTIONS.filter((section) => section.roles.some((role) => user.roles.includes(role)));

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-ink">
          <LayoutDashboard className="size-7" aria-hidden="true" />
          Dashboard
        </h1>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-fast',
                days === option ? 'bg-soft-green text-primary' : 'text-ink-secondary hover:text-ink',
              )}
            >
              {option}d
            </button>
          ))}
        </div>
      </header>

      {error && <Alert variant="danger">{error}</Alert>}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              icon={Users}
              label="Total users"
              value={stats.growth.totalUsers.toLocaleString()}
            />
            <KpiTile
              icon={TrendingUp}
              label={`New signups (${stats.periodDays}d)`}
              value={stats.growth.newUsersThisPeriod.toLocaleString()}
              deltaPct={stats.growth.newUsersChangePct}
              deltaLabel={`vs. ${stats.growth.newUsersPrevPeriod} previous period`}
            />
            <StatTile icon={FileWarning} label="Active listings" value={stats.growth.activeListings} />
            <StatTile icon={UserCheck} label="Available tutors" value={stats.growth.availableTutors} />
          </div>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Signups over time</h2>
            <SignupTrendChart data={stats.growth.signupTrend} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-base font-semibold text-ink">Marketplace funnel</h2>
              <FunnelChart funnel={stats.funnel} />
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-ink">Trust &amp; safety</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <QueueCard icon={ShieldCheck} title="Tutor verifications" href="/admin/verifications" stats={stats.trustSafety.verifications} />
                <QueueCard
                  icon={IdCard}
                  title="Guardian verifications"
                  href="/admin/guardian-verifications"
                  stats={stats.trustSafety.guardianVerifications}
                />
                <QueueCard icon={Flag} title="Reports" href="/admin/reports" stats={stats.trustSafety.reports} />
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Supply vs. demand by subject</h2>
            <SupplyDemandChart rows={stats.supplyDemand} />
          </section>
        </>
      )}

      {sections.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink-secondary">Manage</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-ink transition-colors duration-fast hover:border-primary"
              >
                <section.icon className="size-4 text-primary" aria-hidden="true" />
                {section.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
