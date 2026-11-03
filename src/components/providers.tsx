"use client";

import React from "react";
import { InventoryProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <InventoryProvider>
      <ToastProvider>{children}</ToastProvider>
    </InventoryProvider>
  );
}
