'use client';

import { useEffect, useState } from 'react';

type ToastVariant = 'default' | 'success' | 'danger' | 'information';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. Defaults to 6000; pass 0 to require manual dismissal. */
  duration?: number;
}

export interface ToastRecord extends ToastOptions {
  id: string;
  open: boolean;
}

type Listener = (toasts: ToastRecord[]) => void;

let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function toast(options: ToastOptions) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, open: true, duration: 6000, ...options }];
  emit();
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t));
  emit();
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Subscribes a component (the Toaster) to the global toast list. Call `toast()` from anywhere else. */
export function useToasts() {
  const [state, setState] = useState<ToastRecord[]>(toasts);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
