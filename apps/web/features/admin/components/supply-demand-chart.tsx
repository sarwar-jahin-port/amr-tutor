import { Badge } from '@/components/ui/badge';
import type { SupplyDemandGap } from '../types';

/** Per-subject demand (open listings) vs. supply (available tutors) — grouped bars, shared scale. */
export function SupplyDemandChart({ rows }: { rows: SupplyDemandGap[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-secondary">No published listings yet — gaps will show up here once guardians start posting.</p>;
  }

  const max = Math.max(1, ...rows.flatMap((r) => [r.demand, r.supply]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-xs text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: '#2a78d6' }} aria-hidden="true" />
          Demand (open listings)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: '#1baf7a' }} aria-hidden="true" />
          Supply (available tutors)
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.subjectId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">{row.subjectName}</span>
              {row.gap > 0 ? (
                <Badge variant="warning">{row.gap} short</Badge>
              ) : (
                <Badge variant="success">Covered</Badge>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="h-3 w-full overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, (row.demand / max) * 100)}%`, backgroundColor: '#2a78d6' }} />
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, (row.supply / max) * 100)}%`, backgroundColor: '#1baf7a' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
