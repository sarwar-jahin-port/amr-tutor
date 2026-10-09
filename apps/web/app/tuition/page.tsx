import { BookOpen } from 'lucide-react';
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
  searchListings,
} from '@/features/marketplace/api';
import { ClearFiltersLink } from '@/features/marketplace/clear-filters-link';
import { FilterSheet } from '@/features/marketplace/filter-sheet';
import { ListingFilters } from '@/features/marketplace/listing-filters';
import { ListingResultCard } from '@/features/marketplace/listing-result-card';
import { SearchPagination } from '@/features/marketplace/search-pagination';

export const metadata: Metadata = {
  title: 'Find tuition — AMR Tutor',
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function firstNumber(value: string | string[] | undefined): number | undefined {
  const v = first(value);
  const n = v ? Number(v) : undefined;
  return n !== undefined && !Number.isNaN(n) ? n : undefined;
}

interface TuitionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TuitionPage({ searchParams }: TuitionPageProps) {
  const params = await searchParams;
  const page = Number(first(params.page)) || 1;

  const [subjects, grades, curricula, universities, divisions, results] = await Promise.all([
    getSubjects(),
    getGrades(),
    getCurricula(),
    getUniversities(),
    getLocations(),
    searchListings({
      city: first(params.city),
      area: first(params.area),
      subjectId: first(params.subjectId),
      classLevel: first(params.classLevel),
      curriculumId: first(params.curriculumId),
      universityId: first(params.universityId),
      salaryMin: firstNumber(params.salaryMin),
      salaryMax: firstNumber(params.salaryMax),
      daysPerWeek: firstNumber(params.daysPerWeek),
      teachingMode: first(params.teachingMode),
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
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Find tuition</h1>
            <p className="text-ink-secondary">
              Browse published tuition opportunities from guardians across Bangladesh.
            </p>
          </div>
          <FilterSheet>
            <ListingFilters {...filterProps} />
          </FilterSheet>
        </div>

        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <aside className="hidden flex-col gap-5 md:flex">
            <ListingFilters {...filterProps} />
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
                icon={BookOpen}
                title="No matching tuition found"
                description="Try a nearby area, adjust the budget, or remove a filter."
                action={<ClearFiltersLink />}
              />
            )}

            {results.status === 'ok' && results.data.length > 0 && (
              <>
                <p className="text-sm text-ink-secondary">{results.meta.total} opportunities found</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {results.data.map((listing) => (
                    <ListingResultCard key={listing.id} listing={listing} />
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
