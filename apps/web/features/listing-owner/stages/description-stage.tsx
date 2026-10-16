'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateListing } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';

const DESCRIPTION_MAX = 3000;
const LOCATION_MAX = 200;

export function DescriptionStage({
  listing,
  onSaved,
}: {
  listing: ListingDetail;
  onSaved: (listing: ListingDetail) => void;
}) {
  const [description, setDescription] = useState(listing.description ?? '');
  const [neighborhood, setNeighborhood] = useState(listing.neighborhood ?? '');
  const [locationDescription, setLocationDescription] = useState(listing.locationDescription ?? '');
  const [startDate, setStartDate] = useState(listing.startDate?.slice(0, 10) ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const descriptionTooLong = description.length > DESCRIPTION_MAX;
  const locationTooLong = locationDescription.length > LOCATION_MAX;

  const onSubmit = async () => {
    if (descriptionTooLong || locationTooLong) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const saved = await updateListing(listing.id, {
        description: description || undefined,
        neighborhood: neighborhood || undefined,
        locationDescription: locationDescription || undefined,
        startDate: startDate || undefined,
      });
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save this information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="description">What should the tutor help with?</FieldLabel>
        <Textarea
          id="description"
          rows={6}
          placeholder="e.g. My son needs help building confidence in algebra and geometry ahead of his final exams."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={descriptionTooLong || undefined}
        />
        <FieldDescription>
          {description.length}/{DESCRIPTION_MAX} characters
        </FieldDescription>
        <FieldError>{descriptionTooLong ? 'Keep this under 3,000 characters.' : undefined}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="neighborhood">Neighborhood (optional)</FieldLabel>
        <Input id="neighborhood" placeholder="e.g. Road 7" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel htmlFor="locationDescription">Finding the place (optional)</FieldLabel>
        <Input
          id="locationDescription"
          placeholder="e.g. Near the main market"
          value={locationDescription}
          onChange={(e) => setLocationDescription(e.target.value)}
          aria-invalid={locationTooLong || undefined}
        />
        <FieldDescription>
          Don&apos;t enter your full home address here — this is shown publicly.
        </FieldDescription>
        <FieldError>{locationTooLong ? 'Keep this under 200 characters.' : undefined}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="startDate">Preferred start date (optional)</FieldLabel>
        <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Field>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button onClick={onSubmit} isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </div>
  );
}
