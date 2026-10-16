'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TagMultiSelect } from '@/components/tag-multi-select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Division, ReferenceItem } from '@/features/marketplace/types';
import { createListing, updateListing } from '@/features/listing-owner/api';
import type { ListingDetail } from '@/features/listing-owner/types';

const schema = z.object({
  title: z.string().trim().min(5, 'Use at least 5 characters.').max(150),
  classLevel: z.string().min(1, 'Choose a class.'),
  city: z.string().min(1, 'Choose a district.'),
  area: z.string().trim().min(1, 'Enter an area.').max(100),
  daysPerWeek: z.string().min(1, 'Choose how many days per week.'),
});

type FormValues = z.infer<typeof schema>;

export function BasicsStage({
  listing,
  subjects,
  grades,
  divisions,
  onSaved,
}: {
  listing: ListingDetail | null;
  subjects: ReferenceItem[];
  grades: ReferenceItem[];
  divisions: Division[];
  onSaved: (listing: ListingDetail) => void;
}) {
  const districts = divisions.flatMap((d) => d.districts);
  const [subjectIds, setSubjectIds] = useState<string[]>(listing?.subjects.map((s) => s.id) ?? []);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: listing?.title ?? '',
      classLevel: listing?.classLevel ?? '',
      city: listing?.city ?? '',
      area: listing?.area ?? '',
      daysPerWeek: listing?.daysPerWeek ? String(listing.daysPerWeek) : '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    if (subjectIds.length === 0) {
      setSubjectsError('Choose at least one subject.');
      return;
    }
    setSubjectsError(null);

    try {
      const payload = {
        title: values.title,
        classLevel: values.classLevel,
        subjectIds,
        city: values.city,
        area: values.area,
        daysPerWeek: Number(values.daysPerWeek),
      };
      const saved = listing ? await updateListing(listing.id, payload) : await createListing(payload);
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save these details.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <Field>
        <FieldLabel htmlFor="title" required>
          Short title
        </FieldLabel>
        <Input id="title" placeholder="e.g. Mathematics tutor for Class 9" {...register('title')} />
        <FieldError>{errors.title?.message}</FieldError>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="classLevel" required>
            Class / grade
          </FieldLabel>
          <Controller
            name="classLevel"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="classLevel">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.classLevel?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="daysPerWeek" required>
            Days per week
          </FieldLabel>
          <Controller
            name="daysPerWeek"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="daysPerWeek">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} day{n === 1 ? '' : 's'} per week
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.daysPerWeek?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="city" required>
            District
          </FieldLabel>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="city">
                  <SelectValue placeholder="Select a district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.city?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="area" required>
            Area
          </FieldLabel>
          <Input id="area" placeholder="e.g. Dhanmondi" {...register('area')} />
          <FieldError>{errors.area?.message}</FieldError>
        </Field>
      </div>

      <TagMultiSelect
        legend="Subjects"
        options={subjects}
        selected={subjectIds}
        onChange={setSubjectIds}
        placeholder="Search subjects…"
      />
      {subjectsError && <p className="text-sm text-danger">{subjectsError}</p>}

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </form>
  );
}
