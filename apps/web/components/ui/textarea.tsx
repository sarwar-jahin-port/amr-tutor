import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-secondary transition-colors duration-fast outline-none hover:border-ink-secondary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-secondary aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/30',
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
