import { BadgeCheck, Clock, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';
import { getTutor } from '@/features/marketplace/api';
import { formatMinutes, formatSalaryRange, WEEKDAY_LABEL } from '@/features/marketplace/format';
import type { AcademicStatus } from '@/features/marketplace/types';
import { ReportDialog } from '@/features/reports/report-dialog';

const ACADEMIC_STATUS_LABEL: Record<AcademicStatus, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

interface TutorProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TutorProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getTutor(id);
  if (result.status !== 'ok') return { title: 'Tutor profile — AMR Tutor' };
  return { title: `${result.data.fullName} — AMR Tutor` };
}

export default async function TutorProfilePage({ params }: TutorProfilePageProps) {
  const { id } = await params;
  const result = await getTutor(id);

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
            {/* 1-2: name, university, academic status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-ink">{result.data.fullName}</h1>
                {result.data.isVerified && (
                  <Badge variant="success" className="gap-1">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-ink-secondary">
                {result.data.university.name} · {ACADEMIC_STATUS_LABEL[result.data.academicStatus]}
                {result.data.academicYear ? ` · ${result.data.academicYear}` : ''}
              </p>
              <p className="text-sm text-ink-secondary">
                {result.data.department} · {result.data.degreeProgram}
              </p>
            </div>

            {/* 3: subjects and classes */}
            {(result.data.subjects.length > 0 || result.data.grades.length > 0) && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-ink">Subjects and classes</h2>
                <div className="flex flex-wrap gap-1.5">
                  {result.data.subjects.map((subject) => (
                    <Badge key={subject.id} variant="neutral">
                      {subject.name}
                    </Badge>
                  ))}
                </div>
                {result.data.grades.length > 0 && (
                  <p className="text-sm text-ink-secondary">Teaches: {result.data.grades.join(', ')}</p>
                )}
                {result.data.curricula.length > 0 && (
                  <p className="text-sm text-ink-secondary">
                    Curricula: {result.data.curricula.map((c) => c.name).join(', ')}
                  </p>
                )}
              </section>
            )}

            {/* 4: introduction / teaching approach */}
            {result.data.introduction && (
              <section className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-ink">About</h2>
                <p className="whitespace-pre-line text-ink-secondary">{result.data.introduction}</p>
              </section>
            )}

            {/* 5: availability and preferred areas */}
            {(result.data.locations.length > 0 || result.data.availability.length > 0) && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-ink">Availability and areas</h2>
                {result.data.locations.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-ink-secondary">
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      {result.data.locations.map((l) => `${l.area}, ${l.city}`).join(' · ')}
                    </span>
                  </div>
                )}
                {result.data.availability.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-ink-secondary">
                    <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      {result.data.availability
                        .map(
                          (a) =>
                            `${WEEKDAY_LABEL[a.day]} ${formatMinutes(a.startMinute)}–${formatMinutes(a.endMinute)}`,
                        )
                        .join(' · ')}
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* 6: expected tuition range */}
            <section className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-ink">Expected tuition</h2>
              <p className="font-medium tabular-nums text-ink">
                {formatSalaryRange(result.data.preferredFeeMin, result.data.preferredFeeMax, result.data.feeCurrency)}
              </p>
            </section>

            {/* 7: verification explanation */}
            <Alert variant="information" title="About verification">
              {result.data.isVerified
                ? 'This tutor has verified their university affiliation with the platform. Verification does not prove teaching ability, reliability, or suitability for a particular child — use your own judgment when deciding who to work with.'
                : "This tutor hasn't completed verification yet. Verification is optional and checks university affiliation only — use your own judgment when deciding who to work with regardless of verification status."}
            </Alert>

            {/* 8: next action */}
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/tuition">View tuition opportunities</Link>
              </Button>
              <ReportDialog target={{ tutorProfileId: id }} label="Report this tutor" />
            </div>
          </>
        )}
      </Container>
    </>
  );
}
