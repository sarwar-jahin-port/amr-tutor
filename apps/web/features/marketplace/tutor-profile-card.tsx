import { ArrowRight, BadgeCheck, Building2, CalendarDays, Coins, GraduationCap, MapPin } from 'lucide-react';
import Link from 'next/link';
import { CornerLeaf } from '@/components/annotation';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Fact } from './fact';
import { abbreviateUniversity, formatSalaryRange, sortGrades } from './format';
import type { AcademicStatus, TutorProfile } from './types';

const ACADEMIC_STATUS_LABEL: Record<AcademicStatus, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

/** A long grade list ("Play, Nursery, KG, Class 1, …") would blow out the card, so collapse it to a range. */
function formatGrades(grades: string[]): string {
  if (grades.length === 0) return 'Not specified';
  const sorted = sortGrades(grades);
  if (sorted.length <= 3) return sorted.join(', ');
  return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
}

/** Rich tutor card for the /tutors listing — full profile data, one card per tutor. */
export function TutorProfileCard({ tutor }: { tutor: TutorProfile }) {
  const daysPerWeek = new Set(tutor.availability.map((slot) => slot.day)).size;
  const primaryLocation = tutor.locations[0];

  return (
    <Link
      href={`/tutors/${tutor.id}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-base hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
    >
      <CornerLeaf className="absolute -bottom-2 -left-2 size-24" />

      <div className="relative flex items-start gap-3">
        <Avatar
          name={tutor.fullName}
          className="size-12 shrink-0 text-base transition-transform duration-base group-hover:scale-105"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-ink">{tutor.fullName}</p>
            {tutor.isVerified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
          </div>
          <p
            className="flex items-center gap-1.5 truncate text-sm text-ink-secondary"
            title={tutor.university.name}
          >
            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
            {abbreviateUniversity(tutor.university.name)}
          </p>
          <span className="w-fit rounded-full bg-soft-green px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
            {ACADEMIC_STATUS_LABEL[tutor.academicStatus]}
          </span>
        </div>
      </div>

      <dl className="relative flex flex-col gap-3 text-sm">
        <Fact icon={GraduationCap} label="Classes" value={formatGrades(tutor.grades)} />
        <Fact
          icon={CalendarDays}
          label="Schedule"
          value={daysPerWeek > 0 ? `${daysPerWeek} day${daysPerWeek === 1 ? '' : 's'}/week` : 'Not specified'}
        />
        <Fact
          icon={MapPin}
          label="Address"
          value={primaryLocation ? `${primaryLocation.area}, ${primaryLocation.city}` : 'Not specified'}
        />
      </dl>

      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
            <Coins className="size-3.5" aria-hidden="true" />
          </span>
          <p className="whitespace-nowrap text-sm font-bold tabular-nums text-primary sm:text-base">
            {formatSalaryRange(tutor.preferredFeeMin, tutor.preferredFeeMax, tutor.feeCurrency)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-fast group-hover:scale-105">
          View profile
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function TutorProfileCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-col gap-1.5 w-full">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <dl className="flex flex-col gap-3 mt-2">
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
