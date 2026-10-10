'use client';

import { LayoutGrid, List } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

export type ResultsView = 'card' | 'row';

const OPTIONS: { value: ResultsView; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'card', label: 'Card view', icon: LayoutGrid },
  { value: 'row', label: 'Row view', icon: List },
];

/** Persists the card/row choice in the URL so it survives pagination and is shareable. */
export function ViewToggle({ view }: { view: ResultsView }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(next: ResultsView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'card') {
      params.delete('view');
    } else {
      params.set('view', next);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-surface p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => setView(value)}
            className={cn(
              'flex size-8 items-center justify-center rounded-full transition-all duration-fast',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-ink-secondary hover:bg-soft-green hover:text-ink',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
