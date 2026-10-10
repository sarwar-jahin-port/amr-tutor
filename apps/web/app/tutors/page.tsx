import { Users } from 'lucide-react';
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
  getUniversities,
  searchTutors,
} from '@/features/marketplace/api';
import { ClearFiltersLink } from '@/features/marketplace/clear-filters-link';
import { FilterSheet } from '@/features/marketplace/filter-sheet';
import { SearchPagination } from '@/features/marketplace/search-pagination';
import { TutorFilters } from '@/features/marketplace/tutor-filters';
import { TutorResultCard } from '@/features/marketplace/tutor-result-card';

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

  return (
    <>
      <SiteHeader />
      <Container as="main" className="flex flex-col gap-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Find a tutor</h1>
            <p className="text-ink-secondary">
              Browse university students available to teach near you.
            </p>
          </div>
          <FilterSheet>
            <TutorFilters {...filterProps} />
          </FilterSheet>
        </div>

        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <aside className="hidden flex-col gap-5 md:flex">
            <TutorFilters {...filterProps} />
            <ClearFiltersLink />
          </aside>

          <div className="flex flex-col gap-6">
            {results.status === 'error' && (
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

            {results.status === 'ok' && results.data.length > 0 && (
              <>
                <p className="text-sm text-ink-secondary">{results.meta.total} tutors found</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {results.data.map((tutor) => (
                    <TutorResultCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>
                <SearchPagination page={page} limit={results.meta.limit} total={results.meta.total} />
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
