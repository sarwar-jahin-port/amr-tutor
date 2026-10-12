'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SiteHeader } from '@/components/site-header';
import { resendVerificationRequest, verifyEmailRequest } from '@/features/auth/api';

type VerifyState = 'verifying' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'error');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    verifyEmailRequest(token)
      .then(() => {
        if (!cancelled) setState('success');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendStatus('sending');
    try {
      await resendVerificationRequest(resendEmail);
    } finally {
      setResendStatus('sent');
    }
  };

  return (
    <Container as="main" narrow className="flex min-h-[80vh] flex-col justify-center gap-6 py-16">
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Email verification</h1>

        {state === 'verifying' && <p className="text-sm text-ink-secondary">Verifying your email…</p>}

        {state === 'success' && (
          <>
            <Alert variant="success">Your email address has been verified.</Alert>
            <Button asChild size="lg">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <Alert variant="danger">
              This verification link is invalid or has expired. Enter your email below to get a new one.
            </Alert>
            <Field>
              <FieldLabel htmlFor="resend-email">Email</FieldLabel>
              <Input
                id="resend-email"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
            </Field>
            <Button
              size="lg"
              isLoading={resendStatus === 'sending'}
              disabled={resendStatus === 'sent' || !resendEmail}
              onClick={handleResend}
            >
              {resendStatus === 'sent' ? 'Check your inbox' : 'Resend verification email'}
            </Button>
          </>
        )}
      </div>
    </Container>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <SiteHeader />
      <Suspense>
        <VerifyEmailContent />
      </Suspense>
    </>
  );
}
