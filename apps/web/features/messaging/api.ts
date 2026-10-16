import { AuthedApiError, authedFetch, handleAuthed } from '@/lib/authed-api';
import type { ConversationSummary, Message, MessagePage } from './types';

export function createConversation(applicationId: string): Promise<ConversationSummary> {
  return authedFetch(`/applications/${applicationId}/conversation`, { method: 'POST' }).then((res) =>
    handleAuthed<ConversationSummary>(res),
  );
}

/** The {data, meta} envelope's `data` is already the array — handleAuthed's unwrap is all that's needed. */
export function getConversations(): Promise<ConversationSummary[]> {
  return authedFetch('/conversations?limit=100').then((res) => handleAuthed<ConversationSummary[]>(res));
}

/** Unlike other list endpoints, `meta.nextCursor` is needed for "load older messages" — handleAuthed's unwrap would discard it. */
export async function getMessages(conversationId: string, before?: string): Promise<MessagePage> {
  const query = before ? `?limit=30&before=${before}` : '?limit=30';
  const res = await authedFetch(`/conversations/${conversationId}/messages${query}`);
  if (!res.ok) {
    throw new AuthedApiError(await parseErrorMessage(res), res.status);
  }
  return (await res.json()) as MessagePage;
}

export function sendMessage(conversationId: string, body: string): Promise<Message> {
  return authedFetch(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  }).then((res) => handleAuthed<Message>(res));
}

export function markConversationRead(conversationId: string): Promise<void> {
  return authedFetch(`/conversations/${conversationId}/read`, { method: 'PATCH' }).then((res) =>
    handleAuthed<{ ok: true }>(res).then(() => undefined),
  );
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message: string | string[] };
    return Array.isArray(body.message) ? body.message.join(' ') : body.message;
  } catch {
    return 'Something went wrong. Please try again.';
  }
}
