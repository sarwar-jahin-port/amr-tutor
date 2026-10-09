'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { updateTutorProfile } from '@/features/tutor-profile/api';
import type { TutorProfile } from '@/features/tutor-profile/types';

export function RateStage({
  profile,
  onSaved,
}: {
  profile: TutorProfile;
  onSaved: (profile: TutorProfile) => void;
}) {
  const [min, setMin] = useState(profile.preferredFeeMin?.toString() ?? '');
  const [max, setMax] = useState(profile.preferredFeeMax?.toString() ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minValue = min ? Number(min) : undefined;
  const maxValue = max ? Number(max) : undefined;
  const rangeInvalid = minValue !== undefined && maxValue !== undefined && minValue > maxValue;

  const onSubmit = async () => {
    if (rangeInvalid) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const saved = await updateTutorProfile({ preferredFeeMin: minValue, preferredFeeMax: maxValue });
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your expected rate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel>Expected monthly tuition (৳)</FieldLabel>
        <FieldDescription>
          This is a starting point for discussion, not a fixed price — you and the guardian agree on
          the final amount directly.
        </FieldDescription>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum expected monthly tuition"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
          <span className="text-ink-secondary">–</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum expected monthly tuition"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <FieldError>{rangeInvalid ? 'The minimum cannot be greater than the maximum.' : undefined}</FieldError>
      </Field>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button onClick={onSubmit} isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </div>
  );
}
