'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { type VariantProps, cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ComponentRef, type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { DialogOverlay } from './dialog';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

/**
 * Drawer/sheet used for mobile filter panels and other full-height side
 * surfaces (docs/ui-ux.md §6: "Filters should open in a full-height sheet").
 */
const sheetVariants = cva(
  'fixed z-50 flex flex-col border-border bg-surface shadow-elevated',
  {
    variants: {
      side: {
        right: 'inset-y-0 right-0 h-full w-full max-w-sm border-l animate-sheet-right',
        left: 'inset-y-0 left-0 h-full w-full max-w-sm border-r animate-sheet-right',
        bottom: 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl border-t animate-sheet-bottom',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

export const SheetContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & VariantProps<typeof sheetVariants>
>(({ className, side, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      <div className="flex items-center justify-end border-b border-border p-4">
        <DialogPrimitive.Close
          aria-label="Close"
          className="flex size-9 items-center justify-center rounded-lg text-ink-secondary transition-colors duration-fast hover:bg-soft-green hover:text-ink focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          <X className="size-4.5" aria-hidden="true" />
        </DialogPrimitive.Close>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';

export const SheetTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-ink', className)} {...props} />
));
SheetTitle.displayName = 'SheetTitle';

export function SheetFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t border-border p-4', className)} {...props} />;
}
