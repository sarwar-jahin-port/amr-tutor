import { BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { AcademicStatus, TutorSummary } from './types';

const ACADEMIC_STATUS_LABEL: Record<AcademicStatus, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

/** Lively tutor highlight card for the home page rail, fronted by an initials avatar. */
export function TutorSpotlightCard({ tutor }: { tutor: TutorSummary }) {
  return (
    <Link
      href={`/tutors/${tutor.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-base hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
    >
      <div className="flex items-center gap-3">
        <Avatar
          name={tutor.fullName}
          className="size-12 text-base transition-transform duration-base group-hover:scale-105"
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-ink">{tutor.fullName}</p>
            {tutor.isVerified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
          </div>
          <p className="truncate text-sm text-ink-secondary">{tutor.university.name}</p>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {ACADEMIC_STATUS_LABEL[tutor.academicStatus]}
      </p>

      {tutor.subjects.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5">
          {tutor.subjects.map((subject) => (
            <Badge key={subject.id} variant="neutral">
              {subject.name}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}

export function TutorSpotlightCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm h-[160px]">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex min-w-0 flex-col gap-1.5 w-full">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-auto flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}
