import { useState, useEffect } from "react";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "jurisdiction" | "idempotent";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type Listener = (toasts: ToastItem[]) => void;

let memoryToasts: ToastItem[] = [];
const listeners: Set<Listener> = new Set();

function emitChange() {
  listeners.forEach((listener) => listener([...memoryToasts]));
}

function dismissToast(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  emitChange();
}

function addToast(toastProps: Omit<ToastItem, "id"> & { id?: string }): string {
  const id = toastProps.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const duration = toastProps.duration ?? 4500;

  const newToast: ToastItem = {
    ...toastProps,
    id,
    duration,
  };

  // Limit max concurrent toasts to 5
  memoryToasts = [newToast, ...memoryToasts.slice(0, 4)];
  emitChange();

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(memoryToasts);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: dismissToast,
  };
}

// Global callable toast API
export function toast(props: Omit<ToastItem, "id"> & { id?: string }) {
  return addToast(props);
}

toast.success = (title: string, description?: string, options?: Partial<ToastItem>) => {
  return addToast({
    title,
    description,
    variant: "success",
    ...options,
  });
};

toast.error = (title: string, description?: string, options?: Partial<ToastItem>) => {
  return addToast({
    title,
    description,
    variant: "error",
    ...options,
  });
};

toast.warning = (title: string, description?: string, options?: Partial<ToastItem>) => {
  return addToast({
    title,
    description,
    variant: "warning",
    ...options,
  });
};

toast.info = (title: string, description?: string, options?: Partial<ToastItem>) => {
  return addToast({
    title,
    description,
    variant: "info",
    ...options,
  });
};

toast.jurisdiction = (districtOrMsg: string, details?: string, options?: Partial<ToastItem>) => {
  return addToast({
    title: "Statutory Jurisdiction Restriction",
    description: details || districtOrMsg,
    variant: "jurisdiction",
    duration: 6500,
    ...options,
  });
};

toast.idempotent = (actionOrMsg: string, details?: string, options?: Partial<ToastItem>) => {
  return addToast({
    title: "Statutory Record Cached (Idempotent)",
    description: details || actionOrMsg,
    variant: "idempotent",
    duration: 5000,
    ...options,
  });
};

toast.dismiss = dismissToast;
