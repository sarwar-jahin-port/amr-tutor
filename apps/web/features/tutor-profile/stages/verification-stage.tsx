import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Onboarding Stage E "Optional verification" (ui-ux.md §14): explain the
 * benefit before asking for documents. Submission itself is Phase 10
 * (student verification) — not built yet, so this is honestly a preview,
 * not a working submission, per the same disabled-with-explanation pattern
 * used for the "Apply" action in Phase 5.
 */
export function VerificationStage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5">
        <ShieldCheck className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-ink">Verified student</p>
          <p className="text-sm text-ink-secondary">
            Verification lets guardians see that your university affiliation has been checked. It
            does not prove your teaching ability, reliability, or suitability for a particular
            child — guardians are told that explicitly.
          </p>
          <p className="text-sm text-ink-secondary">
            When this opens, you&apos;ll be asked to upload a student ID or another university
            document. It stays private and is only used to confirm your status.
          </p>
        </div>
      </div>

      <Button disabled className="self-start">
        Submit for verification
      </Button>
      <p className="-mt-4 text-sm text-ink-secondary">
        Verification isn&apos;t open yet on this platform — this feature is coming soon.
        Verification is optional either way: you can be discovered and apply for tuition without it.
      </p>

      <Button asChild size="lg" className="self-start">
        <Link href="/dashboard">Finish and go to your dashboard</Link>
      </Button>
    </div>
  );
}
