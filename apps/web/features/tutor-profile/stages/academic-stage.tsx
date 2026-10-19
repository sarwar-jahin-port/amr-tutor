'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTutorProfile, updateTutorProfile } from '@/features/tutor-profile/api';
import { getOwnEducationRecords, upsertEducationRecord } from '@/features/tutor-profile/education-api';
import type { EducationRecord } from '@/features/tutor-profile/education-types';
import type { ReferenceItem } from '@/features/marketplace/types';
import type { TutorProfile } from '@/features/tutor-profile/types';
import { CertificateUploader } from './certificate-uploader';
import { ProfilePhotoUpload } from './profile-photo-upload';

const ACADEMIC_STATUS_OPTIONS = [
  { id: 'CURRENT_STUDENT', name: 'Current student' },
  { id: 'GRADUATED', name: 'Graduated' },
  { id: 'OTHER', name: 'Other' },
] as const;

const academicSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(150),
  sscInstitution: z.string().trim().min(1, 'Enter your SSC (or equivalent) institution.').max(150),
  sscGpa: z.string().trim().max(20).optional(),
  hscInstitution: z.string().trim().min(1, 'Enter your HSC (or equivalent) institution.').max(150),
  hscGpa: z.string().trim().max(20).optional(),
  universityId: z.string().min(1, 'Choose your university.'),
  department: z.string().trim().min(1, 'Enter your department.').max(100),
  degreeProgram: z.string().trim().min(1, 'Enter your degree program, e.g. BSc.').max(100),
  academicStatus: z.enum(['CURRENT_STUDENT', 'GRADUATED', 'OTHER']),
  academicYear: z.string().trim().max(50).optional(),
});

type AcademicFormValues = z.infer<typeof academicSchema>;

