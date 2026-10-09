import { authedFetch, handleAuthed } from '@/lib/authed-api';
import type {
  AvailabilitySlotInput,
  CreateTutorProfileInput,
  LocationInput,
  TutorProfile,
  UpdateTutorProfileInput,
} from './types';

export function createTutorProfile(input: CreateTutorProfileInput): Promise<TutorProfile> {
  return authedFetch('/tutors/me/profile', { method: 'POST', body: JSON.stringify(input) }).then(
    (res) => handleAuthed<TutorProfile>(res),
  );
}

/** Returns null when no profile has been created yet, rather than throwing. */
export async function getOwnTutorProfile(): Promise<TutorProfile | null> {
  const res = await authedFetch('/tutors/me/profile', { method: 'GET' });
  if (res.status === 404) return null;
  return handleAuthed<TutorProfile>(res);
}

export function updateTutorProfile(input: UpdateTutorProfileInput): Promise<TutorProfile> {
  return authedFetch('/tutors/me/profile', { method: 'PATCH', body: JSON.stringify(input) }).then(
    (res) => handleAuthed<TutorProfile>(res),
  );
}

export function replaceSubjects(subjectIds: string[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/subjects', { method: 'PUT', body: JSON.stringify({ subjectIds }) }).then(
    (res) => handleAuthed<TutorProfile>(res),
  );
}

export function replaceGrades(gradeLevels: string[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/grades', { method: 'PUT', body: JSON.stringify({ gradeLevels }) }).then(
    (res) => handleAuthed<TutorProfile>(res),
  );
}

export function replaceCurricula(curriculumIds: string[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/curricula', {
    method: 'PUT',
    body: JSON.stringify({ curriculumIds }),
  }).then((res) => handleAuthed<TutorProfile>(res));
}

export function replaceLocations(locations: LocationInput[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/locations', { method: 'PUT', body: JSON.stringify({ locations }) }).then(
    (res) => handleAuthed<TutorProfile>(res),
  );
}

export function replaceAvailability(slots: AvailabilitySlotInput[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/availability', { method: 'PUT', body: JSON.stringify({ slots }) }).then(
    (res) => handleAuthed<TutorProfile>(res),
  );
}
