'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { type ComponentPropsWithoutRef, type ComponentRef, type LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const RadioGroup = RadioGroupPrimitive.Root;

export const RadioGroupItem = forwardRef<
  ComponentRef<typeof RadioGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'peer flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition-colors duration-fast outline-none hover:border-ink-secondary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="size-2.5 rounded-full bg-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

/** Pairs a RadioGroupItem with its clickable label text. The label's htmlFor/id must match. */
export function RadioGroupLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'cursor-pointer text-sm text-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
