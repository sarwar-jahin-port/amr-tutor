import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';

export default function TutorProfileLoading() {
  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-10">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </Container>
    </>
  );
}
