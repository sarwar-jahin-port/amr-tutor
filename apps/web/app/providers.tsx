'use client';

import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '../features/auth/auth-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
