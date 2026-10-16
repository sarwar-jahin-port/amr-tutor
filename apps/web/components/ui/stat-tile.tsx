import type { LucideIcon } from 'lucide-react';

/** At-a-glance KPI tile for dashboard summaries. */
export function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-green text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col">
        <span className="text-xl font-bold tabular-nums text-ink">{value}</span>
        <span className="text-xs text-ink-secondary">{label}</span>
      </div>
    </div>
  );
}
