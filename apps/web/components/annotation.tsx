import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface AnnotationProps {
  children: ReactNode;
  className?: string;
  /** Tailwind rotation utility, e.g. "-rotate-3". */
  rotate?: string;
}

/**
 * Small hand-drawn-style note (handwritten font, slight rotation) used to
 * echo the reference design's marginalia without competing with real copy.
 */
export function Annotation({ children, className, rotate = '-rotate-2' }: AnnotationProps) {
  return (
    <p
      aria-hidden="true"
      className={cn(
        'font-handwritten text-xl leading-tight text-ink/70 select-none',
        rotate,
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Short, loosely-sketched underline stroke used beneath an annotation or word. */
export function DoodleUnderline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 12"
      className={cn('h-2.5 w-24 text-primary/50', className)}
      fill="none"
    >
      <path
        d="M2 8.5C20 3 45 2 62 6C79 10 100 4 118 3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Single faint leaf silhouette tucked into a card corner — a quiet brand touch, not interactive. */
export function CornerLeaf({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className={cn('pointer-events-none text-primary', className)}
      fill="currentColor"
    >
      <path d="M-10 110C-10 75 18 48 55 48C55 88 28 110 -10 110Z" opacity="0.1" />
    </svg>
  );
}

/** Small radiating-dash burst used to echo the reference design's sketchy accents. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M8 8L13 12" />
      <path d="M4 20H10" />
      <path d="M8 32L13 28" />
    </svg>
  );
}

/** Short, loosely-sketched arrow used to point an annotation at nearby content. */
export function DoodleArrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 48"
      className={cn('h-10 w-12 text-primary/50', className)}
      fill="none"
    >
      <path
        d="M4 4C8 20 18 36 40 42"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M26 38L40 42L38 28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
