import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { QueueStats } from '../types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_REVIEW: 'In review',
  NEEDS_INFORMATION: 'Needs information',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  OPEN: 'Open',
  UNDER_REVIEW: 'Under review',
  ACTION_TAKEN: 'Action taken',
  DISMISSED: 'Dismissed',
};

/** Trust & safety queue summary — open count + age up front, full status breakdown below. */
export function QueueCard({
  icon: Icon,
  title,
  href,
  stats,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  stats: QueueStats;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors duration-fast hover:border-primary"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-ink">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          {title}
        </h3>
        {stats.openCount > 0 ? (
          <Badge variant={stats.openCount > 5 ? 'danger' : 'warning'}>{stats.openCount} open</Badge>
        ) : (
          <Badge variant="success">All clear</Badge>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-ink">{stats.openCount}</span>
        <span className="text-xs text-ink-secondary">
          awaiting action{stats.avgOpenAgeDays !== null ? ` · avg. ${stats.avgOpenAgeDays}d old` : ''}
        </span>
      </div>

      <dl className="flex flex-col gap-1.5 text-xs">
        {Object.entries(stats.counts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between">
            <dt className="text-ink-secondary">{STATUS_LABELS[status] ?? status}</dt>
            <dd className="font-medium tabular-nums text-ink">{count}</dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}
