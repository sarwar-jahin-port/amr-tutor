import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatSalaryRange, GENDER_PREFERENCE_LABEL, TEACHING_MODE_LABEL } from './format';
import type { ListingDetail } from './types';

/** Compact horizontal counterpart to TuitionOpportunityCard for the row-view toggle. */
export function TuitionOpportunityRow({ listing }: { listing: ListingDetail }) {
  const tutorPreference = listing.preferredGender
    ? (GENDER_PREFERENCE_LABEL[listing.preferredGender] ?? listing.preferredGender)
    : 'No preference';
  const mode = TEACHING_MODE_LABEL[listing.teachingMode] ?? listing.teachingMode;

  return (
    <Link
      href={`/tuition/${listing.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-all duration-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="information" className="rounded-full font-mono text-[10px]">
            ID {listing.id.slice(0, 8).toUpperCase()}
          </Badge>
          <span className="rounded-full bg-soft-green px-2 py-0.5 text-[11px] font-semibold text-primary">
            {listing.classLevel}
          </span>
        </div>
        <p className="truncate font-semibold text-ink">{listing.title}</p>
        <p className="truncate text-sm text-ink-secondary">
          {listing.area}, {listing.city}
          {' · '}
          {listing.subjects.length > 0 ? listing.subjects.map((s) => s.name).join(', ') : 'All subjects'}
        </p>
        <p className="truncate text-xs text-ink-secondary">
          {listing.curriculum?.name ?? 'Medium not specified'} · {mode} · {tutorPreference} ·{' '}
          {listing.daysPerWeek} day{listing.daysPerWeek === 1 ? '' : 's'}/week
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border pt-3 sm:flex-col sm:items-end sm:gap-2 sm:border-t-0 sm:pt-0">
        <p className="text-base font-bold tabular-nums text-primary">
          {formatSalaryRange(listing.salaryMin, listing.salaryMax, listing.currency)}
        </p>
        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-fast group-hover:scale-105">
          Apply Now
        </span>
      </div>
    </Link>
  );
}
