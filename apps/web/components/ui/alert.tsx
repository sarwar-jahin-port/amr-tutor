import { type VariantProps, cva } from 'class-variance-authority';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const alertVariants = cva('flex items-start gap-3 rounded-xl border p-4 text-sm', {
  variants: {
    variant: {
      default: 'border-border bg-surface text-ink',
      success: 'border-primary/20 bg-soft-green text-ink',
      danger: 'border-danger/20 bg-danger-surface text-ink',
      information: 'border-information/20 bg-surface text-ink',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const icons = {
  default: Info,
  success: CheckCircle2,
  danger: CircleAlert,
  information: Info,
} as const;

const iconColors = {
  default: 'text-ink-secondary',
  success: 'text-success',
  danger: 'text-danger',
  information: 'text-information',
} as const;

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
}

/** Status messaging per docs/ui-ux.md §19: never color alone — always paired with a text label. */
export function Alert({ className, variant = 'default', title, children, ...props }: AlertProps) {
  const Icon = icons[variant ?? 'default'];

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', iconColors[variant ?? 'default'])} aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className="text-ink-secondary">{children}</div>}
      </div>
    </div>
  );
}
