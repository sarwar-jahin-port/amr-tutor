'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from './api';
import { describeNotification } from './format';
import type { Notification } from './types';

const POLL_INTERVAL_MS = 20_000;

function formatRelativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[] | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function refresh() {
      getUnreadCount()
        .then((count) => {
          if (!cancelled) setUnreadCount(count);
        })
        .catch(() => {});
    }
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open && notifications === undefined) {
      getNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]));
    }
  }

  async function handleItemClick(notification: Notification) {
    if (!notification.readAt) {
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((rows) =>
        rows?.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      markNotificationRead(notification.id).catch(() => {});
    }
    setIsOpen(false);
  }

  async function handleMarkAllRead() {
    setUnreadCount(0);
    setNotifications((rows) => rows?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg text-ink-secondary transition-colors duration-fast hover:bg-soft-green hover:text-ink"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        >
          <Bell className="size-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-2 rounded-full bg-danger" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button type="button" className="text-xs font-medium text-primary" onClick={() => void handleMarkAllRead()}>
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications === undefined ? (
          <p className="px-2 py-4 text-center text-sm text-ink-secondary">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-ink-secondary">No notifications yet.</p>
        ) : (
          <div className="flex max-h-96 flex-col overflow-y-auto">
            {notifications.map((notification) => {
              const { title, href } = describeNotification(notification);
              const content = (
                <div className="flex w-full flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    {!notification.readAt && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                    <span className={notification.readAt ? 'text-ink-secondary' : 'font-medium text-ink'}>{title}</span>
                  </div>
                  <span className="text-xs text-ink-secondary">{formatRelativeTime(notification.createdAt)}</span>
                </div>
              );
              return (
                <DropdownMenuItem key={notification.id} asChild onSelect={() => void handleItemClick(notification)}>
                  {href ? <Link href={href}>{content}</Link> : <div>{content}</div>}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-primary">
            See all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
