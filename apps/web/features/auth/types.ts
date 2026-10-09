export type Role = 'TUTOR' | 'GUARDIAN' | 'VERIFIER' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED';

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  roles: Role[];
  createdAt: string;
}

export interface LoginResponseData {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}
