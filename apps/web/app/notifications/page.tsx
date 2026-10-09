'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/features/notifications/api';
import { describeNotification } from '@/features/notifications/format';
import type { Notification } from '@/features/notifications/types';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function NotificationRow({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const { title, href } = describeNotification(notification);

  const body = (
    <div className="flex flex-1 items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className={notification.readAt ? 'text-ink-secondary' : 'font-medium text-ink'}>{title}</span>
        <span className="text-xs text-ink-secondary">{formatDateTime(notification.createdAt)}</span>
      </div>
      {!notification.readAt && <Badge variant="information">New</Badge>}
    </div>
  );

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors duration-fast hover:bg-soft-green"
      onClick={() => !notification.readAt && onRead(notification.id)}
    >
      {href ? (
        <Link href={href} className="flex flex-1">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const { status } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[] | undefined>(undefined);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    getNotifications().then((rows) => {
      if (!cancelled) setNotifications(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  function handleRead(id: string) {
    setNotifications((rows) => rows?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    markNotificationRead(id).catch(() => {});
  }

  function handleMarkAllRead() {
    setNotifications((rows) => rows?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    markAllNotificationsRead().catch(() => {});
  }

  if (status === 'loading' || (status === 'authenticated' && notifications === undefined)) {
    return (
      <>
        <SiteHeader />
        <Container as="main" narrow className="flex flex-col gap-4 py-16">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
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

  const hasUnread = notifications?.some((n) => !n.readAt) ?? false;

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Notifications</h1>
          {hasUnread && (
            <Button variant="tertiary" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {notifications && notifications.length === 0 ? (
          <EmptyState title="No notifications yet" description="Activity on your listings, applications, and messages will show up here." />
        ) : (
          <div className="flex flex-col gap-3">
            {notifications?.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onRead={handleRead} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
