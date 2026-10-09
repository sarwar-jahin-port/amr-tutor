'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';

export function SearchPagination({ page, limit, total }: { page: number; limit: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={(nextPage) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(nextPage));
        router.push(`${pathname}?${params.toString()}`);
      }}
    />
  );
}
