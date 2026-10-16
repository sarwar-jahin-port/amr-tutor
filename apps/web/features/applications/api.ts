import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type { ApplicationDetail, OwnerSettableStatus } from './types';

export function applyToListing(listingId: string, introduction?: string): Promise<ApplicationDetail> {
  return authedFetch(`/listings/${listingId}/applications`, {
    method: 'POST',
    body: JSON.stringify({ introduction }),
  }).then((res) => handleAuthed<ApplicationDetail>(res));
}

/** The {data, meta} envelope's `data` is already the array — handleAuthed's unwrap is all that's needed. */
export function getMyApplications(): Promise<ApplicationDetail[]> {
  return authedFetch('/users/me/applications?limit=100').then((res) =>
    handleAuthed<ApplicationDetail[]>(res),
  );
}

export function withdrawApplication(id: string): Promise<ApplicationDetail> {
  return authedFetch(`/applications/${id}/withdraw`, { method: 'PATCH' }).then((res) =>
    handleAuthed<ApplicationDetail>(res),
  );
}

export function getListingApplicants(listingId: string): Promise<ApplicationDetail[]> {
  return authedFetch(`/listings/${listingId}/applications?limit=100`).then((res) =>
    handleAuthed<ApplicationDetail[]>(res),
  );
}

export function updateApplicationStatus(
  id: string,
  status: OwnerSettableStatus,
): Promise<ApplicationDetail> {
  return authedFetch(`/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }).then((res) => handleAuthed<ApplicationDetail>(res));
}
