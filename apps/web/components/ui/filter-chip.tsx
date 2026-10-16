'use client';

import { X } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Renders a separate remove (x) button alongside the toggle, for an already-applied filter. */
  onRemove?: () => void;
}

/** Toggleable filter chip (docs/ui-ux.md §9, §17). Selection state is never color-only. */
export function FilterChip({ selected, onRemove, className, children, ...props }: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-9 items-stretch rounded-full border transition-colors duration-fast',
        selected ? 'border-primary bg-soft-green text-primary' : 'border-border bg-surface text-ink',
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
          !selected && 'hover:bg-canvas',
        )}
        {...props}
      >
        {children}
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove filter"
          onClick={onRemove}
          className="flex items-center rounded-r-full px-2 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
