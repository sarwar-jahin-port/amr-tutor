import { BookOpen, SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';
import { Alert } from '@/components/ui/alert';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { SiteHeader } from '@/components/site-header';
import {
  getCurricula,
  getGrades,
  getListing,
  getLocations,
  getSubjects,
  getUniversities,
  searchListings,
} from '@/features/marketplace/api';
import { ClearFiltersLink } from '@/features/marketplace/clear-filters-link';
import { FilterSheet } from '@/features/marketplace/filter-sheet';
import { ListingFilters } from '@/features/marketplace/listing-filters';
import { SearchPagination } from '@/features/marketplace/search-pagination';
import { SortSelect } from '@/features/marketplace/sort-select';
import { TuitionHero } from '@/features/marketplace/tuition-hero';
import { TuitionOpportunityCard } from '@/features/marketplace/tuition-opportunity-card';
import { TuitionOpportunityRow } from '@/features/marketplace/tuition-opportunity-row';
import type { ListingDetail } from '@/features/marketplace/types';
import { ViewToggle } from '@/features/marketplace/view-toggle';

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
      sort: first(params.sort),
      page,
    }),
  ]);

  const filterProps = { subjects, grades, curricula, universities, divisions };
  const view = first(params.view) === 'row' ? 'row' : 'card';

  const listings =
    results.status === 'ok'
      ? (await Promise.all(results.data.map((listing) => getListing(listing.id))))
          .map((result) => (result.status === 'ok' ? result.data : null))
          .filter((listing): listing is ListingDetail => listing !== null)
      : [];

  return (
    <>
      <SiteHeader />
      <TuitionHero />
      <Container as="main" className="py-8">
        <div className="flex justify-end md:hidden">
          <FilterSheet>
            <ListingFilters {...filterProps} />
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
            <ListingFilters {...filterProps} />
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            {(results.status === 'error' || (results.status === 'ok' && results.data.length > 0 && listings.length === 0)) && (
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

            {results.status === 'ok' && listings.length > 0 && (
              <>
                <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-canvas py-3">
                  <p className="text-sm text-ink-secondary">Showing {results.meta.total} opportunities</p>
                  <div className="flex items-center gap-3">
                    <SortSelect />
                    <ViewToggle view={view} />
                  </div>
                </div>

                {view === 'card' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {listings.map((listing, index) => (
                      <div
                        key={listing.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
                      >
                        <TuitionOpportunityCard listing={listing} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {listings.map((listing, index) => (
                      <div
                        key={listing.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
                      >
                        <TuitionOpportunityRow listing={listing} />
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
