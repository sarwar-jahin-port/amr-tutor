import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { AuditLogEntry } from './types';

export function getAuditLogs(): Promise<AuditLogEntry[]> {
  return authedFetch('/admin/audit-logs?limit=50').then((res) => handleAuthed<AuditLogEntry[]>(res));
}
