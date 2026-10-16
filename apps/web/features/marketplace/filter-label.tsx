import type { LucideIcon } from 'lucide-react';

/** Icon-chip + text label shared by every sidebar filter field. */
export function FilterLabel({
  icon: Icon,
  htmlFor,
  children,
}: {
  icon: LucideIcon;
  htmlFor?: string;
  children: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-ink">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      {children}
    </label>
  );
}
