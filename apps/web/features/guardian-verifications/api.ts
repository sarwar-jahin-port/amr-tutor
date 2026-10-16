import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type {
  GuardianEvidenceType,
  GuardianVerificationRequestDetail,
  VerificationDecision,
  VerificationStatus,
} from './types';

export function createGuardianVerificationRequest(): Promise<GuardianVerificationRequestDetail> {
  return authedFetch('/guardian-verifications', { method: 'POST' }).then((res) =>
    handleAuthed<GuardianVerificationRequestDetail>(res),
  );
}

export function getMyGuardianVerifications(): Promise<GuardianVerificationRequestDetail[]> {
  return authedFetch('/guardian-verifications/me').then((res) => handleAuthed<GuardianVerificationRequestDetail[]>(res));
}

export async function requestGuardianEvidenceUpload(
  requestId: string,
  input: { evidenceType: GuardianEvidenceType; contentType: string; fileSizeBytes: number; originalFileName?: string },
): Promise<{ evidenceId: string; uploadUrl: string }> {
  return authedFetch(`/guardian-verifications/${requestId}/evidence-upload`, {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((res) => handleAuthed<{ evidenceId: string; uploadUrl: string }>(res));
}

/** PUTs directly to private object storage using the signed URL — the file never passes through our own API. */
export async function uploadGuardianEvidenceFile(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) {
    throw new Error('The file failed to upload. Please try again.');
  }
}

export function submitGuardianVerification(requestId: string): Promise<GuardianVerificationRequestDetail> {
  return authedFetch(`/guardian-verifications/${requestId}/submit`, { method: 'POST' }).then((res) =>
    handleAuthed<GuardianVerificationRequestDetail>(res),
  );
}

export function getGuardianEvidenceDownloadUrl(requestId: string, evidenceId: string): Promise<string> {
  return authedFetch(`/guardian-verifications/${requestId}/evidence/${evidenceId}/download-url`)
    .then((res) => handleAuthed<{ downloadUrl: string }>(res))
    .then((data) => data.downloadUrl);
}

export function getGuardianVerificationQueue(status: VerificationStatus = 'IN_REVIEW'): Promise<GuardianVerificationRequestDetail[]> {
  return authedFetch(`/admin/guardian-verifications?status=${status}`).then((res) =>
    handleAuthed<GuardianVerificationRequestDetail[]>(res),
  );
}

export function decideGuardianVerification(
  requestId: string,
  decision: VerificationDecision,
  reason?: string,
): Promise<GuardianVerificationRequestDetail> {
  return authedFetch(`/admin/guardian-verifications/${requestId}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  }).then((res) => handleAuthed<GuardianVerificationRequestDetail>(res));
}
