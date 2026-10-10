import type { Role, UserStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  roles: Role[];
  status: UserStatus;
}
