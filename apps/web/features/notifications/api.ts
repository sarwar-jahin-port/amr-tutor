import { AuthedApiError, authedFetch, handleAuthed } from '@/lib/authed-api';
import type { Notification } from './types';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message: string | string[] };
    return Array.isArray(body.message) ? body.message.join(' ') : body.message;
  } catch {
    return 'Something went wrong. Please try again.';
  }
}

/** Unlike other list endpoints, callers need `meta.total` to build pagination — handleAuthed's unwrap would discard it. */
export async function getNotifications(params: { page?: number; limit?: number } = {}): Promise<{
  data: Notification[];
  meta: PaginationMeta;
}> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  const res = await authedFetch(`/notifications?${query.toString()}`);
  if (!res.ok) {
    throw new AuthedApiError(await parseErrorMessage(res), res.status);
  }
  return (await res.json()) as { data: Notification[]; meta: PaginationMeta };
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
