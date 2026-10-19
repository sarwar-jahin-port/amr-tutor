import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { EducationLevel, EducationRecord } from './education-types';

export function getOwnEducationRecords(): Promise<EducationRecord[]> {
  return authedFetch('/tutors/me/education').then((res) => handleAuthed<EducationRecord[]>(res));
}

export function upsertEducationRecord(
  level: EducationLevel,
  input: { institution: string; gpa?: string },
): Promise<EducationRecord> {
  return authedFetch(`/tutors/me/education/${level}`, { method: 'PUT', body: JSON.stringify(input) }).then((res) =>
    handleAuthed<EducationRecord>(res),
  );
}

export async function requestCertificateUpload(
  level: EducationLevel,
  input: { contentType: string; fileSizeBytes: number; originalFileName?: string },
): Promise<{ uploadUrl: string }> {
  return authedFetch(`/tutors/me/education/${level}/certificate-upload`, {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((res) => handleAuthed<{ uploadUrl: string }>(res));
}

/** PUTs directly to private object storage using the signed URL — the file never passes through our own API. */
export async function uploadCertificateFile(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) {
    throw new Error('The file failed to upload. Please try again.');
  }
}

export function getCertificateDownloadUrl(level: EducationLevel): Promise<string> {
  return authedFetch(`/tutors/me/education/${level}/certificate-download-url`)
    .then((res) => handleAuthed<{ downloadUrl: string }>(res))
    .then((data) => data.downloadUrl);
}
