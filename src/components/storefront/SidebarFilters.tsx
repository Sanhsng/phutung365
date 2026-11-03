"use client";

import React, { useState } from "react";
import { Filter, RotateCcw, ChevronDown, ChevronUp, Check, Layers, Tag, Box } from "lucide-react";

interface CategoryCount {
  name: string;
  count: number;
}

interface BrandCount {
  name: string;
  count: number;
}

interface SidebarFiltersProps {
  categories: CategoryCount[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  brands: BrandCount[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  onlyInStock: boolean;
  onToggleOnlyInStock: () => void;
  totalFiltered: number;
  totalAvailable: number;
  onResetFilters: () => void;
  isMobileModal?: boolean;
}

export function SidebarFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  brands,
  selectedBrand,
  onSelectBrand,
  onlyInStock,
  onToggleOnlyInStock,
  totalFiltered,
  totalAvailable,
  onResetFilters,
  isMobileModal = false,
}: SidebarFiltersProps) {
  const [openSections, setOpenSections] = useState({
    stock: true,
    categories: true,
    brands: true,
  });

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const toggleSection = (section: "stock" | "categories" | "brands") => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isFiltered =
    selectedCategory !== "Tất cả" || selectedBrand !== "Tất cả" || onlyInStock;

  const displayedCategories = showAllCategories ? categories : categories.slice(0, 6);
  const displayedBrands = showAllBrands ? brands : brands.slice(0, 6);

  return (
    <div className={`space-y-4 ${isMobileModal ? "" : "w-full lg:w-[260px] shrink-0"}`}>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs divide-y divide-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-lonking-600" />
            <span>Bộ Lọc Kỹ Thuật</span>
          </div>
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-lonking-600 transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>

        {/* Section 1: Availability Status */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("stock")}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wide py-1"
          >
            <span className="flex items-center gap-1.5">
              <Box className="h-3.5 w-3.5 text-slate-400" />
              Tình Trạng Kho
            </span>
            {openSections.stock ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.stock && (
            <div className="pt-2">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer select-none transition-colors border border-slate-200/60">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Chỉ hàng sẵn kho
                </span>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={onToggleOnlyInStock}
                  className="h-4 w-4 rounded border-slate-300 text-lonking-500 focus:ring-lonking-500/20 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* Section 2: Categories (Collapsible & Clean Chips) */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("categories")}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wide py-1"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Nhóm Phụ Tùng ({categories.length})
            </span>
            {openSections.categories ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.categories && (
            <div className="pt-2 space-y-1">
              <button
                onClick={() => onSelectCategory("Tất cả")}
                className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-all ${
                  selectedCategory === "Tất cả"
                    ? "bg-slate-900 text-white font-bold shadow-2xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Tất cả nhóm</span>
                <span
                  className={`font-mono text-[11px] ${
                    selectedCategory === "Tất cả" ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {totalAvailable}
                </span>
              </button>

              {displayedCategories.map((cat) => {
                const active = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => onSelectCategory(cat.name)}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-all ${
                      active
                        ? "bg-slate-900 text-white font-bold shadow-2xs"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate text-left">{cat.name}</span>
                    <span
                      className={`font-mono text-[11px] shrink-0 ml-1.5 ${
                        active ? "text-lonking-400 font-bold" : "text-slate-400"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}

              {categories.length > 6 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="w-full text-center py-1 text-[11px] font-semibold text-lonking-600 hover:underline"
                >
                  {showAllCategories ? "Thu gọn" : `+ Xem thêm ${categories.length - 6} nhóm`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Brands (Collapsible) */}
        <div className="py-3">
          <button
            onClick={() => toggleSection("brands")}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wide py-1"
          >
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              Hãng Sản Xuất ({brands.length})
            </span>
            {openSections.brands ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.brands && (
            <div className="pt-2 space-y-1">
              <button
                onClick={() => onSelectBrand("Tất cả")}
                className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-all ${
                  selectedBrand === "Tất cả"
                    ? "bg-slate-900 text-white font-bold shadow-2xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Tất cả hãng</span>
                <span
                  className={`font-mono text-[11px] ${
                    selectedBrand === "Tất cả" ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {totalAvailable}
                </span>
              </button>

              {displayedBrands.map((b) => {
                const active = selectedBrand === b.name;
                return (
                  <button
                    key={b.name}
                    onClick={() => onSelectBrand(b.name)}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-all ${
                      active
                        ? "bg-slate-900 text-white font-bold shadow-2xs"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate text-left">{b.name}</span>
                    <span
                      className={`font-mono text-[11px] shrink-0 ml-1.5 ${
                        active ? "text-lonking-400 font-bold" : "text-slate-400"
                      }`}
                    >
                      {b.count}
                    </span>
                  </button>
                );
              })}

              {brands.length > 6 && (
                <button
                  onClick={() => setShowAllBrands(!showAllBrands)}
                  className="w-full text-center py-1 text-[11px] font-semibold text-lonking-600 hover:underline"
                >
                  {showAllBrands ? "Thu gọn" : `+ Xem thêm ${brands.length - 6} hãng`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Box */}
      {!isMobileModal && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-500 flex items-center justify-between shadow-2xs">
          <span>Kết quả hiển thị:</span>
          <span className="font-mono font-bold text-slate-900">
            {totalFiltered} / {totalAvailable} mã
          </span>
        </div>
      )}
    </div>
  );
}
