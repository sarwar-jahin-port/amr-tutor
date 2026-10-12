'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, CheckboxLabel } from '@/components/ui/checkbox';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { completeGoogleSignupRequest } from '@/features/auth/api';

const ROLE_OPTIONS = [
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'GUARDIAN', label: 'Guardian looking for a tutor' },
] as const;

export default function CompleteGoogleSignupPage() {
  const router = useRouter();
  const { setAuthenticatedSession } = useAuth();
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<('TUTOR' | 'GUARDIAN')[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const token = new URLSearchParams(hash).get('pendingToken');
    if (!token) {
      router.replace('/register?error=google_failed');
      return;
    }
    // One-time read of a browser-only API (the URL fragment) on mount — there's
    // no external-system callback to defer this into.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingToken(token);
  }, [router]);

  const handleSubmit = async () => {
    if (!pendingToken || roles.length === 0) {
      setError('Choose at least one role.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await completeGoogleSignupRequest(pendingToken, roles);
      setAuthenticatedSession(data.accessToken, data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to finish signing up.');
      setIsSubmitting(false);
    }
  };

  if (!pendingToken) {
    return null;
  }

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex min-h-[80vh] flex-col justify-center gap-6 py-16">
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-ink">One more step</h1>
            <p className="text-sm text-ink-secondary">Tell us how you&apos;ll be using AMR Tutor.</p>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-ink">I am a…</legend>
            {ROLE_OPTIONS.map((role) => {
              const id = `complete-google-role-${role.value.toLowerCase()}`;
              const checked = roles.includes(role.value);
              return (
                <div key={role.value} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(next) => {
                      setRoles((current) =>
                        next ? [...current, role.value] : current.filter((r) => r !== role.value),
                      );
                    }}
                  />
                  <CheckboxLabel htmlFor={id}>{role.label}</CheckboxLabel>
                </div>
              );
            })}
          </fieldset>

          {error && <Alert variant="danger">{error}</Alert>}

          <Button size="lg" isLoading={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Finishing up…' : 'Continue'}
          </Button>
        </div>
      </Container>
    </>
  );
}
