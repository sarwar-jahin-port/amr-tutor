import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Empty/zero-data state. Per docs/ui-ux.md §19, this is product copy, not
 * decoration: pair the message with a concrete next action where one exists
 * (e.g. "Adjust filters"), not just a title and an illustration.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-soft-green">
          <Icon className="size-6 text-primary" aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-ink">{title}</p>
        {description && <p className="max-w-sm text-sm text-ink-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
