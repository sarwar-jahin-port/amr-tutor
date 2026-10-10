import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Loading placeholder. Respects prefers-reduced-motion globally (see app/globals.css). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-border/70', className)}
      {...props}
    />
  );
}
