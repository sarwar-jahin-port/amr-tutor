import { authedFetch, handleAuthed, AuthedApiError } from '@/lib/authed-api';
import type { ListingDetail } from '@/features/listing-owner/types';
import type { ApiErrorBody } from '@/features/auth/types';

export async function getListingQueue(params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: ListingDetail[]; meta: { total: number; page: number; limit: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);

  const response = await authedFetch(`/admin/listings?${searchParams.toString()}`);
  if (!response.ok) {
    let message = 'Something went wrong';
    try {
       const body = (await response.json()) as ApiErrorBody;
       message = Array.isArray(body.message) ? body.message.join(' ') : body.message;
    } catch {}
    throw new AuthedApiError(message, response.status);
  }
  
  return response.json();
}

export function updateListingModerationStatus(
  id: string,
  status: 'PUBLISHED' | 'REJECTED' | 'PAUSED',
  reason?: string,
): Promise<ListingDetail> {
  return authedFetch(`/admin/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }).then(
    (res) => handleAuthed<ListingDetail>(res),
  );
}
