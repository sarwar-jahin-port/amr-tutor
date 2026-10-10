import { BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { AcademicStatus, TutorSummary } from './types';

const ACADEMIC_STATUS_LABEL: Record<AcademicStatus, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

/** Compact horizontal counterpart to TutorSpotlightCard for the row-view toggle. */
export function TutorSpotlightRow({ tutor }: { tutor: TutorSummary }) {
  return (
    <Link
      href={`/tutors/${tutor.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-all duration-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated sm:flex-row sm:items-center sm:gap-4"
    >
      <Avatar
        name={tutor.fullName}
        className="size-11 shrink-0 text-sm transition-transform duration-base group-hover:scale-105"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 shrink-0 flex-col sm:w-56">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-ink">{tutor.fullName}</p>
            {tutor.isVerified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
          </div>
          <p className="truncate text-sm text-ink-secondary">
            {tutor.university.name} · {ACADEMIC_STATUS_LABEL[tutor.academicStatus]}
          </p>
        </div>

        {tutor.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tutor.subjects.map((subject) => (
              <Badge key={subject.id} variant="neutral">
                {subject.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
