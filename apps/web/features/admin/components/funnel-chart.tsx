import type { FunnelStats } from '../types';

const STAGES: { key: keyof FunnelStats; label: string; color: string }[] = [
  { key: 'listingsCreated', label: 'Listings posted', color: '#86b6ef' },
  { key: 'applicationsSubmitted', label: 'Applications submitted', color: '#5598e7' },
  { key: 'applicationsAccepted', label: 'Applications accepted', color: '#2a78d6' },
  { key: 'contactsShared', label: 'Contacts shared', color: '#1c5cab' },
];

/** Marketplace funnel — one ordinal measure (match progress) stepped light-to-dark. */
export function FunnelChart({ funnel }: { funnel: FunnelStats }) {
  const max = Math.max(1, ...STAGES.map((s) => funnel[s.key]));

  return (
    <div className="flex flex-col gap-3">
      {STAGES.map((stage) => {
        const value = funnel[stage.key];
        const widthPct = Math.max(2, (value / max) * 100);
        return (
          <div key={stage.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-xs text-ink-secondary">
              <span>{stage.label}</span>
              <span className="font-semibold tabular-nums text-ink">{value.toLocaleString()}</span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full transition-all duration-base"
                style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
