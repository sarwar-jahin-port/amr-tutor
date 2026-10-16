'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { getMyApplications, withdrawApplication } from '@/features/applications/api';
import { APPLICATION_STATUS_BADGE, APPLICATION_STATUS_LABEL } from '@/features/applications/format';
import type { ApplicationDetail } from '@/features/applications/types';
import { createConversation } from '@/features/messaging/api';
import { AuthedApiError } from '@/lib/authed-api';

const WITHDRAWABLE_STATUSES = new Set(['SUBMITTED', 'VIEWED', 'SHORTLISTED']);
/** Messaging opens once the owner has shown interest (decision record §4.2 state chain). */
const MESSAGEABLE_STATUSES = new Set(['SHORTLISTED', 'CONTACT_REQUESTED', 'ACCEPTED']);

function ApplicationRow({
  application,
  onWithdrawn,
}: {
  application: ApplicationDetail;
  onWithdrawn: (updated: ApplicationDetail) => void;
}) {
  const router = useRouter();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  async function handleWithdraw() {
    setIsWithdrawing(true);
    try {
      onWithdrawn(await withdrawApplication(application.id));
    } catch (error) {
      const message = error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
      toast({ title: "Couldn't withdraw", description: message, variant: 'danger' });
    } finally {
      setIsWithdrawing(false);
    }
  }

  async function handleMessage() {
    setIsOpeningChat(true);
    try {
      const conversation = await createConversation(application.id);
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      const message = error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
      toast({ title: "Couldn't open the conversation", description: message, variant: 'danger' });
      setIsOpeningChat(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/tuition/${application.listing.id}`} className="font-semibold text-ink hover:text-primary">
            {application.listing.title}
          </Link>
          <Badge variant={APPLICATION_STATUS_BADGE[application.status]}>
            {APPLICATION_STATUS_LABEL[application.status]}
          </Badge>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          {application.listing.area}, {application.listing.city}
        </p>
      </div>
      <div className="flex gap-2">
        {MESSAGEABLE_STATUSES.has(application.status) && (
          <Button variant="secondary" size="sm" isLoading={isOpeningChat} onClick={() => void handleMessage()}>
            Message
          </Button>
        )}
        {WITHDRAWABLE_STATUSES.has(application.status) && (
          <Button variant="tertiary" size="sm" isLoading={isWithdrawing} onClick={() => void handleWithdraw()}>
            Withdraw
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MyApplicationsPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationDetail[] | undefined>(undefined);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !user?.roles.includes('TUTOR')) return;
    let cancelled = false;
    getMyApplications().then((rows) => {
      if (!cancelled) setApplications(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status, user]);

  if (status === 'loading' || (status === 'authenticated' && applications === undefined && user?.roles.includes('TUTOR'))) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </Container>
      </>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <Container as="main" className="flex min-h-screen items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </Container>
    );
  }

  if (!user.roles.includes('TUTOR')) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">My applications</h1>
          <p className="text-ink-secondary">
            Only accounts with a tutor profile apply to tuition opportunities. Your account doesn&apos;t
            currently hold the tutor role.
          </p>
        </Container>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">My applications</h1>

        {applications && applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Browse tuition opportunities and apply to the ones that fit your subjects and schedule."
            action={
              <Button asChild>
                <Link href="/tuition">Find tuition</Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {applications?.map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                onWithdrawn={(updated) =>
                  setApplications((rows) => rows?.map((a) => (a.id === updated.id ? updated : a)))
                }
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
