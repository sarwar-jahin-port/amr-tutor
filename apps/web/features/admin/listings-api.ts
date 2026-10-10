import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { ListingDetail } from '@/features/listing-owner/types';

export function getListingQueue(status = 'PENDING_REVIEW'): Promise<ListingDetail[]> {
  return authedFetch(`/admin/listings?status=${status}&limit=50`).then((res) => handleAuthed<ListingDetail[]>(res));
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
