'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { getConversations } from '@/features/messaging/api';
import type { ConversationSummary } from '@/features/messaging/types';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function ConversationRow({ conversation }: { conversation: ConversationSummary }) {
  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-colors duration-fast hover:bg-soft-green"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-ink">{conversation.counterpart.displayName}</p>
          {conversation.hasUnread && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
        </div>
        <p className="truncate text-sm text-ink-secondary">{conversation.listing.title}</p>
        {conversation.lastMessage && (
          <p className="truncate text-sm text-ink-secondary">{conversation.lastMessage.body}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs text-ink-secondary">{formatRelativeTime(conversation.updatedAt)}</span>
        {conversation.status !== 'ACTIVE' && <Badge variant="neutral">{conversation.status}</Badge>}
      </div>
    </Link>
  );
}

export default function MessagesPage() {
  const { status } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[] | undefined>(undefined);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    getConversations().then((rows) => {
      if (!cancelled) setConversations(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === 'loading' || (status === 'authenticated' && conversations === undefined)) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </Container>
      </>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container as="main" className="flex min-h-screen items-center justify-center">
        <p className="text-ink-secondary">Redirecting to log in…</p>
      </Container>
    );
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Messages</h1>

        {conversations && conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Once an application is shortlisted, you can message the other party from there."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {conversations?.map((conversation) => (
              <ConversationRow key={conversation.id} conversation={conversation} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
