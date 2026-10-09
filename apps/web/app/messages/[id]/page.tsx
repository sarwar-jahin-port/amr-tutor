'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { ContactSharePanel } from '@/features/contact-sharing/contact-share-panel';
import { getConversations, getMessages, markConversationRead, sendMessage } from '@/features/messaging/api';
import type { ConversationSummary, Message } from '@/features/messaging/types';

// Decision record item 14: persisted messaging with short-interval polling
// at launch, not WebSockets — simplest reliable delivery first.
const POLL_INTERVAL_MS = 12_000;

interface PendingMessage {
  tempId: string;
  body: string;
  status: 'sending' | 'failed';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ConversationPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { status, user } = useAuth();
  const router = useRouter();

  const [conversation, setConversation] = useState<ConversationSummary | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadError, setLoadError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    getConversations()
      .then((rows) => {
        if (!cancelled) setConversation(rows.find((c) => c.id === conversationId) ?? null);
      })
      .catch(() => {
        if (!cancelled) setConversation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status, conversationId]);

  const refreshMessages = useCallback(() => {
    getMessages(conversationId)
      .then((page) => {
        setMessages(page.data);
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  }, [conversationId]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    refreshMessages();
    markConversationRead(conversationId).catch(() => {});

    const interval = setInterval(refreshMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, conversationId, refreshMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, pending]);

  async function handleSend(tempIdOverride?: string, bodyOverride?: string) {
    const body = (bodyOverride ?? draft).trim();
    if (!body) return;

    const tempId = tempIdOverride ?? crypto.randomUUID();
    setPending((rows) => [...rows.filter((r) => r.tempId !== tempId), { tempId, body, status: 'sending' as const }]);
    if (!tempIdOverride) setDraft('');

    try {
      const sent = await sendMessage(conversationId, body);
      setPending((rows) => rows.filter((r) => r.tempId !== tempId));
      setMessages((rows) => (rows.some((m) => m.id === sent.id) ? rows : [...rows, sent]));
    } catch {
      setPending((rows) => rows.map((r) => (r.tempId === tempId ? { ...r, status: 'failed' } : r)));
    }
  }

  function handleRetry(message: PendingMessage) {
    void handleSend(message.tempId, message.body);
  }

  function handleDiscard(tempId: string) {
    setPending((rows) => rows.filter((r) => r.tempId !== tempId));
  }

  if (status === 'loading' || conversation === undefined) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
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

  if (!conversation) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <p className="text-ink-secondary">
            This conversation doesn&apos;t exist, or you don&apos;t have access to it.
          </p>
          <Button asChild variant="secondary" className="self-start">
            <Link href="/messages">Back to messages</Link>
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex min-h-screen flex-col gap-4 py-10">
        <div className="flex flex-col gap-1">
          <Link href="/messages" className="text-sm text-ink-secondary hover:text-primary">
            ← Back to messages
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{conversation.counterpart.displayName}</h1>
          <p className="text-sm text-ink-secondary">{conversation.listing.title}</p>
        </div>

        <ContactSharePanel applicationId={conversation.applicationId} />

        <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-canvas p-4">
          {loadError && (
            <p className="text-sm text-danger">Couldn&apos;t refresh messages. Still trying in the background.</p>
          )}
          {messages.length === 0 && pending.length === 0 ? (
            <p className="text-sm text-ink-secondary">No messages yet — say hello.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((message) => {
                const mine = message.senderUserId === user.id;
                return (
                  <div key={message.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        mine ? 'bg-primary text-primary-foreground' : 'bg-surface text-ink'
                      }`}
                    >
                      {message.body}
                    </div>
                    <span className="mt-0.5 text-xs text-ink-secondary">{formatTime(message.createdAt)}</span>
                  </div>
                );
              })}
              {pending.map((message) => (
                <div key={message.tempId} className="flex flex-col items-end">
                  <div className="max-w-[80%] rounded-2xl bg-primary/60 px-3 py-2 text-sm text-primary-foreground">
                    {message.body}
                  </div>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-secondary">
                    {message.status === 'sending' ? (
                      'Sending…'
                    ) : (
                      <>
                        Failed to send.
                        <button
                          type="button"
                          className="font-medium text-primary"
                          onClick={() => handleRetry(message)}
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          className="text-ink-secondary underline"
                          onClick={() => handleDiscard(message.tempId)}
                        >
                          Discard
                        </button>
                      </>
                    )}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Write a message…"
            rows={2}
            maxLength={5000}
            className="flex-1"
          />
          <Button type="submit" disabled={!draft.trim()}>
            Send
          </Button>
        </form>
      </Container>
    </>
  );
}
