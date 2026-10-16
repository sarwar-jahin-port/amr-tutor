'use client';

import type { ReactNode } from 'react';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '../features/auth/auth-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ImpersonationBanner />
      {children}
      <Toaster />
    </AuthProvider>
  );
}
