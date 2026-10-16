import type { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  roles: Role[];
  /** Set only on a support "view as" session — the admin's own user id, never the target's. */
  impersonatedBy?: string;
}
