import type { Division, ReferenceItem } from './types';
import { BudgetFilter } from './budget-filter';
import { TEACHING_MODE_OPTIONS } from './format';
import { SelectFilter } from './select-filter';
import { TextFilter } from './text-filter';

const DAYS_PER_WEEK_OPTIONS: ReferenceItem[] = Array.from({ length: 7 }, (_, i) => ({
  id: String(i + 1),
  name: `${i + 1} day${i === 0 ? '' : 's'} per week`,
}));

export interface ListingFilterOptions {
  subjects: ReferenceItem[];
  grades: ReferenceItem[];
  curricula: ReferenceItem[];
  universities: ReferenceItem[];
  divisions: Division[];
}

export function ListingFilters({ subjects, grades, curricula, universities, divisions }: ListingFilterOptions) {
  const districts = divisions.flatMap((division) => division.districts);

  return (
    <>
      <SelectFilter paramKey="city" label="District" placeholder="Any district" options={districts} />
      <TextFilter paramKey="area" label="Area" placeholder="e.g. Dhanmondi" />
      <SelectFilter paramKey="subjectId" label="Subject" placeholder="Any subject" options={subjects} />
      <SelectFilter paramKey="classLevel" label="Class / grade" placeholder="Any class" options={grades} />
      <BudgetFilter />
      <SelectFilter paramKey="curriculumId" label="Curriculum" placeholder="Any curriculum" options={curricula} />
      <SelectFilter
        paramKey="universityId"
        label="Preferred university"
        placeholder="Any university"
        options={universities}
      />
      <SelectFilter
        paramKey="teachingMode"
        label="Teaching mode"
        placeholder="Any mode"
        options={TEACHING_MODE_OPTIONS}
      />
      <SelectFilter
        paramKey="daysPerWeek"
        label="Days per week"
        placeholder="Any"
        options={DAYS_PER_WEEK_OPTIONS}
      />
    </>
  );
}
