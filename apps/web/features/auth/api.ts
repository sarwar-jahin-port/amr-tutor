import { env } from '../../lib/env';
import type { ApiErrorBody, AuthUser, LoginResponseData } from './types';

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
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

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new AuthApiError(await parseErrorMessage(response), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

export interface RegisterInput {
  email: string;
  phone?: string;
  password: string;
  roles: ('TUTOR' | 'GUARDIAN')[];
}

export function registerRequest(input: RegisterInput): Promise<AuthUser> {
  return fetch(`${env.apiUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => handle<AuthUser>(res));
}

export function loginRequest(email: string, password: string): Promise<LoginResponseData> {
  return fetch(`${env.apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  }).then((res) => handle<LoginResponseData>(res));
}

export function refreshRequest(): Promise<LoginResponseData> {
  return fetch(`${env.apiUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  }).then((res) => handle<LoginResponseData>(res));
}

export function logoutRequest(): Promise<void> {
  return fetch(`${env.apiUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).then((res) => handle<void>(res));
}

export function meRequest(accessToken: string): Promise<AuthUser> {
  return fetch(`${env.apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((res) => handle<AuthUser>(res));
}

export function verifyEmailRequest(token: string): Promise<{ verified: true }> {
  return fetch(`${env.apiUrl}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).then((res) => handle<{ verified: true }>(res));
}

export function resendVerificationRequest(email: string): Promise<void> {
  return fetch(`${env.apiUrl}/auth/verify-email/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then((res) => handle<void>(res));
}

export function completeGoogleSignupRequest(
  pendingToken: string,
  roles: ('TUTOR' | 'GUARDIAN')[],
): Promise<LoginResponseData> {
  return fetch(`${env.apiUrl}/auth/google/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ pendingToken, roles }),
  }).then((res) => handle<LoginResponseData>(res));
}

/** Full-page navigation target — the backend decides login vs. sign-up vs. account-linking, not the client. */
export function googleLoginUrl(): string {
  return `${env.apiUrl}/auth/google`;
}
