import { authedFetch, handleAuthed, AuthedApiError } from '@/lib/authed-api';
import type { ApiErrorBody } from '@/features/auth/types';
import type { AdminUser, Role } from './types';

export interface AdminUserSearchParams {
  search?: string;
  role?: Role[];
  status?: AdminUser['status'][];
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'createdAt' | 'email';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

function buildQuery(params: AdminUserSearchParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.createdFrom) qs.set('createdFrom', params.createdFrom);
  if (params.createdTo) qs.set('createdTo', params.createdTo);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
  qs.set('page', String(params.page ?? 1));
  qs.set('limit', String(params.limit ?? 20));
  for (const role of params.role ?? []) qs.append('role', role);
  for (const status of params.status ?? []) qs.append('status', status);
  return qs.toString();
}

/**
 * Unlike every other admin endpoint, the list here IS the top-level `{data,
 * meta}` envelope (not `{data: T}` wrapping a single resource) — handleAuthed's
 * single-field unwrap would silently drop `meta`, so this reads the body directly.
 */
export async function searchUsersPaged(params: AdminUserSearchParams): Promise<{ data: AdminUser[]; meta: PaginationMeta }> {
  const res = await authedFetch(`/admin/users?${buildQuery(params)}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new AuthedApiError(
      body ? (Array.isArray(body.message) ? body.message.join(' ') : body.message) : 'Something went wrong.',
      res.status,
    );
  }
  return (await res.json()) as { data: AdminUser[]; meta: PaginationMeta };
}

export function updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string): Promise<AdminUser> {
  return authedFetch(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }).then(
    (res) => handleAuthed<AdminUser>(res),
  );
}
