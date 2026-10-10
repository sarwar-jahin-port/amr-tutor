import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { AdminUser } from './types';

export function searchUsers(search?: string): Promise<AdminUser[]> {
  const query = search ? `?search=${encodeURIComponent(search)}&limit=50` : '?limit=50';
  return authedFetch(`/admin/users${query}`).then((res) => handleAuthed<AdminUser[]>(res));
}

export function updateUserStatus(
  id: string,
  status: 'ACTIVE' | 'SUSPENDED',
  reason?: string,
): Promise<AdminUser> {
  return authedFetch(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }).then(
    (res) => handleAuthed<AdminUser>(res),
  );
}
