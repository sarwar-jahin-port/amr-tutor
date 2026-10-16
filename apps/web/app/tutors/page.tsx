import { SlidersHorizontal, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { Alert } from '@/components/ui/alert';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { SiteHeader } from '@/components/site-header';
import {
  getCurricula,
  getGrades,
  getLocations,
  getSubjects,
  getTutor,
  getUniversities,
  searchTutors,
} from '@/features/marketplace/api';
import { ClearFiltersLink } from '@/features/marketplace/clear-filters-link';
import { FilterSheet } from '@/features/marketplace/filter-sheet';
import { SearchPagination } from '@/features/marketplace/search-pagination';
import { TutorFilters } from '@/features/marketplace/tutor-filters';
import { TutorProfileCard } from '@/features/marketplace/tutor-profile-card';
import { TutorSpotlightRow } from '@/features/marketplace/tutor-spotlight-row';
import { TutorsHero } from '@/features/marketplace/tutors-hero';
import type { TutorProfile } from '@/features/marketplace/types';
import { ViewToggle } from '@/features/marketplace/view-toggle';

export const metadata: Metadata = {
  title: 'Find a tutor — AMR Tutor',
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

interface TutorsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TutorsPage({ searchParams }: TutorsPageProps) {
  const params = await searchParams;
  const page = Number(first(params.page)) || 1;

  const [subjects, grades, curricula, universities, divisions, results] = await Promise.all([
    getSubjects(),
    getGrades(),
    getCurricula(),
    getUniversities(),
    getLocations(),
    searchTutors({
      subjectId: first(params.subjectId),
      universityId: first(params.universityId),
      curriculumId: first(params.curriculumId),
      gradeLevel: first(params.gradeLevel),
      city: first(params.city),
      area: first(params.area),
      academicStatus: first(params.academicStatus),
      page,
    }),
  ]);

  const filterProps = { subjects, grades, curricula, universities, divisions };
  const view = first(params.view) === 'row' ? 'row' : 'card';

  const tutors =
    results.status === 'ok'
      ? (await Promise.all(results.data.map((tutor) => getTutor(tutor.id))))
          .map((result) => (result.status === 'ok' ? result.data : null))
          .filter((tutor): tutor is TutorProfile => tutor !== null)
      : [];

  return (
    <>
      <SiteHeader />
      <TutorsHero />
      <Container as="main" className="py-8">
        <div className="flex justify-end md:hidden">
          <FilterSheet>
            <TutorFilters {...filterProps} />
          </FilterSheet>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
          <aside className="hidden flex-col gap-3 md:sticky md:top-20 md:flex md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto md:border-r md:border-border md:pr-4 md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden lg:pr-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
                Filters
              </h2>
              <ClearFiltersLink />
            </div>
            <TutorFilters {...filterProps} />
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            {(results.status === 'error' || (results.status === 'ok' && results.data.length > 0 && tutors.length === 0)) && (
              <Alert variant="danger" title="We couldn't load this page">
                Your internet connection may be interrupted. Try again.
              </Alert>
            )}

            {results.status === 'ok' && results.data.length === 0 && (
              <EmptyState
                icon={Users}
                title="No matching tutors found"
                description="Try a different subject, class, or area — or remove a filter."
                action={<ClearFiltersLink />}
              />
            )}

            {results.status === 'ok' && tutors.length > 0 && (
              <>
                <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-canvas py-3">
                  <p className="text-sm text-ink-secondary">Showing {results.meta.total} tutors found</p>
                  <ViewToggle view={view} showLabels />
                </div>

                {view === 'card' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tutors.map((tutor, index) => (
                      <div
                        key={tutor.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
                      >
                        <TutorProfileCard tutor={tutor} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {tutors.map((tutor, index) => (
                      <div
                        key={tutor.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
                      >
                        <TutorSpotlightRow tutor={tutor} />
                      </div>
                    ))}
                  </div>
                )}

                <SearchPagination page={page} limit={results.meta.limit} total={results.meta.total} />
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
