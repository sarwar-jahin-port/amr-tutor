'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, CheckboxLabel } from '@/components/ui/checkbox';
import type { ReferenceItem } from '@/features/marketplace/types';
import { replaceCurricula, replaceGrades, replaceSubjects } from '@/features/tutor-profile/api';
import type { TutorProfile } from '@/features/tutor-profile/types';

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function CheckboxGrid({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string;
  options: ReferenceItem[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const id = `${legend}-${option.id}`;
          return (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selected.includes(option.id)}
                onCheckedChange={() => onChange(toggle(selected, option.id))}
              />
              <CheckboxLabel htmlFor={id}>{option.name}</CheckboxLabel>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TeachingStage({
  profile,
  subjects,
  grades,
  curricula,
  onSaved,
}: {
  profile: TutorProfile;
  subjects: ReferenceItem[];
  grades: ReferenceItem[];
  curricula: ReferenceItem[];
  onSaved: (profile: TutorProfile) => void;
}) {
  const [subjectIds, setSubjectIds] = useState<string[]>(profile.subjects.map((s) => s.id));
  const [gradeLevels, setGradeLevels] = useState<string[]>(profile.grades);
  const [curriculumIds, setCurriculumIds] = useState<string[]>(profile.curricula.map((c) => c.id));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      await replaceSubjects(subjectIds);
      await replaceGrades(gradeLevels);
      const saved = await replaceCurricula(curriculumIds);
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your subjects and classes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <CheckboxGrid legend="Subjects you teach" options={subjects} selected={subjectIds} onChange={setSubjectIds} />
      <CheckboxGrid legend="Classes you teach" options={grades} selected={gradeLevels} onChange={setGradeLevels} />
      <CheckboxGrid
        legend="Curricula you're familiar with (optional)"
        options={curricula}
        selected={curriculumIds}
        onChange={setCurriculumIds}
      />

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button onClick={onSubmit} isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </div>
  );
}
