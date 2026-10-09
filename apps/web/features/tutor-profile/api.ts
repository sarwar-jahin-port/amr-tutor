import { getAccessToken } from '@/features/auth/auth-context';
import { env } from '@/lib/env';
import type { ApiErrorBody } from '@/features/auth/types';
import type {
  AvailabilitySlotInput,
  CreateTutorProfileInput,
  LocationInput,
  TutorProfile,
  UpdateTutorProfileInput,
} from './types';

export class TutorProfileApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'TutorProfileApiError';
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return Array.isArray(body.message) ? body.message.join(' ') : body.message;
  } catch {
    return 'Something went wrong. Please try again.';
  }
}

async function authedFetch(path: string, init: RequestInit): Promise<Response> {
  const token = getAccessToken();
  if (!token) {
    throw new TutorProfileApiError('You need to be signed in to do this.', 401);
  }

  return fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new TutorProfileApiError(await parseErrorMessage(response), response.status);
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

export function createTutorProfile(input: CreateTutorProfileInput): Promise<TutorProfile> {
  return authedFetch('/tutors/me/profile', { method: 'POST', body: JSON.stringify(input) }).then(
    (res) => handle<TutorProfile>(res),
  );
}

/** Returns null when no profile has been created yet, rather than throwing. */
export async function getOwnTutorProfile(): Promise<TutorProfile | null> {
  const res = await authedFetch('/tutors/me/profile', { method: 'GET' });
  if (res.status === 404) return null;
  return handle<TutorProfile>(res);
}

export function updateTutorProfile(input: UpdateTutorProfileInput): Promise<TutorProfile> {
  return authedFetch('/tutors/me/profile', { method: 'PATCH', body: JSON.stringify(input) }).then(
    (res) => handle<TutorProfile>(res),
  );
}

export function replaceSubjects(subjectIds: string[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/subjects', { method: 'PUT', body: JSON.stringify({ subjectIds }) }).then(
    (res) => handle<TutorProfile>(res),
  );
}

export function replaceGrades(gradeLevels: string[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/grades', { method: 'PUT', body: JSON.stringify({ gradeLevels }) }).then(
    (res) => handle<TutorProfile>(res),
  );
}

export function replaceCurricula(curriculumIds: string[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/curricula', {
    method: 'PUT',
    body: JSON.stringify({ curriculumIds }),
  }).then((res) => handle<TutorProfile>(res));
}

export function replaceLocations(locations: LocationInput[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/locations', { method: 'PUT', body: JSON.stringify({ locations }) }).then(
    (res) => handle<TutorProfile>(res),
  );
}

export function replaceAvailability(slots: AvailabilitySlotInput[]): Promise<TutorProfile> {
  return authedFetch('/tutors/me/availability', { method: 'PUT', body: JSON.stringify({ slots }) }).then(
    (res) => handle<TutorProfile>(res),
  );
}
