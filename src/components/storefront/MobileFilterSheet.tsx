"use client";

import React, { useEffect } from "react";
import { X, RotateCcw, Check, Filter } from "lucide-react";
import { SidebarFilters, WarehouseOption } from "./SidebarFilters";

interface CategoryCount {
  name: string;
  count: number;
}

interface BrandCount {
  name: string;
  count: number;
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryCount[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  brands: BrandCount[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  warehouses?: WarehouseOption[];
  selectedWarehouse?: string;
  onSelectWarehouse?: (whId: string) => void;
  onlyInStock: boolean;
  onToggleOnlyInStock: () => void;
  totalFiltered: number;
  totalAvailable: number;
  onResetFilters: () => void;
}

/**
 * Mobile-First Bottom Sheet Filter
 * Touch-optimized bottom drawer with clean drag handle and apply action
 */
export function MobileFilterSheet({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  brands,
  selectedBrand,
  onSelectBrand,
  warehouses = [],
  selectedWarehouse = "all",
  onSelectWarehouse,
  onlyInStock,
  onToggleOnlyInStock,
  totalFiltered,
  totalAvailable,
  onResetFilters,
}: MobileFilterSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden overflow-hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Bottom Sheet */}
      <div className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Drag handle */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-lonking-600" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
              Bộ Lọc Phụ Tùng
            </h3>
            <span className="font-mono text-xs text-slate-400">
              ({totalFiltered} kết quả)
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 touch-target sm:min-h-0 flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sheet Content (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1">
          <SidebarFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            brands={brands}
            selectedBrand={selectedBrand}
            onSelectBrand={onSelectBrand}
            warehouses={warehouses}
            selectedWarehouse={selectedWarehouse}
            onSelectWarehouse={onSelectWarehouse}
            onlyInStock={onlyInStock}
            onToggleOnlyInStock={onToggleOnlyInStock}
            totalFiltered={totalFiltered}
            totalAvailable={totalAvailable}
            onResetFilters={onResetFilters}
            isMobileModal={true}
          />
        </div>

        {/* Sheet Sticky Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          <button
            onClick={() => {
              onResetFilters();
            }}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>

          <button
            onClick={onClose}
            className="flex-2 py-3 px-5 rounded-xl btn-lonking text-xs font-bold text-slate-950 active:scale-98 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Áp Dụng ({totalFiltered} Mã)
          </button>
        </div>
      </div>
    </div>
  );
}
