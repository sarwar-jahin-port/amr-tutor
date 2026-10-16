'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox, CheckboxLabel } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { AuthedApiError } from '@/lib/authed-api';
import { getContactShareState, shareContact } from './api';
import type { ContactShareState } from './types';

/**
 * The contact-sharing step of a conversation (blueprint Phase 9): each
 * side chooses which of their own fields to share, and a field only ever
 * appears in `contact` once BOTH sides have consented to it — the backend
 * enforces this, this panel just reflects it.
 */
export function ContactSharePanel({ applicationId }: { applicationId: string }) {
  const [state, setState] = useState<ContactShareState | null | undefined>(undefined);
  const [sharePhone, setSharePhone] = useState(false);
  const [shareEmail, setShareEmail] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getContactShareState(applicationId)
      .then((result) => {
        if (cancelled) return;
        setState(result);
        setSharePhone(result.myShared.phone);
        setShareEmail(result.myShared.email);
      })
      .catch((err) => {
        if (!cancelled) {
          setState(null);
          setError(err instanceof AuthedApiError ? err.message : 'Could not load contact-sharing status.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  async function handleShare() {
    setIsSharing(true);
    try {
      const updated = await shareContact(applicationId, { sharePhone, shareEmail });
      setState(updated);
      toast({ title: 'Contact-sharing preferences saved' });
    } catch (err) {
      const message = err instanceof AuthedApiError ? err.message : 'Something went wrong. Please try again.';
      toast({ title: "Couldn't update contact sharing", description: message, variant: 'danger' });
    } finally {
      setIsSharing(false);
    }
  }

  if (state === undefined) return null;

  if (state === null) {
    return error ? <p className="text-sm text-ink-secondary">{error}</p> : null;
  }

  const hasMutualContact = Boolean(state.contact.phone || state.contact.email);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-ink">Share contact details</p>
      <p className="text-sm text-ink-secondary">
        A field is only revealed once you both agree to share it — your phone or email stays private until
        then.
      </p>

      {hasMutualContact && (
        <div className="flex flex-col gap-1 rounded-lg bg-canvas p-3 text-sm">
          {state.contact.phone && (
            <p>
              Phone: <span className="font-medium text-ink">{state.contact.phone}</span>
            </p>
          )}
          {state.contact.email && (
            <p>
              Email: <span className="font-medium text-ink">{state.contact.email}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox id="share-phone" checked={sharePhone} onCheckedChange={(v) => setSharePhone(v === true)} />
          <CheckboxLabel htmlFor="share-phone">Share my phone number</CheckboxLabel>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="share-email" checked={shareEmail} onCheckedChange={(v) => setShareEmail(v === true)} />
          <CheckboxLabel htmlFor="share-email">Share my email</CheckboxLabel>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" isLoading={isSharing} onClick={() => void handleShare()}>
          {state.updatedAt ? 'Update sharing preferences' : 'Share contact'}
        </Button>
        {(state.counterpartShared.phone || state.counterpartShared.email) && !hasMutualContact && (
          <Badge variant="information">They&apos;ve shared — waiting on a matching field from you</Badge>
        )}
      </div>
    </div>
  );
}
