"use client";

import React from "react";
import { PartCategory } from "@/types/inventory";
import {
  Filter,
  Check,
  CheckCircle2,
  Boxes,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

interface FilterBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  models: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onlyInStock: boolean;
  onToggleOnlyInStock: () => void;
  resultCount: number;
  totalCount: number;
  onResetFilters: () => void;
}

export function FilterBar({
  categories,
  selectedCategory,
  onSelectCategory,
  models,
  selectedModel,
  onSelectModel,
  onlyInStock,
  onToggleOnlyInStock,
  resultCount,
  totalCount,
  onResetFilters,
}: FilterBarProps) {
  const isFiltering =
    selectedCategory !== "Tất cả" || selectedModel !== "Tất cả" || onlyInStock;

  return (
    <div className="bg-white border-b border-slate-200/80 shadow-xs sticky top-0 z-20 backdrop-blur-md bg-white/95">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 space-y-2.5">
        {/* Row 1: Category Pills & In-stock toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Category Horizontal scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="h-3.5 w-3.5 text-slate-400" /> Nhóm hàng:
            </span>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    active
                      ? "bg-slate-900 text-amber-400 font-semibold shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Toggle: Chỉ hiện hàng có sẵn */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={onToggleOnlyInStock}
                  className="sr-only"
                />
                <div
                  className={`block h-5 w-9 rounded-full transition-colors duration-200 ${
                    onlyInStock ? "bg-amber-500" : "bg-slate-200"
                  }`}
                />
                <div
                  className={`dot absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                    onlyInStock ? "transform translate-x-4" : ""
                  }`}
                />
              </div>
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    onlyInStock ? "text-amber-600" : "text-slate-400"
                  }`}
                />
                Chỉ hàng có sẵn
              </span>
            </label>

            {isFiltering && (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors"
                title="Bỏ toàn bộ bộ lọc"
              >
                <RotateCcw className="h-3 w-3" /> Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Machine Model Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" /> Dòng máy:
          </span>
          {models.map((model) => {
            const active = selectedModel === model;
            return (
              <button
                key={model}
                onClick={() => onSelectModel(model)}
                className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-xs font-medium tracking-tight transition-all duration-200 ${
                  active
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {model}
              </button>
            );
          })}
        </div>

        {/* Result summary indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>
            Tìm thấy <strong className="font-mono font-bold text-slate-900">{resultCount}</strong> sản phẩm phụ tùng
            {resultCount < totalCount && (
              <span className="ml-1 text-slate-400">
                (trong tổng số {totalCount} mã kho)
              </span>
            )}
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Tất cả phụ tùng đều được kiểm định chất lượng xuất xưởng
          </span>
        </div>
      </div>
    </div>
  );
}
