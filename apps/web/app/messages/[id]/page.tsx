'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, Contact, RefreshCw, Send, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { SiteHeader } from '@/components/site-header';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/auth-context';
import { ContactSharePanel } from '@/features/contact-sharing/contact-share-panel';
import {
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage,
} from '@/features/messaging/api';
import type { ConversationSummary, Message } from '@/features/messaging/types';
import { ReportDialog } from '@/features/reports/report-dialog';

// Decision record item 14: persisted messaging with short-interval polling
// at launch, not WebSockets — simplest reliable delivery first.
const POLL_INTERVAL_MS = 12_000;

// Consecutive messages from the same sender within this window are grouped
// into one visual block (tighter spacing, one timestamp) instead of each
// getting full bubble chrome — mirrors WhatsApp/Messenger/iMessage grouping.
const GROUP_GAP_MS = 5 * 60 * 1000;

// How close to the bottom counts as "still there" for auto-scroll purposes.
const NEAR_BOTTOM_PX = 120;

// Composer grows with content up to this height, then scrolls internally.
const COMPOSER_MAX_HEIGHT_PX = 160;

interface PendingMessage {
  tempId: string;
  body: string;
  startedAt: string;
  status: 'sending' | 'failed';
}

interface DisplayItem {
  key: string;
  body: string;
  mine: boolean;
  createdAt: string;
  status: 'sent' | 'sending' | 'failed';
  tempId?: string;
}

type Row =
  | { kind: 'divider'; key: string; label: string }
  | {
      kind: 'message';
      key: string;
      item: DisplayItem;
      isFirstInGroup: boolean;
      isLastInGroup: boolean;
    };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function buildRows(items: DisplayItem[]): Row[] {
  const rows: Row[] = [];
  let lastDateLabel: string | null = null;

  items.forEach((item, i) => {
    const prev = items[i - 1];
    const next = items[i + 1];
    const dateLabel = formatDateLabel(item.createdAt);

    if (dateLabel !== lastDateLabel) {
      rows.push({ kind: 'divider', key: `divider-${item.key}`, label: dateLabel });
      lastDateLabel = dateLabel;
    }

    const groupedWithPrev =
      !!prev &&
      prev.mine === item.mine &&
      formatDateLabel(prev.createdAt) === dateLabel &&
      Math.abs(new Date(item.createdAt).getTime() - new Date(prev.createdAt).getTime()) <
        GROUP_GAP_MS;
    const groupedWithNext =
      !!next &&
      next.mine === item.mine &&
      formatDateLabel(next.createdAt) === dateLabel &&
      Math.abs(new Date(next.createdAt).getTime() - new Date(item.createdAt).getTime()) <
        GROUP_GAP_MS;

    rows.push({
      kind: 'message',
      key: item.key,
      item,
      isFirstInGroup: !groupedWithPrev,
      isLastInGroup: !groupedWithNext,
    });
  });

  return rows;
}

