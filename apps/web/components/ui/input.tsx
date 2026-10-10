'use client';

import { Eye, EyeOff } from 'lucide-react';
import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/cn';

const inputBaseClasses =
  'h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-secondary transition-colors duration-fast outline-none hover:border-ink-secondary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-secondary aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/30';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return <input ref={ref} type={type} className={cn(inputBaseClasses, className)} {...props} />;
  },
);
Input.displayName = 'Input';

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(inputBaseClasses, 'pr-11', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-secondary transition-colors duration-fast hover:text-ink"
        >
          {visible ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export const PhoneInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-secondary">
          +88
        </span>
        <input
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01712345678"
          className={cn(inputBaseClasses, 'pl-11', className)}
          {...props}
        />
      </div>
    );
  },
);
PhoneInput.displayName = 'PhoneInput';
