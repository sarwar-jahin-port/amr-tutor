import { ArrowRight, BookOpen, CalendarDays, Coins, Languages, Users } from 'lucide-react';
import Link from 'next/link';
import { CornerLeaf } from '@/components/annotation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Fact } from './fact';
import { formatSalaryRange, GENDER_PREFERENCE_LABEL } from './format';
import type { ListingDetail } from './types';

/** Lively, data-dense opportunity card for the home page highlight rail. Full details (mode, address, exact timing) live on the listing page. */
export function TuitionOpportunityCard({ listing }: { listing: ListingDetail }) {
  return (
    <Link
      href={`/tuition/${listing.id}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-base hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
    >
      <CornerLeaf className="absolute -bottom-2 -left-2 size-24" />

      <div className="relative flex items-center justify-between gap-2">
        <Badge variant="information" className="rounded-full font-mono text-[11px]">
          ID {listing.id.slice(0, 8).toUpperCase()}
        </Badge>
        <span className="rounded-full bg-soft-green px-2.5 py-1 text-xs font-semibold text-primary">
          {listing.classLevel}
        </span>
      </div>

      <div className="relative">
        <h3 className="text-lg font-semibold leading-snug text-ink">{listing.title}</h3>
        <p className="text-sm text-ink-secondary">
          {listing.area}, {listing.city}
        </p>
      </div>

      <dl className="relative flex flex-col gap-3 text-sm">
        <Fact
          icon={BookOpen}
          label="Subjects"
          value={listing.subjects.length > 0 ? listing.subjects.map((s) => s.name).join(', ') : 'All subjects'}
          wrap
        />
        <Fact icon={Languages} label="Medium" value={listing.curriculum?.name ?? 'Not specified'} />
        <Fact
          icon={Users}
          label="Tutor"
          value={
            listing.preferredGender
              ? (GENDER_PREFERENCE_LABEL[listing.preferredGender] ?? listing.preferredGender)
              : 'No preference'
          }
        />
        <Fact
          icon={CalendarDays}
          label="Schedule"
          value={`${listing.daysPerWeek} day${listing.daysPerWeek === 1 ? '' : 's'}/week`}
        />
      </dl>

      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
            <Coins className="size-3.5" aria-hidden="true" />
          </span>
          <p className="whitespace-nowrap text-sm font-bold tabular-nums text-primary sm:text-base">
            {formatSalaryRange(listing.salaryMin, listing.salaryMax, listing.currency)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-fast group-hover:scale-105">
          Apply Now
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function TuitionOpportunityCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 pt-1">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div>
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <dl className="flex flex-col gap-3 mt-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </dl>
      <div className="mt-auto flex items-center justify-between pt-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
    </div>
  );
}
