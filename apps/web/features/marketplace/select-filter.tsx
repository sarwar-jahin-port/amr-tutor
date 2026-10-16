'use client';

import type { LucideIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterLabel } from './filter-label';

const CLEAR_VALUE = '__all__';

export interface SelectFilterOption {
  id: string;
  name: string;
}

export interface SelectFilterProps {
  paramKey: string;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  options: SelectFilterOption[];
}

/** A Select bound directly to a URL search param — selecting a value navigates immediately. */
export function SelectFilter({ paramKey, label, icon, placeholder, options }: SelectFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(paramKey) ?? CLEAR_VALUE;

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === CLEAR_VALUE) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, next);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const fieldId = `filter-${paramKey}`;

  return (
    <div className="flex flex-col gap-1">
      <FilterLabel icon={icon} htmlFor={fieldId}>
        {label}
      </FilterLabel>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger id={fieldId}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLEAR_VALUE}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
