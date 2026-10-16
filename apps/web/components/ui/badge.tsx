import { type VariantProps, cva } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Status badge. Always pair with a clear text label (e.g. "Pending",
 * "Verified") — never rely on color alone (docs/ui-ux.md §12, §19).
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-canvas text-ink-secondary',
        success: 'border-primary/20 bg-soft-green text-primary',
        danger: 'border-danger/20 bg-danger-surface text-danger',
        information: 'border-information/20 bg-surface text-information',
        warning: 'border-warm-accent/30 bg-surface text-[#8a5a24]',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
