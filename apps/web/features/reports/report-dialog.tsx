'use client';

import { Flag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/features/auth/auth-context';
import { AuthedApiError } from '@/lib/authed-api';
import { createReport } from './api';
import { REPORT_CATEGORY_LABEL } from './format';
import type { ReportCategory, ReportTargetInput } from './types';

const CATEGORIES = Object.keys(REPORT_CATEGORY_LABEL) as ReportCategory[];

function errorMessage(error: unknown): string {
  return error instanceof AuthedApiError ? error.message : 'Something went wrong. Please try again.';
}

/**
 * A small "Report" button + dialog usable anywhere a report target is in
 * scope (a tutor profile, a listing, an application). `variant`/`size`
 * default to a low-emphasis tertiary button since reporting is a secondary
 * action relative to whatever the page is primarily for.
 */
export function ReportDialog({
  target,
  label = 'Report',
  variant = 'tertiary',
  size = 'sm',
}: {
  target: ReportTargetInput;
  label?: string;
  variant?: 'tertiary' | 'secondary';
  size?: 'sm' | 'md';
}) {
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>('OTHER');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status !== 'authenticated') return null;

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await createReport(target, category, description.trim() || undefined);
      toast({ title: 'Report submitted', description: 'Thank you — our team will review this.', variant: 'success' });
      setOpen(false);
      setDescription('');
      setCategory('OTHER');
    } catch (error) {
      toast({ title: "Couldn't submit report", description: errorMessage(error), variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Flag className="size-4" aria-hidden="true" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a problem</DialogTitle>
          <DialogDescription>
            Tell us what&apos;s wrong. Reports are reviewed by our moderation team, not shared publicly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="report-category">Category</FieldLabel>
            <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
              <SelectTrigger id="report-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {REPORT_CATEGORY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="report-description">Details (optional)</FieldLabel>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="What happened?"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button isLoading={isSubmitting} onClick={() => void handleSubmit()}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
