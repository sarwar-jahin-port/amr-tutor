import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Icon-badged label/value pair — the small "fact" unit used across listing cards and detail pages. */
export function Fact({
  icon: Icon,
  label,
  value,
  className,
  /** Lets the value wrap onto up to 2 lines instead of truncating to one — e.g. a long subject list. Anything past that is cut with an ellipsis; the full value lives on the detail page. */
  wrap = false,
  /** Icon-chip background — override when the card itself already sits on a tinted background. */
  iconBg = 'bg-soft-green',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
  wrap?: boolean;
  iconBg?: string;
}) {
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-primary', iconBg)}>
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-ink-secondary">{label}</span>
        <span className={cn('font-medium text-ink', wrap ? 'line-clamp-2 break-words' : 'truncate')}>{value}</span>
      </div>
    </div>
  );
}
