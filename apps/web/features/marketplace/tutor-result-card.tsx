import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { AcademicStatus, TutorSummary } from './types';

const ACADEMIC_STATUS_LABEL: Record<AcademicStatus, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

/** Result card prioritizing university/status, subjects, and grades (ui-ux.md §9). */
export function TutorResultCard({ tutor }: { tutor: TutorSummary }) {
  return (
    <Link
      href={`/tutors/${tutor.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-colors duration-fast hover:border-primary"
    >
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-ink">{tutor.fullName}</p>
        <p className="text-sm text-ink-secondary">
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

      {tutor.grades.length > 0 && (
        <p className="text-sm text-ink-secondary">Teaches: {tutor.grades.join(', ')}</p>
      )}
    </Link>
  );
}
