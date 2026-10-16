import { BookOpen, Calendar, GraduationCap, Home, Languages, MapPin, SlidersHorizontal, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';
import { ApplySection } from '@/features/applications/apply-section';
import { Fact } from '@/features/marketplace/fact';
import { getListing } from '@/features/marketplace/api';
import {
  formatMinutes,
  formatSalaryRange,
  GENDER_PREFERENCE_LABEL,
  TEACHING_MODE_LABEL,
  WEEKDAY_LABEL,
  WEEKDAY_ORDER,
} from '@/features/marketplace/format';
import { cn } from '@/lib/cn';
import { ReportDialog } from '@/features/reports/report-dialog';

/** Icon-labeled section wrapper — mirrors the tutor profile page so both read the same way. */
function DetailSection({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getListing(id);
  if (result.status !== 'ok') return { title: 'Tuition opportunity — AMR Tutor' };
  return { title: `${result.data.title} — AMR Tutor` };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const result = await getListing(id);

  if (result.status === 'not-found') {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" className="py-10 lg:py-14">
        {result.status === 'error' && (
          <Alert variant="danger" title="We couldn't load this page">
            Your internet connection may be interrupted. Try again.
          </Alert>
        )}

        {result.status === 'ok' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            {/* Main column */}
            <div className="flex flex-col gap-6">
              {/* Identity header */}
              <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{result.data.title}</h1>
                <p className="flex items-center gap-1.5 text-ink-secondary">
                  <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {result.data.area}, {result.data.city}
                  {result.data.locationDescription ? ` — ${result.data.locationDescription}` : ''}
                </p>
                {(result.data.subjects.length > 0 || result.data.classLevel) && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {result.data.subjects.map((subject) => (
                      <Badge key={subject.id} variant="success">
                        {subject.name}
                      </Badge>
                    ))}
                    <Badge variant="neutral">{result.data.classLevel}</Badge>
                  </div>
                )}
              </header>

              {/* Tuition preferences */}
              <DetailSection title="Tuition preferences" icon={SlidersHorizontal}>
                <dl className="grid grid-cols-1 gap-x-3 gap-y-3 text-sm sm:grid-cols-2">
                  <Fact icon={Languages} label="Medium" value={result.data.curriculum?.name ?? 'Not specified'} />
                  <Fact
                    icon={Home}
                    label="Mode"
                    value={TEACHING_MODE_LABEL[result.data.teachingMode] ?? result.data.teachingMode}
                  />
                  <Fact
                    icon={Users}
                    label="Tutor preference"
                    value={
                      result.data.preferredGender
                        ? (GENDER_PREFERENCE_LABEL[result.data.preferredGender] ?? result.data.preferredGender)
                        : 'No preference'
                    }
                  />
                  <Fact
                    icon={Calendar}
                    label="Frequency"
                    value={`${result.data.daysPerWeek} day${result.data.daysPerWeek === 1 ? '' : 's'}/week`}
                  />
                </dl>
              </DetailSection>

              {/* What the tutor should help with */}
              {result.data.description && (
                <DetailSection title="What the tutor should help with" icon={BookOpen}>
                  <p className="max-w-prose whitespace-pre-line leading-relaxed text-ink-secondary">
                    {result.data.description}
                  </p>
                </DetailSection>
              )}

              {/* Preferred university */}
              {result.data.universityPreferences.length > 0 && (
                <DetailSection title="Preferred university" icon={GraduationCap}>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.universityPreferences.map((u) => (
                      <Badge key={u.id} variant="information">
                        {u.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-ink-secondary">A preference, not a strict requirement.</p>
                </DetailSection>
              )}

              <ReportDialog target={{ listingId: result.data.id }} label="Report this listing" />
            </div>

            {/* Sticky action sidebar */}
            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-ink-secondary">Monthly budget</p>
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {formatSalaryRange(result.data.salaryMin, result.data.salaryMax, result.data.currency)}
                  </p>
                </div>
                <ApplySection listingId={result.data.id} listingStatus={result.data.status} />
              </div>

              {result.data.schedules.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                    <Calendar className="size-4 text-primary" aria-hidden="true" />
                    Weekly schedule
                  </h2>
                  <div className="flex flex-col gap-1.5">
                    {WEEKDAY_ORDER.map((day) => {
                      const slot = result.data.schedules.find((s) => s.day === day);
                      return (
                        <div
                          key={day}
                          className={cn(
                            'flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                            slot ? 'bg-soft-green text-ink' : 'text-ink-secondary/60',
                          )}
                        >
                          <span className="font-medium">{WEEKDAY_LABEL[day]}</span>
                          <span className={slot ? 'tabular-nums text-primary' : ''}>
                            {slot
                              ? slot.startMinute !== null && slot.endMinute !== null
                                ? `${formatMinutes(slot.startMinute)}–${formatMinutes(slot.endMinute)}`
                                : 'Time not set'
                              : 'Not needed'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </Container>
    </>
  );
}
