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
