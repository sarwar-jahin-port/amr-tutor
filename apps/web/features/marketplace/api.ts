import { env } from '@/lib/env';
import type {
  Division,
  ListingDetail,
  ListingSummary,
  PaginatedResponse,
  ReferenceItem,
  TutorProfile,
  TutorSummary,
} from './types';

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Reference data changes rarely — cache briefly instead of hitting the API on every render. */
async function fetchReferenceList(path: string, search?: string): Promise<ReferenceItem[]> {
  try {
    const res = await fetch(`${env.apiUrl}${path}${toQueryString({ search, limit: 100 })}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as PaginatedResponse<ReferenceItem>;
    return body.data;
  } catch {
    return [];
  }
}

export const getUniversities = (search?: string) => fetchReferenceList('/references/universities', search);
export const getSubjects = (search?: string) => fetchReferenceList('/references/subjects', search);
export const getCurricula = (search?: string) => fetchReferenceList('/references/curricula', search);
export const getGrades = (search?: string) => fetchReferenceList('/references/grades', search);

export async function getLocations(): Promise<Division[]> {
  try {
    const res = await fetch(`${env.apiUrl}/references/locations`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: Division[] };
    return body.data;
  } catch {
    return [];
  }
}

export interface TutorSearchParams {
  subjectId?: string;
  universityId?: string;
  curriculumId?: string;
  gradeLevel?: string;
  city?: string;
  area?: string;
  academicStatus?: string;
  page?: number;
}

export interface ListingSearchParams {
  city?: string;
  area?: string;
  subjectId?: string;
  classLevel?: string;
  curriculumId?: string;
  universityId?: string;
  salaryMin?: number;
  salaryMax?: number;
  daysPerWeek?: number;
  teachingMode?: string;
  sort?: string;
  page?: number;
}

export type SearchResult<T> =
  | { status: 'ok'; data: T[]; meta: PaginatedResponse<T>['meta'] }
  | { status: 'error' };

export type DetailResult<T> = { status: 'ok'; data: T } | { status: 'not-found' } | { status: 'error' };

export async function searchTutors(params: TutorSearchParams): Promise<SearchResult<TutorSummary>> {
  try {
    const res = await fetch(`${env.apiUrl}/tutors${toQueryString({ ...params })}`, { cache: 'no-store' });
    if (!res.ok) return { status: 'error' };
    const body = (await res.json()) as PaginatedResponse<TutorSummary>;
    return { status: 'ok', data: body.data, meta: body.meta };
  } catch {
    return { status: 'error' };
  }
}

export async function getTutor(id: string): Promise<DetailResult<TutorProfile>> {
  try {
    const res = await fetch(`${env.apiUrl}/tutors/${id}`, { cache: 'no-store' });
    if (res.status === 404) return { status: 'not-found' };
    if (!res.ok) return { status: 'error' };
    const body = (await res.json()) as { data: TutorProfile };
    return { status: 'ok', data: body.data };
  } catch {
    return { status: 'error' };
  }
}

export async function searchListings(
  params: ListingSearchParams,
): Promise<SearchResult<ListingSummary>> {
  try {
    const res = await fetch(`${env.apiUrl}/listings${toQueryString({ ...params })}`, { cache: 'no-store' });
    if (!res.ok) return { status: 'error' };
    const body = (await res.json()) as PaginatedResponse<ListingSummary>;
    return { status: 'ok', data: body.data, meta: body.meta };
  } catch {
    return { status: 'error' };
  }
}

export async function getListing(id: string): Promise<DetailResult<ListingDetail>> {
  try {
    const res = await fetch(`${env.apiUrl}/listings/${id}`, { cache: 'no-store' });
    if (res.status === 404) return { status: 'not-found' };
    if (!res.ok) return { status: 'error' };
    const body = (await res.json()) as { data: ListingDetail };
    return { status: 'ok', data: body.data };
  } catch {
    return { status: 'error' };
  }
}