function findRecord(records: EducationRecord[], level: EducationRecord['level']): EducationRecord | undefined {
  return records.find((r) => r.level === level);
}

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
  const [savedProfile, setSavedProfile] = useState<TutorProfile | null>(profile);
  const [records, setRecords] = useState<EducationRecord[] | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AcademicFormValues>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      fullName: profile?.fullName ?? '',
      sscInstitution: '',
      sscGpa: '',
      hscInstitution: '',
      hscGpa: '',
      universityId: profile?.university.id ?? '',
      department: profile?.department ?? '',
      degreeProgram: profile?.degreeProgram ?? '',
      academicStatus: profile?.academicStatus ?? 'CURRENT_STUDENT',
      academicYear: profile?.academicYear ?? '',
    },
  });

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    getOwnEducationRecords().then((rows) => {
      if (cancelled) return;
      setRecords(rows);
      const ssc = findRecord(rows, 'SSC');
      const hsc = findRecord(rows, 'HSC');
      reset((current) => ({
        ...current,
        sscInstitution: ssc?.institution ?? '',
        sscGpa: ssc?.gpa ?? '',
        hscInstitution: hsc?.institution ?? '',
        hscGpa: hsc?.gpa ?? '',
      }));
    });
    return () => {
      cancelled = true;
    };
    // Only on mount — once loaded, the form itself is the single source of truth until the next save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ssc = records ? findRecord(records, 'SSC') : undefined;
  const hsc = records ? findRecord(records, 'HSC') : undefined;
  const university = records ? findRecord(records, 'UNIVERSITY') : undefined;

  function updateRecord(updated: EducationRecord) {
    setRecords((r) => {
      if (!r) return [updated];
      return r.some((x) => x.level === updated.level) ? r.map((x) => (x.level === updated.level ? updated : x)) : [...r, updated];
    });
  }

  /** Lets the certificate uploader save whatever SSC/HSC institution/GPA is currently typed, without requiring the page's main Save button first. */
  function ensureRecordFor(level: 'SSC' | 'HSC'): () => Promise<EducationRecord> {
    return async () => {
      if (!savedProfile) {
        throw new Error('Save your academic background below before uploading a certificate.');
      }
      const institution = getValues(level === 'SSC' ? 'sscInstitution' : 'hscInstitution').trim();
      const gpa = getValues(level === 'SSC' ? 'sscGpa' : 'hscGpa');
      if (!institution) {
        throw new Error(`Enter your ${level} institution before uploading a certificate.`);
      }
      return upsertEducationRecord(level, { institution, gpa: gpa?.trim() || undefined });
    };
  }

  const onSubmit = async (values: AcademicFormValues) => {
    setFormError(null);
    try {
      const profileInput = {
        universityId: values.universityId,
        fullName: values.fullName,
        department: values.department,
        degreeProgram: values.degreeProgram,
        academicStatus: values.academicStatus,
        academicYear: values.academicYear,
      };
      const saved = savedProfile ? await updateTutorProfile(profileInput) : await createTutorProfile(profileInput);

      // SSC before HSC — the backend rejects HSC without an SSC record already in place.
      await upsertEducationRecord('SSC', { institution: values.sscInstitution, gpa: values.sscGpa || undefined });
      await upsertEducationRecord('HSC', { institution: values.hscInstitution, gpa: values.hscGpa || undefined });

      setSavedProfile(saved);
      onSaved(saved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your academic background.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {savedProfile && (
        <ProfilePhotoUpload
          fullName={savedProfile.fullName}
          photoUrl={savedProfile.profilePhotoUrl ?? null}
          onUploaded={(previewUrl) => setSavedProfile((p) => (p ? { ...p, profilePhotoUrl: previewUrl } : p))}
        />
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-ink">About you</legend>
        <Field>
          <FieldLabel htmlFor="fullName" required>
            Full name
          </FieldLabel>
          <Input id="fullName" aria-invalid={!!errors.fullName || undefined} {...register('fullName')} />
          <FieldError>{errors.fullName?.message}</FieldError>
        </Field>
      </fieldset>

      <div className="flex flex-col gap-3">
        <div>
          <p className="font-semibold text-ink">Academic history</p>
          <p className="text-sm text-ink-secondary">
            Uploading a certificate is optional. If you add one, an admin will review it — once approved, that
            level gets a verified badge on your profile.
          </p>
        </div>

        <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <legend className="text-sm font-semibold text-ink">SSC (or equivalent)</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="sscInstitution" required>
                Institution
              </FieldLabel>
              <Input id="sscInstitution" aria-invalid={!!errors.sscInstitution || undefined} {...register('sscInstitution')} />
              <FieldError>{errors.sscInstitution?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="sscGpa">GPA (optional)</FieldLabel>
              <Input id="sscGpa" placeholder="e.g. 5.00" {...register('sscGpa')} />
            </Field>
          </div>
          <CertificateUploader record={ssc} onChanged={updateRecord} ensureRecord={ensureRecordFor('SSC')} />
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <legend className="text-sm font-semibold text-ink">HSC (or equivalent)</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="hscInstitution" required>
                Institution
              </FieldLabel>
              <Input id="hscInstitution" aria-invalid={!!errors.hscInstitution || undefined} {...register('hscInstitution')} />
              <FieldError>{errors.hscInstitution?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="hscGpa">GPA (optional)</FieldLabel>
              <Input id="hscGpa" placeholder="e.g. 5.00" {...register('hscGpa')} />
            </Field>
          </div>
          <CertificateUploader record={hsc} onChanged={updateRecord} ensureRecord={ensureRecordFor('HSC')} />
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <legend className="text-sm font-semibold text-ink">University</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="universityId" required>
                University
              </FieldLabel>
              <Controller
                name="universityId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    id="universityId"
                    options={universities}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search for your university"
                    ariaInvalid={!!errors.universityId}
                  />
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
          {university && (
            <CertificateUploader record={university} onChanged={updateRecord} label="Certificate or student ID" />
          )}
        </fieldset>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Save and continue
      </Button>
    </form>
  );
}
