import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';

interface KpiTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  deltaPct?: number | null;
  deltaLabel?: string;
}

/** KPI tile with an optional signed delta badge vs. the previous period. */
export function KpiTile({ icon: Icon, label, value, deltaPct, deltaLabel }: KpiTileProps) {
  const hasDelta = deltaPct !== undefined && deltaPct !== null;
  const isUp = hasDelta && deltaPct > 0;
  const isFlat = hasDelta && deltaPct === 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-green text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {hasDelta && (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums',
              isFlat ? 'bg-canvas text-ink-secondary' : isUp ? 'bg-soft-green text-primary' : 'bg-danger-surface text-danger',
            )}
          >
            {!isFlat && (isUp ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" />)}
            {Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold tabular-nums text-ink">{value}</span>
        <span className="text-xs text-ink-secondary">{label}</span>
        {hasDelta && deltaLabel && <span className="mt-0.5 text-[11px] text-ink-secondary">{deltaLabel}</span>}
      </div>
    </div>
  );
}
