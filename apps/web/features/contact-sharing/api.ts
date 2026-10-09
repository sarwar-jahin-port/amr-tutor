import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { ContactShareState } from './types';

export function shareContact(
  applicationId: string,
  input: { sharePhone: boolean; shareEmail: boolean },
): Promise<ContactShareState> {
  return authedFetch(`/applications/${applicationId}/contact-share`, {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((res) => handleAuthed<ContactShareState>(res));
}

export function getContactShareState(applicationId: string): Promise<ContactShareState> {
  return authedFetch(`/applications/${applicationId}/contact-share`).then((res) =>
    handleAuthed<ContactShareState>(res),
  );
}
