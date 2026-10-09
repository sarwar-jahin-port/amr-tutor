import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';
import { ApplySection } from '@/features/applications/apply-section';
import { getListing } from '@/features/marketplace/api';
import { formatMinutes, formatSalaryRange, TEACHING_MODE_LABEL, WEEKDAY_LABEL } from '@/features/marketplace/format';

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
      <Container as="main" narrow className="flex flex-col gap-8 py-10">
        {result.status === 'error' && (
          <Alert variant="danger" title="We couldn't load this page">
            Your internet connection may be interrupted. Try again.
          </Alert>
        )}

        {result.status === 'ok' && (
          <>
            {/* First: essential facts */}
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-ink">{result.data.title}</h1>

              {result.data.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.data.subjects.map((subject) => (
                    <Badge key={subject.id} variant="neutral">
                      {subject.name}
                    </Badge>
                  ))}
                  <Badge variant="neutral">{result.data.classLevel}</Badge>
                </div>
              )}

              <p className="text-2xl font-semibold tabular-nums text-ink">
                {formatSalaryRange(result.data.salaryMin, result.data.salaryMax, result.data.currency)}
              </p>

              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm text-ink-secondary">
                <dt className="flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" /> Area
                </dt>
                <dd>
                  {result.data.area}, {result.data.city}
                  {result.data.locationDescription ? ` — ${result.data.locationDescription}` : ''}
                </dd>

                <dt className="flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden="true" /> Schedule
                </dt>
                <dd>
                  {result.data.daysPerWeek} day{result.data.daysPerWeek === 1 ? '' : 's'} per week
                  {result.data.schedules.length > 0 && (
                    <>
                      {' · '}
                      {result.data.schedules
                        .map((s) =>
                          s.startMinute !== null && s.endMinute !== null
                            ? `${WEEKDAY_LABEL[s.day]} ${formatMinutes(s.startMinute)}–${formatMinutes(s.endMinute)}`
                            : WEEKDAY_LABEL[s.day],
                        )
                        .join(', ')}
                    </>
                  )}
                </dd>

                <dt className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden="true" /> Teaching mode
                </dt>
                <dd>{TEACHING_MODE_LABEL[result.data.teachingMode]}</dd>

                {result.data.preferredGender && (
                  <>
                    <dt className="flex items-center gap-1.5">
                      <Users className="size-4" aria-hidden="true" /> Tutor preference
                    </dt>
                    <dd>{result.data.preferredGender}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Second: expectations */}
            {(result.data.description || result.data.curriculum || result.data.universityPreferences.length > 0) && (
              <section className="flex flex-col gap-4 border-t border-border pt-6">
                {result.data.description && (
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-ink">What the tutor should help with</h2>
                    <p className="whitespace-pre-line text-ink-secondary">{result.data.description}</p>
                  </div>
                )}
                {result.data.curriculum && (
                  <p className="text-sm text-ink-secondary">
                    Curriculum: <span className="text-ink">{result.data.curriculum.name}</span>
                  </p>
                )}
                {result.data.universityPreferences.length > 0 && (
                  <p className="text-sm text-ink-secondary">
                    Preferred university:{' '}
                    <span className="text-ink">
                      {result.data.universityPreferences.map((u) => u.name).join(', ')}
                    </span>{' '}
                    — a preference, not a strict requirement.
                  </p>
                )}
              </section>
            )}

            {/* Third: next action */}
            <section className="flex flex-col gap-3 border-t border-border pt-6">
              <ApplySection listingId={result.data.id} listingStatus={result.data.status} />
            </section>
          </>
        )}
      </Container>
    </>
  );
}
