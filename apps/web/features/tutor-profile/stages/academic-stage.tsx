'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTutorProfile, updateTutorProfile } from '@/features/tutor-profile/api';
import type { ReferenceItem } from '@/features/marketplace/types';
import type { TutorProfile } from '@/features/tutor-profile/types';

const ACADEMIC_STATUS_OPTIONS = [
  { id: 'CURRENT_STUDENT', name: 'Current student' },
  { id: 'GRADUATED', name: 'Graduated' },
  { id: 'OTHER', name: 'Other' },
] as const;

const academicSchema = z.object({
  universityId: z.string().min(1, 'Choose your university.'),
  fullName: z.string().trim().min(2, 'Enter your full name.').max(150),
  department: z.string().trim().min(1, 'Enter your department.').max(100),
  degreeProgram: z.string().trim().min(1, 'Enter your degree program, e.g. BSc.').max(100),
  academicStatus: z.enum(['CURRENT_STUDENT', 'GRADUATED', 'OTHER']),
  academicYear: z.string().trim().max(50).optional(),
});

type AcademicFormValues = z.infer<typeof academicSchema>;

export function AcademicStage({
  profile,
  universities,
  onSaved,
}: {
  profile: TutorProfile | null;
  universities: ReferenceItem[];
  onSaved: (profile: TutorProfile) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcademicFormValues>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      universityId: profile?.university.id ?? '',
      fullName: profile?.fullName ?? '',
      department: profile?.department ?? '',
      degreeProgram: profile?.degreeProgram ?? '',
      academicStatus: profile?.academicStatus ?? 'CURRENT_STUDENT',
      academicYear: profile?.academicYear ?? undefined,
    },
  });

  const onSubmit = async (values: AcademicFormValues) => {
    setFormError(null);
    try {
      const saved = profile
        ? await updateTutorProfile(values)
        : await createTutorProfile(values);
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your academic background.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="fullName" required>
            Full name
          </FieldLabel>
          <Input
            id="fullName"
            aria-invalid={!!errors.fullName || undefined}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            {...register('fullName')}
          />
          <FieldError id="fullName-error">{errors.fullName?.message}</FieldError>
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="universityId" required>
            University
          </FieldLabel>
          <Controller
            name="universityId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="universityId" aria-invalid={!!errors.universityId || undefined}>
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.universityId?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="department" required>
            Department
          </FieldLabel>
          <Input
            id="department"
            placeholder="e.g. Computer Science"
            aria-invalid={!!errors.department || undefined}
            {...register('department')}
          />
          <FieldError>{errors.department?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="degreeProgram" required>
            Degree program
          </FieldLabel>
          <Input
            id="degreeProgram"
            placeholder="e.g. BSc"
            aria-invalid={!!errors.degreeProgram || undefined}
            {...register('degreeProgram')}
          />
          <FieldError>{errors.degreeProgram?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="academicStatus" required>
            Academic status
          </FieldLabel>
          <Controller
            name="academicStatus"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="academicStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="academicYear">Year (optional)</FieldLabel>
          <Input id="academicYear" placeholder="e.g. 3rd year" {...register('academicYear')} />
        </Field>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </form>
  );
}
