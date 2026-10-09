'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { updateTutorProfile } from '@/features/tutor-profile/api';
import type { TutorProfile } from '@/features/tutor-profile/types';

const MAX_LENGTH = 1000;

export function ExperienceStage({
  profile,
  onSaved,
}: {
  profile: TutorProfile;
  onSaved: (profile: TutorProfile) => void;
}) {
  const [introduction, setIntroduction] = useState(profile.introduction ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tooLong = introduction.length > MAX_LENGTH;

  const onSubmit = async () => {
    if (tooLong) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const saved = await updateTutorProfile({ introduction: introduction || undefined });
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your teaching approach.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="introduction">Your teaching approach</FieldLabel>
        <Textarea
          id="introduction"
          rows={6}
          placeholder="What should a guardian know about how you teach? e.g. your experience, subjects you focus on, and what you help students improve."
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          aria-invalid={tooLong || undefined}
          aria-describedby="introduction-count"
        />
        <FieldDescription id="introduction-count">
          {introduction.length}/{MAX_LENGTH} characters
        </FieldDescription>
        <FieldError>{tooLong ? 'Keep this under 1,000 characters.' : undefined}</FieldError>
      </Field>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button onClick={onSubmit} isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </div>
  );
}
