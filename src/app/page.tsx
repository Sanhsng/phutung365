"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useInventory } from "@/lib/store";
import { Part } from "@/types/inventory";
import { normalizeCode, matchesPartSearch } from "@/lib/misa-parser";
import { getFriendlyWarehouseName } from "@/lib/seed-data";
import { MasterDetailView } from "@/components/storefront/MasterDetailView";
import { MobileProductListItem } from "@/components/storefront/MobileProductListItem";
import { TechnicalTableView } from "@/components/storefront/TechnicalTableView";
import { PartCard } from "@/components/storefront/PartCard";
import { PartDetailModal } from "@/components/storefront/PartDetailModal";
import { QuoteCartDrawer, QuoteCartItem } from "@/components/storefront/QuoteCartDrawer";
import { MobileFilterSheet } from "@/components/storefront/MobileFilterSheet";
import {
  LayoutGrid,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Menu,
  Plus,
  RefreshCw,
  Boxes,
  PhoneCall,
  Check,
  X,
  List,
  Columns,
  Sparkles,
} from "lucide-react";

export default function StorefrontPage() {
  const { parts, attributes, isLoaded, warehouses } = useInventory();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedModel, setSelectedModel] = useState("Tất cả");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Top Canvas Capsule Navigation Tab (Mặc định vào tab Danh Sách Chi Tiết): "products" | "price_lists" | "stock_adjustments"
  const [topTab, setTopTab] = useState<"products" | "price_lists" | "stock_adjustments">("price_lists");

  // Desktop View Mode: "master" | "grid" | "table" (Mặc định hiển thị bảng Danh Sách Chi Tiết)
  const [viewMode, setViewMode] = useState<"master" | "grid" | "table">("table");

  // Mobile Filter Sheet
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Cart
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<QuoteCartItem[]>([]);
  const [showSearchInput, setShowSearchInput] = useState(true);

  // Tải giỏ hàng từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("phutung_quote_cart_v1");
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Lỗi đọc giỏ hàng:", e);
    }
  }, []);

  const saveCart = (items: QuoteCartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem("phutung_quote_cart_v1", JSON.stringify(items));
    } catch (e) {
      console.error("Lỗi lưu giỏ hàng:", e);
    }
  };

  const handleAddToCart = (part: Part) => {
    const existingIndex = cartItems.findIndex((item) => item.part.id === part.id);
    let next: QuoteCartItem[];
    if (existingIndex >= 0) {
      next = cartItems.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      next = [...cartItems, { part, quantity: 1 }];
    }
    saveCart(next);
  };

  const cartItemIds = useMemo(() => {
    return new Set(cartItems.map((item) => item.part.id));
  }, [cartItems]);

  const visibleParts = useMemo(() => {
    return parts.filter((p) => p.isVisible);
  }, [parts]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    visibleParts.forEach((p) => set.add(p.category));
    return ["Tất cả", ...Array.from(set)];
  }, [visibleParts]);

  // Models list
  const models = useMemo(() => {
    const set = new Set<string>();
    visibleParts.forEach((p) => p.compatibleModels.forEach((m) => set.add(m)));
    return ["Tất cả", ...Array.from(set)];
  }, [visibleParts]);

  // Danh sách vị trí kho kèm số lượng tồn
  const warehouseOptions = useMemo(() => {
    return warehouses.map((wh) => ({
      id: wh.id,
      name: getFriendlyWarehouseName(wh.id, wh.name),
      count: visibleParts.filter(
        (p) => (p.warehouseStocks?.[wh.id]?.stockQty ?? 0) > 0
      ).length,
    }));
  }, [warehouses, visibleParts]);

  const publicAttributes = useMemo(() => {
    return attributes.filter((attr) => attr.isPublic);
  }, [attributes]);

  // Bộ lọc danh mục, dòng máy, từ khóa tìm kiếm (chưa áp dụng kho)
  const partsMatchingFilters = useMemo(() => {
    return visibleParts.filter((part) => {
      if (selectedCategory !== "Tất cả" && part.category !== selectedCategory) {
        return false;
      }
      if (selectedModel !== "Tất cả" && !part.compatibleModels.includes(selectedModel)) {
        return false;
      }
      if (onlyInStock && part.totalDisplayStock <= 0) {
        return false;
      }

      return matchesPartSearch(part, searchQuery);
    });
  }, [visibleParts, searchQuery, selectedCategory, selectedModel, onlyInStock]);

  // Danh sách sau khi áp dụng kho được chọn
  const filteredParts = useMemo(() => {
    if (selectedWarehouse === "all") return partsMatchingFilters;
    return partsMatchingFilters.filter((part) => {
      const whStock = part.warehouseStocks?.[selectedWarehouse]?.stockQty ?? 0;
      return whStock > 0;
    });
  }, [partsMatchingFilters, selectedWarehouse]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffc000] text-slate-950 shadow-md">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
          <span className="font-mono text-xs font-bold tracking-wider text-slate-700 uppercase">
            ĐANG TẢI KHO PHỤ TÙNG 365...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECEEF1] text-slate-900 selection:bg-[#ffc000] selection:text-slate-950 font-sans">
      {/* ========================================================= */}
      {/* 1. MOBILE VIEW (Exact Match with User Reference Image 2)  */}
      {/* ========================================================= */}
      <div className="sm:hidden min-h-screen bg-white flex flex-col pb-24">
        {/* Top Header: Hamburger menu | Products heading | QR scanner */}
        <div className="bg-[#fcb710] px-4 py-4 min-h-[20px] flex items-center justify-between border-b border-amber-600/20 text-slate-950 shadow-xs">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="p-1.5 -ml-1.5 text-slate-950 hover:bg-black/5 rounded-lg transition-colors"
            title="Menu / Bộ lọc"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="text-lg font-bold text-slate-950 tracking-tight">
            Danh Mục Phụ Tùng
          </h1>

          <Link
            href="/admin"
            className="h-9 w-9 rounded-full bg-white border border-white/90 overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xs p-1 shrink-0"
            title="Vào trang quản trị kho"
          >
            <img
              src="/images/logo-365.png"
              alt="Logo Phụ Tùng 365"
              className="h-full w-full object-contain"
            />
          </Link>
        </div>

        {/* Ô tìm kiếm dạng viên thuốc (Chuẩn Image 2) */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã phụ tùng, tên, model máy..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hàng lọc nhanh: Nhóm: Tất cả ⌵  Kho: Tất cả ⌵  Dòng máy: Tất cả ⌵ (Chuẩn Image 2) */}
        <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-1 cursor-pointer truncate" onClick={() => setIsMobileFilterOpen(true)}>
            <span>Nhóm:</span>
            <strong className="text-slate-900 font-semibold truncate max-w-[80px]">{selectedCategory}</strong>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>

          <div className="flex items-center gap-1 cursor-pointer truncate" onClick={() => setIsMobileFilterOpen(true)}>
            <span>Kho:</span>
            <strong className="text-slate-900 font-semibold truncate max-w-[90px]">
              {selectedWarehouse === "all"
                ? "Tất cả"
                : getFriendlyWarehouseName(selectedWarehouse, warehouses.find((w) => w.id === selectedWarehouse)?.name).replace("Kho ", "") || "Kho"}
            </strong>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>

          <div className="flex items-center gap-1 cursor-pointer truncate" onClick={() => setIsMobileFilterOpen(true)}>
            <span>Máy:</span>
            <strong className="text-slate-900 font-semibold truncate max-w-[70px]">
              {selectedModel === "Tất cả" ? "Tất cả" : selectedModel}
            </strong>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Danh sách thẻ sản phẩm Mobile */}
        <div className="flex-1 divide-y divide-slate-100">
          {filteredParts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 px-4">
              Không tìm thấy phụ tùng phù hợp với tiêu chí lọc.
            </div>
          ) : (
            filteredParts.map((part) => (
              <MobileProductListItem
                key={part.id}
                part={part}
                searchQuery={searchQuery}
                onOpenDetail={(p) => setSelectedPart(p)}
                onAddToCart={(p) => handleAddToCart(p)}
                isInCart={cartItemIds.has(part.id)}
              />
            ))
          )}
        </div>

        {/* Nút hành động nổi (FAB) màu đỏ mận (Chuẩn Image 2) */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-5 z-40 h-14 w-14 rounded-full bg-[#8c2518] text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
          title="Mở giỏ báo giá"
        >
          <Plus className="h-7 w-7" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ffc000] text-slate-950 font-mono text-[10px] font-bold shadow-md">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. GIAO DIỆN DESKTOP (Chuẩn User Reference Image 1)        */}
      {/* ========================================================= */}
      <div className="hidden sm:block py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Khung thẻ Canvas bo góc lớn */}
        <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Thanh Top Bar Header: Nút 9 chấm | Tab dạng viên thuốc | Search & Avatar */}
          <div className="bg-[#fcb710] px-6 sm:px-8 py-6 sm:py-7 min-h-[40px] flex items-center justify-between gap-4 border-b border-amber-500/30">
            {/* Trái: Nút lưới 9 chấm */}
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setViewMode(viewMode === "master" ? "grid" : "master")}
                className="h-11 w-11 rounded-xl bg-slate-900 text-white shadow-xs flex items-center justify-center hover:bg-slate-800 transition-colors"
                title="Chuyển chế độ xem Master-Detail / Lưới thẻ"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>

              <div className="hidden md:flex flex-col">
                <span className="font-mono text-sm font-black text-slate-950 tracking-tight">
                  KHO PHỤ TÙNG 365
                </span>
                <span className="text-[11px] text-slate-900/80 font-mono font-medium">
                  Phụ Tùng Cơ Giới Chính Hãng OEM
                </span>
              </div>
            </div>

            {/* Giữa: Tab chuyển đổi dạng viên thuốc (Danh mục, Bảng giá) */}
            <div className="bg-black/10 p-1.5 rounded-full flex items-center gap-1 shadow-inner backdrop-blur-xs">
              <button
                onClick={() => {
                  setTopTab("products");
                  setViewMode("master");
                }}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${topTab === "products"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-900/80 hover:text-slate-950 hover:bg-white/20"
                  }`}
              >
                Danh Sách Chi Tiết
              </button>

              <button
                onClick={() => {
                  setTopTab("price_lists");
                  setViewMode("table");
                }}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${topTab === "price_lists"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-900/80 hover:text-slate-950 hover:bg-white/20"
                  }`}
              >
                Danh Mục Phụ Tùng
              </button>
            </div>

            {/* Phải: Tìm kiếm & Nút Giỏ báo giá & Avatar */}
            <div className="flex items-center gap-3">
              {/* Ô tìm kiếm mở rộng / Nút tìm kiếm */}
              {showSearchInput ? (
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm mã SKU, tên phụ tùng..."
                    autoFocus
                    className="h-11 rounded-full border border-slate-300 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 w-64 shadow-xs"
                  />
                  <button
                    onClick={() => {
                      if (searchQuery) {
                        setSearchQuery("");
                      } else {
                        setShowSearchInput(false);
                      }
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                    title={searchQuery ? "Xóa từ khóa tìm kiếm" : "Thu gọn ô tìm kiếm"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearchInput(true)}
                  className="h-11 w-11 rounded-full bg-white hover:bg-slate-50 border border-slate-300/80 flex items-center justify-center text-slate-800 hover:text-slate-950 transition-all shadow-xs hover:scale-105 active:scale-95"
                  title="Tìm kiếm phụ tùng"
                >
                  <Search className="h-5 w-5" strokeWidth={2.2} />
                </button>
              )}

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative h-11 rounded-full bg-white hover:bg-slate-50 border border-slate-300/80 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-xs hover:shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0 whitespace-nowrap ${cartItems.length > 0 ? "pl-5 pr-3.5" : "px-5"
                  }`}
                title="Giỏ báo giá"
              >
                <span>Hỏi giá</span>
                {cartItems.length > 0 && (
                  <span className="flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full bg-[#544df8] text-white text-[11px] font-bold leading-none shrink-0 shadow-2xs">
                    {cartItems.length}
                  </span>
                )}
              </button>

              {/* User Avatar Circle (Image 1 Style) */}
              <Link
                href="/admin"
                className="h-11 w-11 rounded-full bg-white border-2 border-white/90 overflow-hidden flex items-center justify-center hover:scale-105 transition-transform shadow-xs p-1"
                title="Vào trang quản trị kho"
              >
                <img
                  src="/images/logo-365.png"
                  alt="Logo Phụ Tùng 365"
                  className="h-full w-full object-contain"
                />
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Under Top Bar: Master-Detail Catalog View (Image 1) or Table */}
            {topTab === "products" && viewMode === "master" && (
              <MasterDetailView
                parts={filteredParts}
                searchQuery={searchQuery}
                onAddToCart={handleAddToCart}
                cartItemIds={cartItemIds}
                publicAttributes={publicAttributes}
                onOpenDetailModal={(p) => setSelectedPart(p)}
              />
            )}

            {topTab === "products" && viewMode === "grid" && (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredParts.map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    searchQuery={searchQuery}
                    onOpenDetail={(p) => setSelectedPart(p)}
                    onAddToCart={(p) => handleAddToCart(p)}
                    isInCart={cartItemIds.has(part.id)}
                  />
                ))}
              </div>
            )}

            {(topTab === "price_lists" || viewMode === "table") && (
              <TechnicalTableView
                parts={filteredParts}
                allParts={partsMatchingFilters}
                searchQuery={searchQuery}
                onOpenDetail={(p) => setSelectedPart(p)}
                onAddToCart={(p) => handleAddToCart(p)}
                cartItemIds={cartItemIds}
                warehouses={warehouses}
                selectedWarehouse={selectedWarehouse}
                onSelectWarehouse={setSelectedWarehouse}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPart && (
        <PartDetailModal
          part={selectedPart}
          publicAttributes={publicAttributes}
          onClose={() => setSelectedPart(null)}
          onAddToCart={(p) => handleAddToCart(p)}
          isInCart={cartItemIds.has(selectedPart.id)}
        />
      )}

      {/* Quote Cart Drawer */}
      <QuoteCartDrawer
        items={cartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={(partId, qty) => {
          const next = cartItems
            .map((item) =>
              item.part.id === partId ? { ...item, quantity: qty } : item
            )
            .filter((item) => item.quantity > 0);
          saveCart(next);
        }}
        onRemoveItem={(partId) => {
          const next = cartItems.filter((item) => item.part.id !== partId);
          saveCart(next);
        }}
        onClearCart={() => saveCart([])}
      />

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        categories={categories.map((name) => ({
          name,
          count: name === "Tất cả" ? visibleParts.length : visibleParts.filter((p) => p.category === name).length,
        }))}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        brands={["Tất cả", "LONKING", "WEICHAI", "CUMMINS", "SHANGCHAI"].map((name) => ({
          name,
          count: name === "Tất cả" ? visibleParts.length : visibleParts.filter((p) => p.brand === name).length,
        }))}
        selectedBrand="Tất cả"
        onSelectBrand={() => { }}
        warehouses={warehouseOptions}
        selectedWarehouse={selectedWarehouse}
        onSelectWarehouse={setSelectedWarehouse}
        onlyInStock={onlyInStock}
        onToggleOnlyInStock={() => setOnlyInStock(!onlyInStock)}
        totalFiltered={filteredParts.length}
        totalAvailable={visibleParts.length}
        onResetFilters={() => {
          setSelectedCategory("Tất cả");
          setSelectedModel("Tất cả");
          setSelectedWarehouse("all");
          setOnlyInStock(false);
          setSearchQuery("");
        }}
      />
    </div>
  );
}
