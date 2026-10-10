'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { createGuardianProfile, getOwnGuardianProfile, updateGuardianProfile } from '@/features/guardian-profile/api';
import type { GuardianProfile } from '@/features/guardian-profile/types';

const schema = z.object({
  displayName: z.string().trim().min(2, 'Enter your name.').max(100),
});

type FormValues = z.infer<typeof schema>;

export default function GuardianOnboardingPage() {
  const { status } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<GuardianProfile | null | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    getOwnGuardianProfile().then((existing) => {
      if (cancelled) return;
      setProfile(existing);
      if (existing) reset({ displayName: existing.displayName });
    });
    return () => {
      cancelled = true;
    };
  }, [status, reset]);

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      const saved = profile
        ? await updateGuardianProfile(values)
        : await createGuardianProfile(values);
      setProfile(saved);
      router.push('/listings/new');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your profile.');
    }
  };

  if (status === 'loading' || profile === undefined) {
    return (
      <Container as="main" narrow className="flex min-h-screen flex-col gap-4 py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </Container>
    );
  }

  if (status !== 'authenticated') return null;

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {profile ? 'Your guardian profile' : 'Set up your guardian profile'}
          </h1>
          <p className="text-ink-secondary">
            Tutors will see this name on your tuition listings. We need this before you can publish
            one.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <Field>
            <FieldLabel htmlFor="displayName" required>
              Your name
            </FieldLabel>
            <Input
              id="displayName"
              defaultValue={profile?.displayName}
              aria-invalid={!!errors.displayName || undefined}
              aria-describedby={errors.displayName ? 'displayName-error' : undefined}
              {...register('displayName')}
            />
            <FieldError id="displayName-error">{errors.displayName?.message}</FieldError>
          </Field>

          {formError && <Alert variant="danger">{formError}</Alert>}

          <Button type="submit" isLoading={isSubmitting} className="self-start">
            {profile ? 'Save and continue' : 'Create profile and continue'}
          </Button>
        </form>
      </Container>
    </>
  );
}
