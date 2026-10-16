import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { AdminStats } from './types';

export function getAdminStats(days: number = 30): Promise<AdminStats> {
  return authedFetch(`/admin/stats?days=${days}`).then((res) => handleAuthed<AdminStats>(res));
}
