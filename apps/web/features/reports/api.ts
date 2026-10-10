import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { ReportCategory, ReportModerator, ReportStatus, ReportSummary, ReportTargetInput } from './types';

export function createReport(
  target: ReportTargetInput,
  category: ReportCategory,
  description?: string,
): Promise<ReportSummary> {
  return authedFetch('/reports', { method: 'POST', body: JSON.stringify({ ...target, category, description }) }).then(
    (res) => handleAuthed<ReportSummary>(res),
  );
}

export function getMyReports(): Promise<ReportSummary[]> {
  return authedFetch('/users/me/reports?limit=100').then((res) => handleAuthed<ReportSummary[]>(res));
}

export function getReportQueue(status?: ReportStatus): Promise<ReportModerator[]> {
  const query = status ? `?status=${status}&limit=100` : '?limit=100';
  return authedFetch(`/admin/reports${query}`).then((res) => handleAuthed<ReportModerator[]>(res));
}

export function updateReportStatus(
  id: string,
  status: 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED',
  resolution?: string,
): Promise<ReportModerator> {
  return authedFetch(`/admin/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, resolution }) }).then(
    (res) => handleAuthed<ReportModerator>(res),
  );
}
