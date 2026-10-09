'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

/** Monthly budget range filter (ui-ux.md §9: a top-priority tuition search filter). */
export function BudgetFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(searchParams.get('salaryMin') ?? '');
  const [max, setMax] = useState(searchParams.get('salaryMax') ?? '');

  function commit() {
    const params = new URLSearchParams(searchParams.toString());
    if (min.trim()) params.set('salaryMin', min.trim());
    else params.delete('salaryMin');
    if (max.trim()) params.set('salaryMax', max.trim());
    else params.delete('salaryMax');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">Monthly budget (৳)</span>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onBlur={commit}
          aria-label="Minimum monthly budget"
        />
        <span className="text-ink-secondary">–</span>
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onBlur={commit}
          aria-label="Maximum monthly budget"
        />
      </div>
    </div>
  );
}
