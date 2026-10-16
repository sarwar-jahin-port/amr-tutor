import { CalendarDays, CircleCheck, GraduationCap, MapPin, Wallet } from 'lucide-react';
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

const GRADE_ORDER: Record<string, number> = {
  Play: 1,
  Nursery: 2,
  KG: 3,
  'Class 1': 4,
  'Class 2': 5,
  'Class 3': 6,
  'Class 4': 7,
  'Class 5': 8,
  'Class 6': 9,
  'Class 7': 10,
  'Class 8': 11,
  'Class 9': 12,
  'Class 10': 13,
  'SSC / O Level': 14,
  'Class 11': 15,
  'Class 12': 16,
  'HSC / A Level': 17,
};

export function ReviewStage({ profile, onContinue }: { profile: TutorProfile; onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="border-b border-border p-5">
          <h3 className="text-xl font-semibold text-ink">{profile.fullName}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
            <GraduationCap className="size-4 shrink-0" />
            <span>
              {profile.university.name} &bull; {ACADEMIC_STATUS_LABEL[profile.academicStatus]}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 p-5">
          {/* Bio */}
          {profile.introduction && (
            <div>
              <h4 className="mb-1 text-sm font-semibold text-ink">About</h4>
              <p className="text-sm leading-relaxed text-ink-secondary">{profile.introduction}</p>
            </div>
          )}

          {/* Subjects */}
          {profile.subjects.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-ink">Subjects</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.subjects.map((s) => (
                  <Badge key={s.id} variant="neutral">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Classes */}
          {profile.grades.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-ink">Classes</h4>
              <div className="flex flex-wrap gap-1.5">
                {[...profile.grades]
                  .sort((a, b) => (GRADE_ORDER[a] ?? 99) - (GRADE_ORDER[b] ?? 99))
                  .map((g) => (
                    <Badge key={g} variant="neutral">
                      {g}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Grid of details */}
          <div className="grid gap-6 sm:grid-cols-2">

            {/* Areas */}
            {profile.locations.length > 0 && (
              <div className="flex gap-3">
                <MapPin className="size-5 shrink-0 text-ink-secondary" aria-hidden="true" />
                <div>
                  <h4 className="text-sm font-semibold text-ink">Areas</h4>
                  <ul className="text-sm text-ink-secondary">
                    {profile.locations.map((l, idx) => (
                      <li key={idx}>
                        {l.area}, {l.city}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Availability */}
            {profile.availability.length > 0 && (
              <div className="flex gap-3 sm:col-span-2">
                <CalendarDays className="size-5 shrink-0 text-ink-secondary" aria-hidden="true" />
                <div className="w-full">
                  <h4 className="mb-2 text-sm font-semibold text-ink">Availability</h4>
                  <div className="grid gap-x-6 gap-y-1 text-sm text-ink-secondary sm:grid-cols-2">
                    {profile.availability.map((a, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between border-b border-border/50 py-1.5 last:border-0 sm:border-0 sm:py-0.5"
                      >
                        <span className="font-medium">{WEEKDAY_LABEL[a.day]}</span>
                        <span>
                          {formatMinutes(a.startMinute)} – {formatMinutes(a.endMinute)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expected Rate */}
            <div className="flex items-center gap-3 sm:col-span-2">
              <Wallet className="size-5 shrink-0 text-ink-secondary" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-semibold text-ink">Expected rate</h4>
                <p className="text-sm font-medium text-primary">
                  {formatSalaryRange(profile.preferredFeeMin, profile.preferredFeeMax, profile.feeCurrency)} / month
                </p>
              </div>
            </div>
          </div>
        </div>
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
