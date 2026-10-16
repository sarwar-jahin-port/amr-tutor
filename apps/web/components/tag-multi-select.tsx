'use client';

import { Search, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type { ReferenceItem } from '@/features/marketplace/types';

/**
 * Search-to-select multi-select: type to filter, click (or Enter) to add a
 * chip, Backspace on an empty query removes the last one. Replaces a
 * checkbox grid for option sets too large to show all at once without
 * feeling like a wall of checkboxes (ui-ux.md §17 superseded for this case).
 */
export function TagMultiSelect({
  legend,
  options,
  selected,
  onChange,
  placeholder = 'Search…',
}: {
  legend: string;
  options: ReferenceItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const selectedItems = options.filter((o) => selected.includes(o.id));
  const availableOptions = options.filter((o) => !selected.includes(o.id));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? availableOptions.filter((o) => o.name.toLowerCase().includes(normalizedQuery))
    : availableOptions;

  function select(id: string) {
    onChange([...selected, id]);
    setQuery('');
    inputRef.current?.focus();
  }

  function remove(id: string) {
    onChange(selected.filter((x) => x !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {legend}
      </label>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <Badge key={item.id} variant="success" className="gap-1 py-1 pr-1">
              {item.name}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-full p-0.5 transition-colors duration-fast hover:bg-primary/20"
                aria-label={`Remove ${item.name}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

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
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const first = filtered[0];
              if (first) select(first.id);
            } else if (e.key === 'Backspace' && query === '' && selectedItems.length > 0) {
              remove(selectedItems[selectedItems.length - 1]!.id);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={availableOptions.length === 0 ? 'All options selected' : placeholder}
          disabled={availableOptions.length === 0}
          autoComplete="off"
          className={cn(
            'h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-colors duration-fast placeholder:text-ink-secondary',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />

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
                  aria-selected={false}
                  onMouseDown={(e) => {
                    // Fires before the input's onBlur, so the dropdown doesn't close first.
                    e.preventDefault();
                    select(option.id);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-ink transition-colors duration-fast hover:bg-soft-green"
                >
                  {option.name}
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
    </div>
  );
}
