import Link from 'next/link';
import { formatSalaryRange } from './format';
import type { ListingSummary } from './types';

/** Result card per ui-ux.md §9 "Listing result design": keep fields comparable at a glance. */
export function ListingResultCard({ listing }: { listing: ListingSummary }) {
  return (
    <Link
      href={`/tuition/${listing.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 transition-colors duration-fast hover:border-primary"
    >
      <p className="text-lg font-semibold text-ink">{listing.title}</p>
      <p className="text-sm text-ink-secondary">
        {listing.area} · {listing.daysPerWeek} day{listing.daysPerWeek === 1 ? '' : 's'} per week
      </p>
      {listing.subjects.length > 0 && (
        <p className="text-sm text-ink-secondary">
          {listing.subjects.map((s) => s.name).join(', ')} · {listing.classLevel}
        </p>
      )}
      <p className="font-medium tabular-nums text-ink">
        {formatSalaryRange(listing.salaryMin, listing.salaryMax, listing.currency)}
      </p>
    </Link>
  );
}
