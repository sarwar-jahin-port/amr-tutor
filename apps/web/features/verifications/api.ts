import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type {
  EvidenceType,
  VerificationDecision,
  VerificationRequestDetail,
  VerificationStatus,
  VerificationType,
} from './types';

export function createVerificationRequest(type: VerificationType): Promise<VerificationRequestDetail> {
  return authedFetch('/verifications', { method: 'POST', body: JSON.stringify({ type }) }).then((res) =>
    handleAuthed<VerificationRequestDetail>(res),
  );
}

export function getMyVerifications(): Promise<VerificationRequestDetail[]> {
  return authedFetch('/verifications/me').then((res) => handleAuthed<VerificationRequestDetail[]>(res));
}

export function getVerification(id: string): Promise<VerificationRequestDetail> {
  return authedFetch(`/verifications/${id}`).then((res) => handleAuthed<VerificationRequestDetail>(res));
}

export async function requestEvidenceUpload(
  requestId: string,
  input: { evidenceType: EvidenceType; contentType: string; fileSizeBytes: number; originalFileName?: string },
): Promise<{ evidenceId: string; uploadUrl: string }> {
  return authedFetch(`/verifications/${requestId}/evidence-upload`, {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((res) => handleAuthed<{ evidenceId: string; uploadUrl: string }>(res));
}

/** PUTs directly to private object storage using the signed URL — the file never passes through our own API. */
export async function uploadEvidenceFile(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) {
    throw new Error('The file failed to upload. Please try again.');
  }
}

export function submitVerification(requestId: string): Promise<VerificationRequestDetail> {
  return authedFetch(`/verifications/${requestId}/submit`, { method: 'POST' }).then((res) =>
    handleAuthed<VerificationRequestDetail>(res),
  );
}

export function getEvidenceDownloadUrl(requestId: string, evidenceId: string): Promise<string> {
  return authedFetch(`/verifications/${requestId}/evidence/${evidenceId}/download-url`)
    .then((res) => handleAuthed<{ downloadUrl: string }>(res))
    .then((data) => data.downloadUrl);
}

export function getVerificationQueue(status: VerificationStatus = 'IN_REVIEW'): Promise<VerificationRequestDetail[]> {
  return authedFetch(`/admin/verifications?status=${status}`).then((res) =>
    handleAuthed<VerificationRequestDetail[]>(res),
  );
}

export function decideVerification(
  requestId: string,
  decision: VerificationDecision,
  reason?: string,
): Promise<VerificationRequestDetail> {
  return authedFetch(`/admin/verifications/${requestId}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  }).then((res) => handleAuthed<VerificationRequestDetail>(res));
}
