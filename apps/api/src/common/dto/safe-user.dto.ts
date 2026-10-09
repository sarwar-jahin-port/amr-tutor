import type { Role, UserStatus } from '@prisma/client';

/**
 * The only shape of a User ever returned by the API. Never serialize a raw
 * Prisma User record — it carries passwordHash and other fields that must
 * never leave the server (blueprint Phase 3: "Never return the password
 * hash... in this response").
 */
export interface SafeUserDto {
  id: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  roles: Role[];
  createdAt: Date;
}

export function toSafeUserDto(user: {
  id: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  roles: { role: Role }[];
  createdAt: Date;
}): SafeUserDto {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    roles: user.roles.map((r) => r.role),
    createdAt: user.createdAt,
  };
}
