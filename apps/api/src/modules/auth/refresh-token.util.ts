import { createHash, randomBytes } from 'node:crypto';

/** High-entropy opaque refresh token; never a JWT, never parsed by the client. */
export function generateOpaqueToken(): string {
  return randomBytes(48).toString('base64url');
}

/**
 * Deterministic digest so a presented token can be looked up by equality.
 * Safe without a per-row salt because the input is already unguessable
 * random data, unlike a user-chosen password.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
