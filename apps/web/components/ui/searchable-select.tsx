'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { ReferenceItem } from '@/features/marketplace/types';

/**
 * Single-select search-to-filter combobox — the same "type to filter"
 * combobox shell as TagMultiSelect (components/tag-multi-select.tsx), but
 * for a single value: selecting an option replaces the current value and
 * closes the dropdown, rather than appending a chip.
 */
export function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Search…',
  ariaInvalid,
}: {
  id?: string;
  options: ReferenceItem[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  ariaInvalid?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const selectedOption = options.find((o) => o.id === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((o) => o.name.toLowerCase().includes(normalizedQuery))
    : options;

  function select(id: string) {
    onChange(id);
    setQuery('');
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-secondary" aria-hidden="true" />
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={`${inputId}-listbox`}
        aria-invalid={ariaInvalid || undefined}
        value={isOpen ? query : (selectedOption?.name ?? '')}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setQuery('');
          setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const first = filtered[0];
            if (first) select(first.id);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-9 text-sm text-ink outline-none transition-colors duration-fast placeholder:text-ink-secondary',
          'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
          ariaInvalid && 'border-danger',
        )}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-secondary" aria-hidden="true" />

      {isOpen && filtered.length > 0 && (
        <ul
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-elevated"
        >
          {filtered.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                onMouseDown={(e) => {
                  // Fires before the input's onBlur, so the dropdown doesn't close first.
                  e.preventDefault();
                  select(option.id);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink transition-colors duration-fast hover:bg-soft-green"
              >
                {option.name}
                {option.id === value && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && normalizedQuery && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-secondary shadow-elevated">
          No matches for &quot;{query.trim()}&quot;
        </div>
      )}
    </div>
  );
}
