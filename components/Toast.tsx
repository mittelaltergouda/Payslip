"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback } from "react";

/**
 * Toast notification type
 */
export type ToastType = "success" | "error" | "info";

/**
 * Toast message structure
 */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * Toast context value
 */
interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Hook to access toast context
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

/**
 * Generate a unique ID for toasts
 */
function generateToastId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Toast provider component
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 3000) => {
      const id = generateToastId();
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast container component - renders all active toasts
 */
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) {return null;}

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Individual toast item component
 */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { id, message, type } = toast;

  // Icon based on type
  const icon = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  }[type];

  // Color classes based on type
  const colorClasses = {
    success: "toast-success",
    error: "toast-error",
    info: "toast-info",
  }[type];

  return (
    <div className={`toast-item ${colorClasses}`} role="alert">
      <div className="flex items-center gap-3">
        <div className="toast-icon">{icon}</div>
        <p className="toast-message">{message}</p>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="toast-close"
        aria-label="Close notification"
        type="button"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
