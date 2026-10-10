import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { Notification } from './types';

/** The {data, meta} envelope's `data` is already the array — handleAuthed's unwrap is all that's needed. */
export function getNotifications(): Promise<Notification[]> {
  return authedFetch('/notifications?limit=30').then((res) => handleAuthed<Notification[]>(res));
}

export function getUnreadCount(): Promise<number> {
  return authedFetch('/notifications/unread-count')
    .then((res) => handleAuthed<{ count: number }>(res))
    .then((data) => data.count);
}

export function markNotificationRead(id: string): Promise<void> {
  return authedFetch(`/notifications/${id}/read`, { method: 'PATCH' })
    .then((res) => handleAuthed<{ ok: true }>(res))
    .then(() => undefined);
}

export function markAllNotificationsRead(): Promise<void> {
  return authedFetch('/notifications/read-all', { method: 'PATCH' })
    .then((res) => handleAuthed<{ ok: true }>(res))
    .then(() => undefined);
}
