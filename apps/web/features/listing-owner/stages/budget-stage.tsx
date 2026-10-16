'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TagMultiSelect } from '@/components/tag-multi-select';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReferenceItem } from '@/features/marketplace/types';
import { updateListing } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';

const GENDER_OPTIONS: ReferenceItem[] = [
  { id: 'NO_PREFERENCE', name: 'No preference' },
  { id: 'MALE', name: 'Male tutor' },
  { id: 'FEMALE', name: 'Female tutor' },
];

export function BudgetStage({
  listing,
  curricula,
  universities,
  onSaved,
}: {
  listing: ListingDetail;
  curricula: ReferenceItem[];
  universities: ReferenceItem[];
  onSaved: (listing: ListingDetail) => void;
}) {
  const [min, setMin] = useState(listing.salaryMin?.toString() ?? '');
  const [max, setMax] = useState(listing.salaryMax?.toString() ?? '');
  const [preferredGender, setPreferredGender] = useState(listing.preferredGender ?? 'NO_PREFERENCE');
  const [curriculumId, setCurriculumId] = useState(listing.curriculum?.id ?? '');
  const [universityIds, setUniversityIds] = useState<string[]>(
    listing.universityPreferences.map((u) => u.id),
  );
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
      const saved = await updateListing(listing.id, {
        salaryMin: minValue,
        salaryMax: maxValue,
        preferredGender: preferredGender as 'NO_PREFERENCE' | 'MALE' | 'FEMALE',
        curriculumId: curriculumId || undefined,
        universityPreferenceIds: universityIds,
      });
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your budget and preferences.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel>Monthly budget (৳)</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum monthly budget"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
          <span className="text-ink-secondary">–</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum monthly budget"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <FieldError>{rangeInvalid ? 'The minimum cannot be greater than the maximum.' : undefined}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="preferredGender">Tutor preference</FieldLabel>
        <Select value={preferredGender} onValueChange={setPreferredGender}>
          <SelectTrigger id="preferredGender">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>A preference, not a requirement — it won&apos;t filter out applicants.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="curriculumId">Curriculum (optional)</FieldLabel>
        <Select value={curriculumId} onValueChange={setCurriculumId}>
          <SelectTrigger id="curriculumId">
            <SelectValue placeholder="Any curriculum" />
          </SelectTrigger>
          <SelectContent>
            {curricula.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <TagMultiSelect
        legend="Preferred university (optional)"
        options={universities}
        selected={universityIds}
        onChange={setUniversityIds}
        placeholder="Search universities…"
      />

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button onClick={onSubmit} isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </div>
  );
}
