'use client';

import { BookOpen, Building2, FileText, GraduationCap, MapPin, UserCheck } from 'lucide-react';
import type { Division, ReferenceItem } from './types';
import { SelectFilter } from './select-filter';
import { TextFilter } from './text-filter';

const ACADEMIC_STATUS_OPTIONS: ReferenceItem[] = [
  { id: 'CURRENT_STUDENT', name: 'Current student' },
  { id: 'GRADUATED', name: 'Graduated' },
  { id: 'OTHER', name: 'Other' },
];

export interface TutorFilterOptions {
  subjects: ReferenceItem[];
  grades: ReferenceItem[];
  curricula: ReferenceItem[];
  universities: ReferenceItem[];
  divisions: Division[];
}

export function TutorFilters({ subjects, grades, curricula, universities, divisions }: TutorFilterOptions) {
  const districts = divisions.flatMap((division) => division.districts);

  return (
    <>
      <SelectFilter paramKey="subjectId" label="Subject" icon={BookOpen} placeholder="Any subject" options={subjects} />
      <SelectFilter
        paramKey="gradeLevel"
        label="Class / grade"
        icon={GraduationCap}
        placeholder="Any class"
        options={grades}
      />
      <SelectFilter
        paramKey="academicStatus"
        label="Academic status"
        icon={UserCheck}
        placeholder="Any status"
        options={ACADEMIC_STATUS_OPTIONS}
      />
      <SelectFilter
        paramKey="curriculumId"
        label="Curriculum"
        icon={FileText}
        placeholder="Any curriculum"
        options={curricula}
      />
      <SelectFilter
        paramKey="universityId"
        label="University"
        icon={Building2}
        placeholder="Any university"
        options={universities}
      />
      <SelectFilter paramKey="city" label="District" icon={MapPin} placeholder="Any district" options={districts} />
      <TextFilter paramKey="area" label="Area" icon={MapPin} placeholder="e.g. Dhanmondi" />
    </>
  );
}
