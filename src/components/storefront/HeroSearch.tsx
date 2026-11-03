"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  X,
  Sparkles,
  PhoneCall,
  FileSpreadsheet,
  Layers,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Settings,
} from "lucide-react";

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectSuggestion: (value: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

const QUICK_SUGGESTIONS = [
  { label: "856Max", type: "model" },
  { label: "ZL50NC", type: "model" },
  { label: "CDM6225", type: "model" },
  { label: "WE245", type: "model" },
  { label: "LF667", type: "code" },
  { label: "FS1280", type: "code" },
  { label: "Lọc thủy lực", type: "cat" },
  { label: "Răng gầu", type: "cat" },
];

export function HeroSearch({
  searchQuery,
  onSearchChange,
  onSelectSuggestion,
  cartCount,
  onOpenCart,
}: HeroSearchProps) {
  return (
    <div className="relative overflow-hidden bg-slate-900 text-white border-b border-slate-800">
      {/* Background Decorative Tech Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

      {/* Top Navbar inside Hero */}
      <div className="relative z-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  PHỤ TÙNG CƠ GIỚI MIỀN NAM
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-400 border border-amber-500/30">
                  TRA CỨU 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hệ thống tra cứu mã chéo & báo giá phụ tùng xe xúc, máy đào, xe ủi
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Admin Portal Link */}
            <Link
              href="/admin"
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-amber-500/50 hover:bg-slate-800 hover:text-white transition-colors"
              title="Khu vực quản trị kho cho nhân viên"
            >
              <Settings className="h-3.5 w-3.5 text-amber-500" />
              <span>Quản trị kho</span>
            </Link>

            {/* Hotline Call */}
            <a
              href="tel:0909123456"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all duration-200 hover:border-amber-500/50 hover:bg-slate-800 hover:text-white"
            >
              <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
              <span>Hotline Kho: 0909.123.456</span>
            </a>

            {/* Cart Drawer Button */}
            <button
              onClick={onOpenCart}
              className="relative inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:bg-amber-400 active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Danh sách báo giá</span>
              {cartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 font-mono text-[11px] font-bold text-amber-400">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Banner Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:py-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/90 px-3 py-1 text-xs font-medium text-slate-300 mb-4 backdrop-blur-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>Kho tổng Thủ Đức & Biên Hòa • Hơn 15.000 danh mục phụ tùng chính hãng</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Tra Cứu Mã Phụ Tùng & Tương Thích Dòng Máy
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-6">
          Hỗ trợ tra cứu <strong className="text-amber-400 font-semibold">một phần mã</strong>, mã chéo OEM,
          mã MISA hoặc tên máy xúc lật, máy đào Lonking, Liugong, XCMG, Komatsu.
        </p>

        {/* Large Search Input */}
        <div className="relative mx-auto max-w-3xl">
          <div className="relative flex items-center rounded-2xl border-2 border-slate-700 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-xl transition-all duration-200 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/20">
            <div className="pl-3 pr-2 text-slate-400">
              <Search className="h-6 w-6 text-amber-500" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Nhập 1 phần mã (09825, 8496, LF667), tên máy (LG833, 856Max, 6225) hoặc tên phụ tùng..."
              className="w-full bg-transparent py-2.5 px-2 text-base sm:text-lg text-white placeholder:text-slate-500 focus:outline-none font-medium"
              autoFocus
            />

            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="p-2 text-slate-400 hover:text-white transition-colors duration-150"
                title="Xóa tìm kiếm"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={() => onSearchChange(searchQuery)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-all duration-200 hover:bg-amber-400"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tìm kiếm</span>
            </button>
          </div>

          {/* Quick Suggestions Pills */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" /> Gợi ý tìm nhanh:
            </span>
            {QUICK_SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                onClick={() => onSelectSuggestion(item.label)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold tracking-tight transition-all duration-200 ${
                  searchQuery.toUpperCase() === item.label.toUpperCase()
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-amber-500/60 hover:text-white hover:bg-slate-750"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
