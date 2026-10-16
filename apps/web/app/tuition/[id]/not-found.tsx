import { FileX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { SiteHeader } from '@/components/site-header';

export default function ListingNotFound() {
  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="py-16">
        <EmptyState
          icon={FileX}
          title="This tuition opportunity isn't available"
          description="It may have been filled, closed, or removed by the guardian who posted it."
          action={
            <Button asChild>
              <Link href="/tuition">Browse other opportunities</Link>
            </Button>
          }
        />
      </Container>
    </>
  );
}
