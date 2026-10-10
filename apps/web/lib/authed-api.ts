import { getAccessToken } from '@/features/auth/auth-context';
import type { ApiErrorBody } from '@/features/auth/types';
import { env } from './env';

/**
 * Shared by every authenticated "me" API client (tutor profile, guardian
 * profile, listing ownership, ...) — these all call the API directly from
 * the browser using the in-memory access token (see lib/auth/token-store),
 * so the fetch/error-handling boilerplate only needs to exist once.
 */
export class AuthedApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AuthedApiError';
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return Array.isArray(body.message) ? body.message.join(' ') : body.message;
  } catch {
    return 'Something went wrong. Please try again.';
  }
}

export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  if (!token) {
    throw new AuthedApiError('You need to be signed in to do this.', 401);
  }

  return fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
}

export async function handleAuthed<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new AuthedApiError(await parseErrorMessage(response), response.status);
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}
