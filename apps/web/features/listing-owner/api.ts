import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { CreateListingInput, ListingDetail, UpdateListingInput } from './types';

export function createListing(input: CreateListingInput): Promise<ListingDetail> {
  return authedFetch('/listings', { method: 'POST', body: JSON.stringify(input) }).then((res) =>
    handleAuthed<ListingDetail>(res),
  );
}

/** The {data, meta} envelope's `data` is already the array — handleAuthed's unwrap is all that's needed. */
export function getMyListings(): Promise<ListingDetail[]> {
  return authedFetch('/users/me/listings?limit=100', { method: 'GET' }).then((res) =>
    handleAuthed<ListingDetail[]>(res),
  );
}

/** Returns null (rather than throwing) when the listing doesn't exist or isn't owned by this account. */
export async function getMyListing(id: string): Promise<ListingDetail | null> {
  const res = await authedFetch(`/users/me/listings/${id}`, { method: 'GET' });
  if (res.status === 404) return null;
  return handleAuthed<ListingDetail>(res);
}

export function updateListing(id: string, input: UpdateListingInput): Promise<ListingDetail> {
  return authedFetch(`/users/me/listings/${id}`, { method: 'PATCH', body: JSON.stringify(input) }).then(
    (res) => handleAuthed<ListingDetail>(res),
  );
}

export function submitListingForReview(id: string): Promise<ListingDetail> {
  return authedFetch(`/users/me/listings/${id}/submit`, { method: 'POST' }).then((res) =>
    handleAuthed<ListingDetail>(res),
  );
}

export function closeListing(id: string): Promise<ListingDetail> {
  return authedFetch(`/users/me/listings/${id}/close`, { method: 'POST' }).then((res) =>
    handleAuthed<ListingDetail>(res),
  );
}
