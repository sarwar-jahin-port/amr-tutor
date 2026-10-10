import { BookOpen, CalendarDays, Clock, Home, Languages, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Fact } from './fact';
import { formatMinutes, formatSalaryRange, GENDER_PREFERENCE_LABEL, TEACHING_MODE_LABEL, WEEKDAY_LABEL } from './format';
import type { ListingDetail } from './types';

function formatSchedule(schedules: ListingDetail['schedules']): string | null {
  if (schedules.length === 0) return null;
  return schedules
    .slice(0, 2)
    .map((s) => {
      const day = (WEEKDAY_LABEL[s.day] ?? s.day).slice(0, 3);
      return s.startMinute !== null && s.endMinute !== null
        ? `${day} ${formatMinutes(s.startMinute)}–${formatMinutes(s.endMinute)}`
        : day;
    })
    .join(', ');
}

/** Lively, data-dense opportunity card for the home page highlight rail. */
export function TuitionOpportunityCard({ listing }: { listing: ListingDetail }) {
  const schedule = formatSchedule(listing.schedules);

  return (
    <Link
      href={`/tuition/${listing.id}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-base hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
    >
      <span
        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-primary to-warm-accent opacity-80 transition-opacity duration-base group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-2 pt-1">
        <Badge variant="information" className="rounded-full font-mono text-[11px]">
          ID {listing.id.slice(0, 8).toUpperCase()}
        </Badge>
        <span className="rounded-full bg-soft-green px-2.5 py-1 text-xs font-semibold text-primary">
          {listing.classLevel}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold leading-snug text-ink">{listing.title}</h3>
        <p className="text-sm text-ink-secondary">
          {listing.area}, {listing.city}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
        <Fact
          icon={BookOpen}
          label="Subjects"
          value={listing.subjects.length > 0 ? listing.subjects.map((s) => s.name).join(', ') : 'All subjects'}
          className="col-span-2"
        />
        <Fact icon={Languages} label="Medium" value={listing.curriculum?.name ?? 'Not specified'} />
        <Fact
          icon={Home}
          label="Mode"
          value={TEACHING_MODE_LABEL[listing.teachingMode] ?? listing.teachingMode}
        />
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
        {schedule && <Fact icon={Clock} label="Tuition time" value={schedule} className="col-span-2" />}
        <Fact
          icon={MapPin}
          label="Address"
          value={listing.locationDescription ?? `${listing.area}, ${listing.city}`}
          className="col-span-2"
        />
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
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

export function TuitionOpportunityCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm h-[380px]">
      <div className="flex items-center justify-between gap-2 pt-1">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div>
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 mt-2">
        <Skeleton className="h-8 w-full col-span-2" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full col-span-2" />
      </dl>
      <div className="mt-auto flex items-center justify-between pt-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
    </div>
  );
}
