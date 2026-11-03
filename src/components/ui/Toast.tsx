"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, description?: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => showToast(title, description, "success"),
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) => showToast(title, description, "error"),
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => showToast(title, description, "info"),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}

      {/* Liquid Glass Toast Container (Bottom-Right, above mobile bar) */}
      <div className="fixed bottom-16 sm:bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md p-3.5 text-white shadow-2xl animate-in slide-in-from-bottom-3 duration-200"
          >
            {toast.type === "success" && (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            {toast.type === "info" && (
              <Info className="h-4 w-4 text-lonking-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-100">{toast.title}</div>
              {toast.description && (
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {toast.description}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 transition-colors touch-target sm:min-h-0 flex items-center justify-center"
              aria-label="Đóng thông báo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
