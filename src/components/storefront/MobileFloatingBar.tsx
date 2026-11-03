"use client";

import React from "react";
import Link from "next/link";
import { useInventory } from "@/lib/store";
import {
  Home,
  SlidersHorizontal,
  FileSpreadsheet,
  PhoneCall,
  MessageCircle,
  Settings,
} from "lucide-react";

interface MobileFloatingBarProps {
  onOpenFilter: () => void;
  activeFilterCount: number;
  onOpenCart: () => void;
  cartCount: number;
}

/**
 * Floating Liquid Glass Bottom Navigation Bar
 * Directly inspired by Apple VisionOS / iOS Liquid Glass design (User Reference Image 3)
 */
export function MobileFloatingBar({
  onOpenFilter,
  activeFilterCount,
  onOpenCart,
  cartCount,
}: MobileFloatingBarProps) {
  const { hotlinePhone } = useInventory();
  const cleanHotline = (hotlinePhone || "0909123456").replace(/\D/g, "");
  return (
    <div className="fixed bottom-3 inset-x-0 z-40 px-3 sm:hidden pointer-events-none">
      <nav
        aria-label="Thanh điều hướng di động"
        className="pointer-events-auto max-w-sm mx-auto liquid-floating-capsule rounded-full p-1.5 flex items-center justify-between"
      >
        {/* Home Button */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Trang chủ</span>
        </button>

        {/* Filter Button */}
        <button
          onClick={onOpenFilter}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-700 hover:text-slate-900 transition-colors relative"
        >
          <div className="relative">
            <SlidersHorizontal className="h-5 w-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-lonking-500 font-mono text-[9px] font-bold text-slate-950 shadow-xs">
                {activeFilterCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Bộ lọc</span>
        </button>

        {/* Center Glowing Action Button: BÁO GIÁ */}
        <button
          onClick={onOpenCart}
          className="relative mx-1 px-4 py-2 rounded-full bg-gradient-to-r from-lonking-500 to-amber-500 text-slate-950 font-black shadow-lg shadow-lonking-500/35 flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Báo giá</span>
          <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-slate-950 font-mono text-[10px] font-black text-lonking-400">
            {cartCount}
          </span>
        </button>

        {/* Hotline Button */}
        <a
          href={`tel:${cleanHotline}`}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <PhoneCall className="h-5 w-5 text-lonking-600" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Hotline</span>
        </a>

        {/* Zalo Button */}
        <a
          href={`https://zalo.me/${cleanHotline}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Zalo</span>
        </a>
      </nav>
    </div>
  );
}
