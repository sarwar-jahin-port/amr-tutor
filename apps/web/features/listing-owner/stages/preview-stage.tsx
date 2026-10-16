import { BookOpen, CalendarDays, MapPin, MonitorPlay, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMinutes, formatSalaryRange, TEACHING_MODE_LABEL, WEEKDAY_LABEL } from '@/features/marketplace/format';
import type { ListingDetail } from '@/features/listing-owner/types';

/** Shown exactly as the public listing will appear (ui-ux.md §13 step 6). */
export function PreviewStage({ listing, onContinue }: { listing: ListingDetail; onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-border p-5">
          <h3 className="text-xl font-semibold text-ink">{listing.title}</h3>
          <p className="flex items-center gap-2 text-lg font-medium text-primary">
            <Wallet className="size-5 shrink-0" aria-hidden="true" />
            {formatSalaryRange(listing.salaryMin, listing.salaryMax, listing.currency)} / month
          </p>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 p-5">
          {/* Subjects & Class */}
          {(listing.subjects.length > 0 || listing.classLevel) && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-ink">Subjects & Class</h4>
              <div className="flex flex-wrap gap-1.5">
                {listing.subjects.map((s) => (
                  <Badge key={s.id} variant="neutral">
                    {s.name}
                  </Badge>
                ))}
                {listing.classLevel && (
                  <Badge variant="neutral">{listing.classLevel}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Preferred universities */}
          {listing.universityPreferences.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-ink">Preferred universities</h4>
              <div className="flex flex-wrap gap-1.5">
                {listing.universityPreferences.map((u) => (
                  <Badge key={u.id} variant="neutral">
                    {u.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Grid of details */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Area */}
            <div className="flex gap-3">
              <MapPin className="size-5 shrink-0 text-ink-secondary" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-semibold text-ink">Area</h4>
                <p className="text-sm text-ink-secondary">
                  {listing.area}, {listing.city}
                  {listing.locationDescription && (
                    <>
                      <br />
                      {listing.locationDescription}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Teaching mode */}
            <div className="flex gap-3">
              <MonitorPlay className="size-5 shrink-0 text-ink-secondary" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-semibold text-ink">Teaching mode</h4>
                <p className="text-sm text-ink-secondary">{TEACHING_MODE_LABEL[listing.teachingMode]}</p>
              </div>
            </div>

            {/* Curriculum */}
            {listing.curriculum && (
              <div className="flex gap-3">
                <BookOpen className="size-5 shrink-0 text-ink-secondary" aria-hidden="true" />
                <div>
                  <h4 className="text-sm font-semibold text-ink">Curriculum</h4>
                  <p className="text-sm text-ink-secondary">{listing.curriculum.name}</p>
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="flex gap-3 sm:col-span-2">
              <CalendarDays className="size-5 shrink-0 text-ink-secondary" aria-hidden="true" />
              <div className="w-full">
                <h4 className="mb-2 text-sm font-semibold text-ink">
                  Schedule ({listing.daysPerWeek} day{listing.daysPerWeek === 1 ? '' : 's'} per week)
                </h4>
                {listing.schedules.length > 0 ? (
                  <div className="grid gap-x-6 gap-y-1 text-sm text-ink-secondary sm:grid-cols-2">
                    {listing.schedules.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between border-b border-border/50 py-1.5 last:border-0 sm:border-0 sm:py-0.5"
                      >
                        <span className="font-medium">{WEEKDAY_LABEL[s.day]}</span>
                        <span>
                          {s.startMinute !== null && s.endMinute !== null
                            ? `${formatMinutes(s.startMinute)} – ${formatMinutes(s.endMinute)}`
                            : 'Any time'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-secondary">Flexible / Negotiable</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mt-2 border-t border-border pt-6">
              <h4 className="mb-2 text-sm font-semibold text-ink">Description</h4>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
                {listing.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <Button onClick={onContinue} className="self-start">
        Continue
      </Button>
    </div>
  );
}
