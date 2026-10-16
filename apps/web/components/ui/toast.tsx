'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { type VariantProps, cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = forwardRef<
  ComponentRef<typeof ToastPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 sm:bottom-4 sm:right-4',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

const toastVariants = cva(
  'animate-toast-in pointer-events-auto relative flex w-full items-start gap-3 rounded-xl border p-4 shadow-elevated',
  {
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
  },
);

export const Toast = forwardRef<
  ComponentRef<typeof ToastPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
));
Toast.displayName = 'Toast';

export const ToastTitle = forwardRef<
  ComponentRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold text-ink', className)} {...props} />
));
ToastTitle.displayName = 'ToastTitle';

export const ToastDescription = forwardRef<
  ComponentRef<typeof ToastPrimitive.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm text-ink-secondary', className)} {...props} />
));
ToastDescription.displayName = 'ToastDescription';

export const ToastAction = forwardRef<
  ComponentRef<typeof ToastPrimitive.Action>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'shrink-0 self-start rounded-md text-sm font-semibold text-primary underline-offset-2 transition-colors duration-fast hover:underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = 'ToastAction';

export const ToastClose = forwardRef<
  ComponentRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="Dismiss"
    className={cn(
      'absolute right-2 top-2 flex size-7 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors duration-fast hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
      className,
    )}
    {...props}
  >
    <X className="size-4" aria-hidden="true" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = 'ToastClose';
