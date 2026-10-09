import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMinutes, formatSalaryRange, TEACHING_MODE_LABEL, WEEKDAY_LABEL } from '@/features/marketplace/format';
import type { ListingDetail } from '@/features/listing-owner/types';

/** Shown exactly as the public listing will appear (ui-ux.md §13 step 6). */
export function PreviewStage({ listing, onContinue }: { listing: ListingDetail; onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-2xl font-semibold text-ink">{listing.title}</h2>

        {listing.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.subjects.map((s) => (
              <Badge key={s.id} variant="neutral">
                {s.name}
              </Badge>
            ))}
            <Badge variant="neutral">{listing.classLevel}</Badge>
          </div>
        )}

        <p className="text-xl font-semibold tabular-nums text-ink">
          {formatSalaryRange(listing.salaryMin, listing.salaryMax, listing.currency)}
        </p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm text-ink-secondary">
          <dt>Area</dt>
          <dd>
            {listing.area}, {listing.city}
            {listing.locationDescription ? ` — ${listing.locationDescription}` : ''}
          </dd>
          <dt>Schedule</dt>
          <dd>
            {listing.daysPerWeek} day{listing.daysPerWeek === 1 ? '' : 's'} per week
            {listing.schedules.length > 0 && (
              <>
                {' · '}
                {listing.schedules
                  .map((s) =>
                    s.startMinute !== null && s.endMinute !== null
                      ? `${WEEKDAY_LABEL[s.day]} ${formatMinutes(s.startMinute)}–${formatMinutes(s.endMinute)}`
                      : WEEKDAY_LABEL[s.day],
                  )
                  .join(', ')}
              </>
            )}
          </dd>
          <dt>Teaching mode</dt>
          <dd>{TEACHING_MODE_LABEL[listing.teachingMode]}</dd>
          {listing.curriculum && (
            <>
              <dt>Curriculum</dt>
              <dd>{listing.curriculum.name}</dd>
            </>
          )}
          {listing.universityPreferences.length > 0 && (
            <>
              <dt>Preferred university</dt>
              <dd>{listing.universityPreferences.map((u) => u.name).join(', ')}</dd>
            </>
          )}
        </dl>

        {listing.description && <p className="whitespace-pre-line text-sm text-ink-secondary">{listing.description}</p>}
      </div>

      <Button onClick={onContinue} className="self-start">
        Continue
      </Button>
    </div>
  );
}
