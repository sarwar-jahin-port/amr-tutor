import {
  BookOpen,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  type LucideIcon,
  MapPin,
  Monitor,
  SlidersHorizontal,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';
import { FilterLabel } from '@/features/marketplace/filter-label';
import { TuitionHero } from '@/features/marketplace/tuition-hero';
import { TuitionOpportunityCardSkeleton } from '@/features/marketplace/tuition-opportunity-card';

const FILTER_FIELDS: { icon: LucideIcon; label: string; budget?: boolean }[] = [
  { icon: MapPin, label: 'District' },
  { icon: BookOpen, label: 'Area' },
  { icon: BookOpen, label: 'Subject' },
  { icon: GraduationCap, label: 'Class / grade' },
  { icon: Clock, label: 'Monthly budget (৳)', budget: true },
  { icon: FileText, label: 'Curriculum' },
  { icon: Building2, label: 'Preferred university' },
  { icon: Monitor, label: 'Teaching mode' },
  { icon: CalendarDays, label: 'Days per week' },
];

/**
 * Mirrors app/tuition/page.tsx exactly: the hero and filter labels are
 * static (no fetch needed), so they render for real here — only the parts
 * that depend on the in-flight data (filter controls, result count, sort,
 * cards) are skeletons.
 */
export default function TuitionLoading() {
  return (
    <>
      <SiteHeader />
      <TuitionHero />
      <Container as="main" className="py-8">
        <div className="flex justify-end md:hidden">
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
          <div className="hidden flex-col gap-3 md:flex md:border-r md:border-border md:pr-4 lg:pr-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
                Filters
              </h2>
              <Skeleton className="h-4 w-14" />
            </div>

            {FILTER_FIELDS.map(({ icon, label, budget }) => (
              <div key={label} className="flex flex-col gap-1">
                <FilterLabel icon={icon}>{label}</FilterLabel>
                {budget ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-11 w-full rounded-lg" />
                    <span className="text-ink-secondary">–</span>
                    <Skeleton className="h-11 w-full rounded-lg" />
                  </div>
                ) : (
                  <Skeleton className="h-11 w-full rounded-lg" />
                )}
              </div>
            ))}
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-5 w-36" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-9 w-[72px] rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TuitionOpportunityCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
