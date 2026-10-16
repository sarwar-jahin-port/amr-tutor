'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ComponentRef, type LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Checkbox = forwardRef<
  ComponentRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer flex size-5 shrink-0 items-center justify-center rounded-md border border-border bg-surface transition-colors duration-fast outline-none hover:border-ink-secondary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="text-primary-foreground">
      <Check className="size-3.5" aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';

/** Pairs a Checkbox with its clickable label text. The label's htmlFor/id must match. */
export function CheckboxLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('cursor-pointer text-sm text-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-50', className)} {...props} />
  );
}
