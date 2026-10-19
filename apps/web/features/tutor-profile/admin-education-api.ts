import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { AdminEducationRecord } from './education-types';

/** The reviewer's side of SSC/HSC/University certificate verification (admin-education-records.controller.ts). */
export function getPendingEducationRecords(): Promise<AdminEducationRecord[]> {
  return authedFetch('/admin/education-records/pending').then((res) => handleAuthed<AdminEducationRecord[]>(res));
}

export function getAdminCertificateDownloadUrl(recordId: string): Promise<string> {
  return authedFetch(`/admin/education-records/${recordId}/certificate-download-url`)
    .then((res) => handleAuthed<{ downloadUrl: string }>(res))
    .then((data) => data.downloadUrl);
}

export function decideEducationRecord(
  recordId: string,
  approve: boolean,
  reason?: string,
): Promise<AdminEducationRecord> {
  return authedFetch(`/admin/education-records/${recordId}/decision`, {
    method: 'POST',
    body: JSON.stringify({ approve, reason }),
  }).then((res) => handleAuthed<AdminEducationRecord>(res));
}
