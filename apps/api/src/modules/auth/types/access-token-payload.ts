import type { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  roles: Role[];
}
