'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest' },
  { id: 'salary_asc', name: 'Budget: Low to High' },
  { id: 'salary_desc', name: 'Budget: High to Low' },
] as const;

const DEFAULT_SORT = 'newest';

/** Sort-order picker bound to the `sort` URL search param. */
export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get('sort') ?? DEFAULT_SORT;

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_SORT) {
      params.delete('sort');
    } else {
      params.set('sort', next);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="h-10 w-auto gap-2 rounded-lg pr-3 text-sm" aria-label="Sort by">
        <span className="text-ink-secondary">Sort by:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
