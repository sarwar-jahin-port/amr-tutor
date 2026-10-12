'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/features/auth/auth-context';
import { meRequest } from '@/features/auth/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setAuthenticatedSession } = useAuth();

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');

    if (!accessToken) {
      router.replace('/login?error=google_failed');
      return;
    }

    meRequest(accessToken)
      .then((user) => {
        setAuthenticatedSession(accessToken, user);
        const isModerator = user.roles.some(
          (role) => role === 'VERIFIER' || role === 'MODERATOR' || role === 'ADMIN',
        );
        router.replace(isModerator ? '/admin' : '/dashboard');
      })
      .catch(() => router.replace('/login?error=google_failed'));
    // Runs once on mount — the hash is only meaningful on the initial load of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex min-h-[80vh] flex-col justify-center gap-4 py-16 text-center">
        <p className="text-sm text-ink-secondary">Signing you in…</p>
      </Container>
    </>
  );
}