export default function ConversationPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { status, user } = useAuth();
  const router = useRouter();

  const [conversation, setConversation] = useState<ConversationSummary | null | undefined>(
    undefined,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevCountRef = useRef(0);

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
    const tick = () => {
      refreshMessages();
      // Re-stamped on every poll (not just on mount) so the backend can tell,
      // via how fresh this is, that the conversation is still open right now
      // — that's what lets it skip a MESSAGE_RECEIVED notification for a chat
      // the recipient is actively looking at.
      markConversationRead(conversationId).catch(() => {});
    };
    tick();

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, conversationId, refreshMessages]);

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior });
  }

  // Auto-scroll only when the viewer was already at the bottom, or the new
  // item is their own outgoing message — otherwise someone reading older
  // messages gets yanked down every time the other side sends something.
  useEffect(() => {
    const count = messages.length + pending.length;
    const grew = count > prevCountRef.current;
    prevCountRef.current = count;
    if (grew && (isNearBottom || pending.length > 0)) {
      scrollToBottom(prevCountRef.current <= 1 ? 'auto' : 'smooth');
    }
  }, [messages, pending, isNearBottom]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setIsNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX);
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`;
  }, [draft]);

  async function handleSend(tempIdOverride?: string, bodyOverride?: string) {
    const body = (bodyOverride ?? draft).trim();
    if (!body) return;

    const tempId = tempIdOverride ?? crypto.randomUUID();
    setPending((rows) => [
      ...rows.filter((r) => r.tempId !== tempId),
      { tempId, body, startedAt: new Date().toISOString(), status: 'sending' as const },
    ]);
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

  const items: DisplayItem[] = [
    ...messages.map((m) => ({
      key: m.id,
      body: m.body,
      mine: m.senderUserId === user.id,
      createdAt: m.createdAt,
      status: 'sent' as const,
    })),
    ...pending.map((p) => ({
      key: p.tempId,
      body: p.body,
      mine: true,
      createdAt: p.startedAt,
      status: p.status,
      tempId: p.tempId,
    })),
  ];
  const rows = buildRows(items);
  const canSend = conversation.status === 'ACTIVE';

  return (
    <div className="flex h-dvh flex-col overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <SiteHeader />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Container
            as="div"
            narrow
            className="flex flex-1 flex-col gap-3 overflow-hidden py-4 sm:py-6"
          >
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/messages"
                aria-label="Back to messages"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-secondary transition-colors duration-fast hover:bg-soft-green hover:text-ink"
              >
                <ArrowLeft className="size-5" />
              </Link>
              <Avatar
                name={conversation.counterpart.displayName}
                className="size-9 shrink-0 text-sm"
              />
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate text-base font-semibold text-ink">
                  {conversation.counterpart.displayName}
                </h1>
                <p className="truncate text-xs text-ink-secondary">{conversation.listing.title}</p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="tertiary" size="sm" aria-label="Contact details">
                        <Contact className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Contact</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom">
                      <SheetTitle>Contact details</SheetTitle>
                      <div className="mt-4">
                        <ContactSharePanel applicationId={conversation.applicationId} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <ReportDialog
                  target={{ targetUserId: conversation.counterpart.userId }}
                  label="Report"
                />
              </div>
            </div>

            <div className="relative min-h-0 flex-1 rounded-xl border border-border bg-canvas">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto overscroll-contain p-4"
              >
                {loadError && (
                  <p className="mb-3 text-sm text-danger">
                    Couldn&apos;t refresh messages. Still trying in the background.
                  </p>
                )}
                {rows.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-ink-secondary">No messages yet — say hello.</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {rows.map((row) => {
                      if (row.kind === 'divider') {
                        return (
                          <div
                            key={row.key}
                            className="my-3 flex items-center justify-center first:mt-0"
                          >
                            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-secondary">
                              {row.label}
                            </span>
                          </div>
                        );
                      }

                      const { item, isFirstInGroup, isLastInGroup } = row;
                      const mine = item.mine;
                      const failed = item.status === 'failed';

                      return (
                        <div
                          key={row.key}
                          className={cn(
                            'flex flex-col',
                            isFirstInGroup ? 'mt-2' : 'mt-0.5',
                            mine ? 'items-end' : 'items-start',
                          )}
                        >
                          <div className={cn('flex w-full items-end gap-2', mine && 'justify-end')}>
                            {!mine && (
                              <div className="hidden size-6 shrink-0 self-end md:block">
                                {isLastInGroup && (
                                  <Avatar
                                    name={conversation.counterpart.displayName}
                                    className="size-6 text-[10px]"
                                  />
                                )}
                              </div>
                            )}

                            <div
                              className={cn(
                                'max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                                failed
                                  ? 'border border-danger/40 bg-danger-surface text-ink'
                                  : mine
                                    ? cn(
                                        'bg-primary text-primary-foreground',
                                        item.status === 'sending' && 'opacity-70',
                                      )
                                    : 'bg-surface text-ink',
                              )}
                            >
                              {item.body}
                            </div>
                          </div>

                          <div className={cn('mt-0.5', !mine && 'md:pl-8')}>
                            {item.status === 'sending' && (
                              <span className="text-xs text-ink-secondary">Sending…</span>
                            )}
                            {failed && (
                              <span className="flex items-center gap-2 text-xs text-danger">
                                Failed to send.
                                <button
                                  type="button"
                                  className="flex items-center gap-1 font-medium hover:underline"
                                  onClick={() =>
                                    handleRetry(pending.find((p) => p.tempId === item.tempId)!)
                                  }
                                >
                                  <RefreshCw className="size-3" /> Retry
                                </button>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-ink-secondary hover:underline"
                                  onClick={() => handleDiscard(item.tempId!)}
                                >
                                  <X className="size-3" /> Discard
                                </button>
                              </span>
                            )}
                            {item.status === 'sent' && isLastInGroup && (
                              <span className="text-xs text-ink-secondary">
                                {formatTime(item.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {!isNearBottom && rows.length > 0 && (
                <button
                  type="button"
                  aria-label="Scroll to latest messages"
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full border border-border bg-surface text-ink-secondary shadow-elevated transition-colors duration-fast hover:bg-soft-green hover:text-ink"
                >
                  <ArrowDown className="size-4" />
                </button>
              )}
            </div>

            {canSend ? (
              <form
                className="flex shrink-0 items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
              >
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Write a message…"
                  rows={1}
                  maxLength={5000}
                  className="flex-1 resize-none overflow-y-auto"
                />
                <Button type="submit" disabled={!draft.trim()} aria-label="Send">
                  <Send className="size-4" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            ) : (
              <p className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-secondary">
                This conversation is no longer open for new messages.
              </p>
            )}
          </Container>
        </div>

        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface p-4 md:flex lg:w-96">
          <h2 className="text-sm font-semibold text-ink">Contact details</h2>
          <div className="mt-3">
            <ContactSharePanel applicationId={conversation.applicationId} />
          </div>
        </aside>
      </main>
    </div>
  );
}
