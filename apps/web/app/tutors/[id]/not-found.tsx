import { UserX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { SiteHeader } from '@/components/site-header';

export default function TutorNotFound() {
  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="py-16">
        <EmptyState
          icon={UserX}
          title="This tutor profile isn't available"
          description="It may have been removed, or the tutor is no longer accepting new students."
          action={
            <Button asChild>
              <Link href="/tutors">Browse other tutors</Link>
            </Button>
          }
        />
      </Container>
    </>
  );
}
