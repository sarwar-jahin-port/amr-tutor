'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';

/** Persistent while an admin is viewing the app as another account — makes the session impossible to miss. */
export function ImpersonationBanner() {
  const { user, impersonatorAdmin, endImpersonation } = useAuth();
  const router = useRouter();

  if (!impersonatorAdmin) return null;

  function handleExit() {
    endImpersonation();
    router.replace('/admin/users');
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-warm-accent px-4 py-2 text-sm font-medium text-[#4a2f0f]">
      <span>
        Viewing as <strong>{user?.email ?? user?.phone ?? user?.id}</strong> (support session as {impersonatorAdmin.email})
      </span>
      <button
        type="button"
        onClick={handleExit}
        className="rounded-md border border-[#4a2f0f]/30 bg-white/40 px-2.5 py-1 text-xs font-semibold hover:bg-white/70"
      >
        Exit
      </button>
    </div>
  );
}
