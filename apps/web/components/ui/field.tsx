import type { HTMLAttributes, LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Form field layout primitives. Labels stay visible at all times (never
 * collapse into placeholder-only inputs) and error/description text is wired
 * to its control via aria-describedby by the caller, per docs/ui-ux.md §20.
 */
export function Field({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}

export function FieldLabel({
  className,
  required,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('text-sm font-medium text-ink', className)} {...props}>
      {children}
      {required && (
        <span className="ml-0.5 text-danger" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function FieldDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-ink-secondary', className)} {...props} />;
}

export function FieldError({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;

  return (
    <p className={cn('text-sm text-danger', className)} {...props}>
      {children}
    </p>
  );
}
