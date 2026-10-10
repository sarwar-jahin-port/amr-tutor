import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Icon-badged label/value pair — the small "fact" unit used across listing cards and detail pages. */
export function Fact({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-ink-secondary">{label}</span>
        <span className="truncate font-medium text-ink">{value}</span>
      </div>
    </div>
  );
}
