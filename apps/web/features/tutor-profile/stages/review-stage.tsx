import { CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSalaryRange, WEEKDAY_LABEL, formatMinutes } from '@/features/marketplace/format';
import type { TutorProfile } from '@/features/tutor-profile/types';

const ACADEMIC_STATUS_LABEL: Record<string, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

export function ReviewStage({ profile, onContinue }: { profile: TutorProfile; onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5">
        <p className="text-lg font-semibold text-ink">{profile.fullName}</p>
        <p className="text-sm text-ink-secondary">
          {profile.university.name} · {ACADEMIC_STATUS_LABEL[profile.academicStatus]}
        </p>

        {profile.subjects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.subjects.map((s) => (
              <Badge key={s.id} variant="neutral">
                {s.name}
              </Badge>
            ))}
          </div>
        )}

        {profile.grades.length > 0 && (
          <p className="mt-2 text-sm text-ink-secondary">Teaches: {profile.grades.join(', ')}</p>
        )}

        {profile.introduction && <p className="mt-3 text-sm text-ink-secondary">{profile.introduction}</p>}

        {profile.locations.length > 0 && (
          <p className="mt-3 text-sm text-ink-secondary">
            Areas: {profile.locations.map((l) => `${l.area}, ${l.city}`).join(' · ')}
          </p>
        )}

        {profile.availability.length > 0 && (
          <p className="text-sm text-ink-secondary">
            Available:{' '}
            {profile.availability
              .map((a) => `${WEEKDAY_LABEL[a.day]} ${formatMinutes(a.startMinute)}–${formatMinutes(a.endMinute)}`)
              .join(' · ')}
          </p>
        )}

        <p className="mt-3 font-medium tabular-nums text-ink">
          {formatSalaryRange(profile.preferredFeeMin, profile.preferredFeeMax, profile.feeCurrency)}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-soft-green p-4 text-sm text-ink">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p>
          Your profile is live. Guardians searching for a tutor can already find and view it at{' '}
          <Link href={`/tutors/${profile.id}`} className="font-medium text-primary hover:underline" target="_blank">
            your public profile
          </Link>
          .
        </p>
      </div>

      <Button onClick={onContinue} className="self-start">
        Continue
      </Button>
    </div>
  );
}
