import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';

export default function TuitionLoading() {
  return (
    <>
      <SiteHeader />
      <Container as="main" className="flex flex-col gap-6 py-10">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <div className="hidden flex-col gap-4 md:flex">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
