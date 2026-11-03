"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  X,
  PhoneCall,
  FileSpreadsheet,
  Settings,
  Wrench,
  SlidersHorizontal,
} from "lucide-react";

export type SearchScope = "all" | "code" | "model";

interface ModelCount {
  model: string;
  count: number;
}

interface CommandSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
  modelsWithCount: ModelCount[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenMobileFilter?: () => void;
}

export function CommandSearchHeader({
  searchQuery,
  onSearchChange,
  searchScope,
  onSearchScopeChange,
  modelsWithCount,
  selectedModel,
  onSelectModel,
  cartCount,
  onOpenCart,
  onOpenMobileFilter,
}: CommandSearchHeaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Phím tắt '/' hoặc 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" && document.activeElement?.tagName !== "INPUT") ||
        (e.key === "k" && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 liquid-glass-nav transition-all duration-200">
      {/* 1. Sleek Top Navigation Bar */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-200/70">
        {/* Brand System */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lonking-500 text-slate-950 font-black shadow-xs group-hover:scale-105 transition-transform">
            <span className="font-mono text-sm font-black tracking-tighter">LK</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-tight text-slate-950 uppercase text-sm sm:text-base">
                LONKING
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-700 uppercase text-xs sm:text-sm">
                PHỤ TÙNG CƠ GIỚI
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Nền tảng tra cứu kỹ thuật & báo giá OEM chính hãng
            </span>
          </div>
        </Link>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="tel:0909123456"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Đường dây nóng kỹ thuật"
          >
            <PhoneCall className="h-3.5 w-3.5 text-lonking-600" />
            <span className="font-mono font-bold">0909.123.456</span>
          </a>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Quản trị kho MISA"
          >
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline font-medium">Quản trị kho</span>
          </Link>

          {/* Quote Cart Main Action Button */}
          <button
            onClick={onOpenCart}
            aria-label="Xem danh sách báo giá"
            className="inline-flex items-center gap-2 rounded-xl btn-lonking px-3.5 py-1.5 text-xs font-bold text-slate-950 transition-all shadow-xs"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden xs:inline">Báo giá</span>
            <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-slate-950 font-mono text-[10px] font-black text-lonking-400">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Prominent Search Command Center */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="relative flex items-center rounded-2xl border-2 border-slate-200/90 bg-white shadow-xs focus-within:border-lonking-500 focus-within:ring-4 focus-within:ring-lonking-500/15 transition-all">
          {/* Scope Selector */}
          <div className="border-r border-slate-200 pl-3 pr-2 py-2 shrink-0">
            <select
              value={searchScope}
              onChange={(e) => onSearchScopeChange(e.target.value as SearchScope)}
              aria-label="Phạm vi tra cứu"
              className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">TẤT CẢ</option>
              <option value="code">MÃ PHỤ TÙNG</option>
              <option value="model">DÒNG MÁY</option>
            </select>
          </div>

          {/* Search Icon */}
          <div className="pl-3 pr-2 text-slate-400 shrink-0">
            <Search className="h-4 w-4" />
          </div>

          {/* Large, Clear Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nhập mã phụ tùng, tên phụ tùng hoặc dòng máy cần tìm..."
            className="w-full bg-transparent py-2.5 sm:py-3 px-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium tracking-tight"
          />

          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="px-2 text-slate-400 hover:text-slate-700 transition-colors p-1"
              title="Xóa ô tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Keyboard Shortcut Indicator */}
          <div className="hidden sm:flex items-center gap-1 pr-3.5 text-slate-400 pointer-events-none select-none shrink-0">
            <kbd className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              /
            </kbd>
            <span className="text-[10px]">tìm nhanh</span>
          </div>
        </div>

        {/* 3. Machine Models Quick Filter Strip (Horizontal scrollable with Image 1 active pill style) */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5 shrink-0">
            DÒNG MÁY:
          </span>

          <button
            onClick={() => onSelectModel("Tất cả")}
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs transition-all ${
              selectedModel === "Tất cả"
                ? "pill-lonking-active"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            TẤT CẢ
          </button>

          {modelsWithCount.map(({ model, count }) => {
            const active = selectedModel === model;
            return (
              <button
                key={model}
                onClick={() => onSelectModel(model)}
                className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs transition-all inline-flex items-center gap-1.5 ${
                  active
                    ? "pill-lonking-active"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                <span>{model}</span>
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    active ? "text-slate-950 font-black" : "text-slate-400"
                  }`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
