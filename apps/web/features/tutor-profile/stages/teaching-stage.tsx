'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TagMultiSelect } from '@/components/tag-multi-select';
import type { ReferenceItem } from '@/features/marketplace/types';
import { replaceCurricula, replaceGrades, replaceSubjects } from '@/features/tutor-profile/api';
import type { TutorProfile } from '@/features/tutor-profile/types';

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
      <TagMultiSelect
        legend="Subjects you teach"
        options={subjects}
        selected={subjectIds}
        onChange={setSubjectIds}
        placeholder="Search subjects…"
      />
      <TagMultiSelect
        legend="Classes you teach"
        options={grades}
        selected={gradeLevels}
        onChange={setGradeLevels}
        placeholder="Search classes…"
      />
      <TagMultiSelect
        legend="Curricula you're familiar with (optional)"
        options={curricula}
        selected={curriculumIds}
        onChange={setCurriculumIds}
        placeholder="Search curricula…"
      />

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button onClick={onSubmit} isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </div>
  );
}
