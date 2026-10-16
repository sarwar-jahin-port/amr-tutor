import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { CreateGuardianProfileInput, GuardianProfile, UpdateGuardianProfileInput } from './types';

export function createGuardianProfile(input: CreateGuardianProfileInput): Promise<GuardianProfile> {
  return authedFetch('/guardians/me/profile', { method: 'POST', body: JSON.stringify(input) }).then(
    (res) => handleAuthed<GuardianProfile>(res),
  );
}

/** Returns null when no profile has been created yet, rather than throwing. */
export async function getOwnGuardianProfile(): Promise<GuardianProfile | null> {
  const res = await authedFetch('/guardians/me/profile', { method: 'GET' });
  if (res.status === 404) return null;
  return handleAuthed<GuardianProfile>(res);
}

export function updateGuardianProfile(input: UpdateGuardianProfileInput): Promise<GuardianProfile> {
  return authedFetch('/guardians/me/profile', { method: 'PATCH', body: JSON.stringify(input) }).then(
    (res) => handleAuthed<GuardianProfile>(res),
  );
}
