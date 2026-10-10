import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Narrows to the editorial reading-column width (~720px) instead of the full 1200px grid. */
  narrow?: boolean;
}

/**
 * Responsive page container per docs/ui-ux.md §6: max content width ~1200px,
 * 16-20px mobile gutters widening to 32-48px on desktop.
 */
export function Container({ as: Component = 'div', narrow, className, ...props }: ContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12',
        narrow ? 'max-w-3xl' : 'max-w-[1200px]',
        className,
      )}
      {...props}
    />
  );
}
