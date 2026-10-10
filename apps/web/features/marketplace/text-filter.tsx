'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export interface TextFilterProps {
  paramKey: string;
  label: string;
  placeholder?: string;
}

/** A text filter bound to a URL search param — commits on blur or Enter. */
export function TextFilter({ paramKey, label, placeholder }: TextFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? '');

  function commit() {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set(paramKey, value.trim());
    } else {
      params.delete(paramKey);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const fieldId = `filter-${paramKey}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <Input
        id={fieldId}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}
