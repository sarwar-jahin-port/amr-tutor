import type { Role, UserStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  roles: Role[];
  status: UserStatus;
  /** Set only on a support "view as" session — the admin's own user id, never the target's. */
  impersonatedBy?: string;
}
