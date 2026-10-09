'use client';

import { Search } from 'lucide-react';
import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Accessible name for the input. Visually hidden since the icon + placeholder convey purpose. */
  label?: string;
  onSubmit?: () => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, label = 'Search', onSubmit, id, ...props }, ref) => {
    const inputId = id ?? 'search-bar';

    return (
      <form
        role="search"
        className={cn('relative w-full', className)}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <Search
          className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4.5 text-ink-secondary"
          aria-hidden="true"
        />
        <input
          ref={ref}
          id={inputId}
          type="search"
          className="h-12 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-base text-ink placeholder:text-ink-secondary outline-none transition-colors duration-fast hover:border-ink-secondary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          {...props}
        />
      </form>
    );
  },
);
SearchBar.displayName = 'SearchBar';
