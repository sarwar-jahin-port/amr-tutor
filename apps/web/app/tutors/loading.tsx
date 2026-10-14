import { BookOpen, Building2, FileText, GraduationCap, MapPin, SlidersHorizontal, UserCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';
import { FilterLabel } from '@/features/marketplace/filter-label';
import { TutorProfileCardSkeleton } from '@/features/marketplace/tutor-profile-card';
import { TutorsHero } from '@/features/marketplace/tutors-hero';

const FILTER_FIELDS = [
  { icon: BookOpen, label: 'Subject' },
  { icon: GraduationCap, label: 'Class / grade' },
  { icon: UserCheck, label: 'Academic status' },
  { icon: FileText, label: 'Curriculum' },
  { icon: Building2, label: 'University' },
  { icon: MapPin, label: 'District' },
  { icon: MapPin, label: 'Area' },
] as const;

/**
 * Mirrors app/tutors/page.tsx exactly: the hero and filter labels are
 * static (no fetch needed), so they render for real here — only the parts
 * that depend on the in-flight data (filter controls, result count, cards)
 * are skeletons.
 */
export default function TutorsLoading() {
  return (
    <>
      <SiteHeader />
      <TutorsHero />
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

            {FILTER_FIELDS.map(({ icon, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <FilterLabel icon={icon}>{label}</FilterLabel>
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ))}
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TutorProfileCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
