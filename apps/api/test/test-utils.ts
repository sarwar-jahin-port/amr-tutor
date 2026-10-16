import { randomUUID } from 'node:crypto';
import type { Response } from 'supertest';

export function uniqueEmail(label: string): string {
  return `${label}-${randomUUID()}@test.amr-tutor.invalid`;
}

/** Extracts a cookie's value from a response's Set-Cookie header(s). */
export function extractCookie(response: Response, name: string): string | undefined {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | string | undefined;
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const match = cookies.find((c) => c.startsWith(`${name}=`));
  if (!match) return undefined;
  return match.split(';')[0]?.split('=')[1];
}
