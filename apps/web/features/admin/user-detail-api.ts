import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { AdminNote, AdminUserDetail, Role } from './types';

export function getUserDetail(id: string): Promise<AdminUserDetail> {
  return authedFetch(`/admin/users/${id}`).then((res) => handleAuthed<AdminUserDetail>(res));
}

export function changeUserRole(id: string, role: Role, action: 'ADD' | 'REMOVE'): Promise<AdminUserDetail> {
  return authedFetch(`/admin/users/${id}/roles`, { method: 'PATCH', body: JSON.stringify({ role, action }) }).then(
    (res) => handleAuthed<AdminUserDetail>(res),
  );
}

export async function revokeUserSessions(id: string): Promise<void> {
  const res = await authedFetch(`/admin/users/${id}/revoke-sessions`, { method: 'POST' });
  if (!res.ok) {
    await handleAuthed(res);
  }
}

export function updateTutorProfileAsAdmin(
  id: string,
  input: Partial<{
    fullName: string;
    department: string;
    degreeProgram: string;
    academicStatus: string;
    academicYear: string;
    introduction: string;
    preferredFeeMin: number;
    preferredFeeMax: number;
    isAvailable: boolean;
    universityId: string;
  }>,
) {
  return authedFetch(`/admin/users/${id}/tutor-profile`, { method: 'PATCH', body: JSON.stringify(input) }).then(
    (res) => handleAuthed(res),
  );
}

export function updateGuardianProfileAsAdmin(id: string, input: Partial<{ displayName: string; language: string }>) {
  return authedFetch(`/admin/users/${id}/guardian-profile`, { method: 'PATCH', body: JSON.stringify(input) }).then(
    (res) => handleAuthed(res),
  );
}

export function addUserNote(id: string, body: string): Promise<AdminNote> {
  return authedFetch(`/admin/users/${id}/notes`, { method: 'POST', body: JSON.stringify({ body }) }).then((res) =>
    handleAuthed<AdminNote>(res),
  );
}
