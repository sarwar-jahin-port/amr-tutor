import { BadgeCheck, BookOpen, Calendar, GraduationCap, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';
import { getTutor } from '@/features/marketplace/api';
import {
  formatMinutes,
  formatSalaryRange,
  sortGrades,
  WEEKDAY_LABEL,
  WEEKDAY_ORDER,
} from '@/features/marketplace/format';
import type { AcademicStatus } from '@/features/marketplace/types';
import { cn } from '@/lib/cn';
import { ReportDialog } from '@/features/reports/report-dialog';

const ACADEMIC_STATUS_LABEL: Record<AcademicStatus, string> = {
  CURRENT_STUDENT: 'Current student',
  GRADUATED: 'Graduated',
  OTHER: 'Other',
};

/** Icon-labeled section wrapper — keeps every block on the profile scannable at a glance. */
function ProfileSection({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: ReactNode }) {
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
              <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar name={result.data.fullName} className="size-16 shrink-0 text-xl sm:size-20 sm:text-2xl" />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                      {result.data.fullName}
                    </h1>
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
                  {result.data.locations.length > 0 && (
                    <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
                      <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      {result.data.locations.map((l) => `${l.area}, ${l.city}`).join(' · ')}
                    </p>
                  )}
                </div>
              </header>

              {/* Subjects, classes, curricula */}
              {(result.data.subjects.length > 0 ||
                result.data.grades.length > 0 ||
                result.data.curricula.length > 0) && (
                <ProfileSection title="Subjects & classes" icon={BookOpen}>
                  <div className="flex flex-col gap-4">
                    {result.data.subjects.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-secondary">Subjects</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.data.subjects.map((subject) => (
                            <Badge key={subject.id} variant="success">
                              {subject.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.data.grades.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-secondary">Classes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {sortGrades(result.data.grades).map((grade) => (
                            <Badge key={grade} variant="neutral">
                              {grade}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.data.curricula.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-secondary">Curricula</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.data.curricula.map((curriculum) => (
                            <Badge key={curriculum.id} variant="information">
                              {curriculum.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ProfileSection>
              )}

              {/* About */}
              {result.data.introduction && (
                <ProfileSection title="About" icon={GraduationCap}>
                  <p className="max-w-prose whitespace-pre-line leading-relaxed text-ink-secondary">
                    {result.data.introduction}
                  </p>
                </ProfileSection>
              )}

              {/* Verification explanation */}
              <Alert variant="information" title="About verification">
                {result.data.isVerified
                  ? 'This tutor has verified their university affiliation with the platform. Verification does not prove teaching ability, reliability, or suitability for a particular child — use your own judgment when deciding who to work with.'
                  : "This tutor hasn't completed verification yet. Verification is optional and checks university affiliation only — use your own judgment when deciding who to work with regardless of verification status."}
              </Alert>

              <ReportDialog target={{ tutorProfileId: id }} label="Report this tutor" />
            </div>

            {/* Sticky action sidebar */}
            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-ink-secondary">Expected tuition</p>
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {formatSalaryRange(result.data.preferredFeeMin, result.data.preferredFeeMax, result.data.feeCurrency)}
                  </p>
                </div>
                <Button asChild size="lg" className="w-full">
                  <Link href="/tuition">View tuition opportunities</Link>
                </Button>
              </div>

              {result.data.availability.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                    <Calendar className="size-4 text-primary" aria-hidden="true" />
                    Weekly availability
                  </h2>
                  <div className="flex flex-col gap-1.5">
                    {WEEKDAY_ORDER.map((day) => {
                      const slot = result.data.availability.find((a) => a.day === day);
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
                            {slot ? `${formatMinutes(slot.startMinute)}–${formatMinutes(slot.endMinute)}` : 'Unavailable'}
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
