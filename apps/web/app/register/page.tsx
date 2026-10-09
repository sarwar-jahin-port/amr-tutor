'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, CheckboxLabel } from '@/components/ui/checkbox';
import { Container } from '@/components/ui/container';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input, PasswordInput, PhoneInput } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-context';

const registerSchema = z.object({
  email: z.email('Enter a valid email address.'),
  phone: z
    .string()
    .regex(/^(?:\+?88)?01[3-9]\d{8}$/, 'Enter a valid Bangladesh mobile number.')
    .optional()
    .or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  roles: z.array(z.enum(['TUTOR', 'GUARDIAN'])).min(1, 'Choose at least one role.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const ROLE_OPTIONS = [
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'GUARDIAN', label: 'Guardian looking for a tutor' },
] as const;

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { roles: [] },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      await registerAccount({
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        roles: values.roles,
      });
      router.push('/dashboard');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to register.');
    }
  };

  return (
    <Container as="main" narrow className="flex min-h-screen flex-col justify-center gap-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Create an account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email || undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          <FieldError id="email-error">{errors.email?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
          <PhoneInput
            id="phone"
            aria-invalid={!!errors.phone || undefined}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            {...register('phone')}
          />
          <FieldError id="phone-error">{errors.phone?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password || undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <FieldError id="password-error">{errors.password?.message}</FieldError>
        </Field>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-ink">I am a…</legend>
          <Controller
            name="roles"
            control={control}
            render={({ field }) => (
              <>
                {ROLE_OPTIONS.map((role) => {
                  const id = `role-${role.value.toLowerCase()}`;
                  const checked = field.value.includes(role.value);
                  return (
                    <div key={role.value} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(next) => {
                          field.onChange(
                            next
                              ? [...field.value, role.value]
                              : field.value.filter((r) => r !== role.value),
                          );
                        }}
                      />
                      <CheckboxLabel htmlFor={id}>{role.label}</CheckboxLabel>
                    </div>
                  );
                })}
              </>
            )}
          />
          <FieldError>{errors.roles?.message}</FieldError>
        </fieldset>

        {formError && <Alert variant="danger">{formError}</Alert>}

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Register'}
        </Button>
      </form>

      <p className="text-sm text-ink-secondary">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </Container>
  );
}
