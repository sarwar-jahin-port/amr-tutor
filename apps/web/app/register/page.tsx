'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-700">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium text-stone-700">
            Phone (optional)
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="01712345678"
            className="rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            {...register('phone')}
          />
          {errors.phone && <p className="text-sm text-red-700">{errors.phone.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-stone-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-red-700">{errors.password.message}</p>}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-stone-700">I am a…</legend>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" value="TUTOR" {...register('roles')} />
            Tutor
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" value="GUARDIAN" {...register('roles')} />
            Guardian looking for a tutor
          </label>
          {errors.roles && <p className="text-sm text-red-700">{errors.roles.message}</p>}
        </fieldset>

        {formError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <p className="text-sm text-stone-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
