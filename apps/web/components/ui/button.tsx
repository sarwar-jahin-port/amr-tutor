'use client';

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Button hierarchy per docs/ui-ux.md §17: one primary action per decision area,
 * secondary for meaningful alternatives, tertiary for low-priority actions,
 * destructive visually separated from ordinary actions.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[15px] font-semibold transition-colors duration-fast disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
        secondary:
          'border border-border bg-surface text-ink hover:bg-soft-green active:bg-soft-green',
        tertiary: 'bg-transparent text-primary hover:bg-soft-green active:bg-soft-green',
        destructive: 'bg-danger text-white hover:bg-[#8f1c12] active:bg-[#8f1c12]',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner and marks the button busy without changing its label. */
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, isLoading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    // Slot (asChild) requires exactly one element child, so the spinner can't
    // be a sibling of `children` here — it must be part of a single
    // conditional expression, never two separate top-level JSX children.
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
