'use client';

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { dismissToast, removeToast, useToasts } from './use-toast';

/** Mounted once near the app root (see app/providers.tsx). Call `toast()` from anywhere to show one. */
export function Toaster() {
  const toasts = useToasts();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, variant, duration, open }) => (
        <Toast
          key={id}
          variant={variant}
          open={open}
          duration={duration}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) dismissToast(id);
          }}
          onAnimationEndCapture={() => {
            if (!open) removeToast(id);
          }}
        >
          <div className="flex-1">
            <ToastTitle>{title}</ToastTitle>
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export { ToastAction };
