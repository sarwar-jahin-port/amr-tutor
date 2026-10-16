'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function ClearFiltersLink() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasFilters = [...searchParams.keys()].some((key) => key !== 'page');
  if (!hasFilters) return null;

  return (
    <Link href={pathname} className="text-sm font-medium text-primary hover:underline">
      Clear all filters
    </Link>
  );
}
