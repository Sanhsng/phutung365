"use client";

import React, { useState, useMemo } from "react";
import { Part, AttributeDefinition } from "@/types/inventory";
import { useInventory } from "@/lib/store";
import { getFriendlyWarehouseName } from "@/lib/seed-data";
import { HighlightText } from "./HighlightText";
import { PartSvgPlaceholder } from "./PartSvgPlaceholder";
import { ImageZoomModal } from "./ImageZoomModal";
import {
  Check,
  Copy,
  Plus,
  CheckCheck,
  MessageCircle,
  PhoneCall,
  Edit2,
  ChevronDown,
  X,
  Share2,
  FileText,
  Boxes,
  Info,
  Wrench,
  ShieldCheck,
  Maximize2,
  MapPin,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface MasterDetailViewProps {
  parts: Part[];
  searchQuery: string;
  onAddToCart: (part: Part) => void;
  cartItemIds: Set<string>;
  publicAttributes: AttributeDefinition[];
  onOpenDetailModal?: (part: Part) => void;
}

/**
 * Master-Detail Catalog View
 * 100% Vietnamese localization with exact visual layout from Reference Image 1
 */
export function MasterDetailView({
  parts,
  searchQuery,
  onAddToCart,
  cartItemIds,
  publicAttributes,
  onOpenDetailModal,
}: MasterDetailViewProps) {
  const { hotlinePhone, warehouses } = useInventory();
  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.id || "");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "inactive">("all");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>("all");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const toast = useToast();

  // Đếm số lượng theo từng kho
  const warehouseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    warehouses.forEach((wh) => {
      counts[wh.id] = parts.filter(
        (p) => (p.warehouseStocks?.[wh.id]?.stockQty ?? 0) > 0
      ).length;
    });
    return counts;
  }, [warehouses, parts]);

  // Lọc theo kho trước
  const partsByWarehouse = useMemo(() => {
    if (selectedWarehouseFilter === "all") return parts;
    return parts.filter(
      (p) => (p.warehouseStocks?.[selectedWarehouseFilter]?.stockQty ?? 0) > 0
    );
  }, [parts, selectedWarehouseFilter]);

  // Lọc danh sách theo tab: Tất cả, Còn hàng, Hết hàng
  const filteredList = useMemo(() => {
    if (filterTab === "active") {
      return partsByWarehouse.filter((p) => {
        if (selectedWarehouseFilter !== "all") {
          return (p.warehouseStocks?.[selectedWarehouseFilter]?.stockQty ?? 0) > 0;
        }
        return p.totalDisplayStock > 0;
      });
    }
    if (filterTab === "inactive") {
      return partsByWarehouse.filter((p) => {
        if (selectedWarehouseFilter !== "all") {
          return (p.warehouseStocks?.[selectedWarehouseFilter]?.stockQty ?? 0) <= 0;
        }
        return p.totalDisplayStock <= 0;
      });
    }
    return partsByWarehouse;
  }, [partsByWarehouse, filterTab, selectedWarehouseFilter]);

  const activeCount = useMemo(() => {
    if (selectedWarehouseFilter !== "all") {
      return parts.filter(
        (p) => (p.warehouseStocks?.[selectedWarehouseFilter]?.stockQty ?? 0) > 0
      ).length;
    }
    return parts.filter((p) => p.totalDisplayStock > 0).length;
  }, [parts, selectedWarehouseFilter]);

  const inactiveCount = useMemo(() => {
    if (selectedWarehouseFilter !== "all") {
      return parts.filter(
        (p) => (p.warehouseStocks?.[selectedWarehouseFilter]?.stockQty ?? 0) <= 0
      ).length;
    }
    return parts.filter((p) => p.totalDisplayStock <= 0).length;
  }, [parts, selectedWarehouseFilter]);

  const selectedPart =
    filteredList.find((p) => p.id === selectedPartId) ||
    filteredList[0] ||
    parts.find((p) => p.id === selectedPartId) ||
    parts[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Đã sao chép mã", code);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(checkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedIds(next);
  };

  const toggleCheckAll = () => {
    if (checkedIds.size === filteredList.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filteredList.map((p) => p.id)));
    }
  };

  const handleBatchAddToCart = () => {
    if (checkedIds.size === 0) return;
    let count = 0;
    parts.forEach((p) => {
      if (checkedIds.has(p.id) && !cartItemIds.has(p.id)) {
        onAddToCart(p);
        count++;
      }
    });
    toast.success("Đã thêm vào giỏ", `Đã thêm ${count} phụ tùng đã chọn vào giỏ báo giá`);
    setCheckedIds(new Set());
  };

  if (!selectedPart && parts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        Không có phụ tùng phù hợp với điều kiện hiển thị.
      </div>
    );
  }

  const cleanHotline = (hotlinePhone || "0909123456").replace(/\D/g, "");

  const isInCart = selectedPart ? cartItemIds.has(selectedPart.id) : false;

  const zaloUrl = selectedPart
    ? `https://zalo.me/${cleanHotline}?text=${encodeURIComponent(
        `Chào bạn, tôi cần báo giá phụ tùng [${selectedPart.partNumber}] - ${selectedPart.name} (Tương thích máy: ${
          selectedPart.compatibleModels.join(", ") || "Dùng chung"
        }).`
      )}`
    : "#";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ======================================================== */}
      {/* CỘT TRÁI: MASTER LIST (Danh sách tổng quan)             */}
      {/* ======================================================== */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col">
        {/* Bộ lọc Vị trí Kho */}
        <div className="mb-2.5 flex items-center justify-between gap-2 bg-slate-50/80 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 shrink-0">
            <MapPin className="h-3.5 w-3.5 text-lonking-600 shrink-0" />
            <span>Kho:</span>
          </div>
          <select
            value={selectedWarehouseFilter}
            onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
            className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả kho ({parts.length} mã)</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {getFriendlyWarehouseName(wh.id, wh.name)} ({warehouseCounts[wh.id] ?? 0} mã)
              </option>
            ))}
          </select>
        </div>

        {/* Hàng nút lọc dạng viên thuốc (Tất cả, Còn hàng, Hết hàng) */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              filterTab === "all"
                ? "bg-[#544df8] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            Tất cả ({partsByWarehouse.length})
          </button>

          <button
            onClick={() => setFilterTab("active")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterTab === "active"
                ? "bg-[#544df8] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            Còn hàng ({activeCount})
          </button>

          <button
            onClick={() => setFilterTab("inactive")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterTab === "inactive"
                ? "bg-[#544df8] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            Hết hàng ({inactiveCount})
          </button>

          {checkedIds.size > 0 && (
            <button
              onClick={handleBatchAddToCart}
              className="ml-auto text-[11px] font-bold text-[#544df8] hover:underline"
            >
              Chọn ({checkedIds.size})
            </button>
          )}
        </div>

        {/* Khung viền danh sách phụ tùng */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden">
          {/* Tiêu đề bảng: Checkbox + Tên & Mô tả */}
          <div className="bg-slate-50/70 border-b border-slate-200/80 px-3 py-2.5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={checkedIds.size === filteredList.length && filteredList.length > 0}
              onChange={toggleCheckAll}
              className="h-4 w-4 rounded border-slate-300 text-[#544df8] focus:ring-[#544df8] cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-600">
              Mã & Tên phụ tùng
            </span>
            <span className="ml-auto text-[11px] font-mono text-slate-400">
              {filteredList.length} mã
            </span>
          </div>

          {/* Danh sách các dòng phụ tùng */}
          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredList.map((part) => {
              const isSelected = selectedPart?.id === part.id;
              const isChecked = checkedIds.has(part.id);
              const hasImg = part.images && part.images.length > 0;
              const itemStock = selectedWarehouseFilter !== "all"
                ? (part.warehouseStocks?.[selectedWarehouseFilter]?.stockQty ?? 0)
                : part.totalDisplayStock;
              const inStock = itemStock > 0;

              return (
                <div
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id)}
                  className={`px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-100/80 font-medium"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Checkbox từng dòng */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onClick={(e) => toggleCheck(part.id, e)}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-slate-300 text-[#544df8] focus:ring-[#544df8] cursor-pointer"
                  />

                  {/* Ảnh thu nhỏ vuông bo góc */}
                  <div className="h-10 w-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 flex items-center justify-center">
                    {hasImg ? (
                      <img
                        src={part.images[0]}
                        alt={part.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <PartSvgPlaceholder
                        category={part.category}
                        partNumber={part.partNumber}
                        className="h-full w-full"
                      />
                    )}
                  </div>

                  {/* Tên & Số lượng tồn */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      <HighlightText text={part.name} query={searchQuery} />
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          inStock ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <span>
                        Tồn: <strong className="text-slate-700">{itemStock} {part.unit}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Mã SKU phụ tùng */}
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {part.partNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CỘT PHẢI: CHI TIẾT SẢN PHẨM                              */}
      {/* ========================================================= */}
      {selectedPart && (
        <div className="lg:col-span-7 space-y-4">
          {/* Header Chi tiết phụ tùng */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
              Chi Tiết Phụ Tùng
            </h2>

            <div className="flex items-center gap-2">
              {/* Nút sửa / xem bản vẽ */}
              {onOpenDetailModal && (
                <button
                  onClick={() => onOpenDetailModal(selectedPart)}
                  className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors"
                  title="Xem thông số kỹ thuật đầy đủ"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Menu Tác vụ */}
              <div className="relative">
                <button
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <span>Tác vụ</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {isActionsOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-20 text-xs">
                    <button
                      onClick={() => {
                        handleCopy(selectedPart.partNumber);
                        setIsActionsOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      Sao chép mã phụ tùng
                    </button>
                    <a
                      href={zaloUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsActionsOpen(false)}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                      Yêu cầu báo giá Zalo
                    </a>
                    {onOpenDetailModal && (
                      <button
                        onClick={() => {
                          onOpenDetailModal(selectedPart);
                          setIsActionsOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        Bản vẽ kỹ thuật & Kích thước
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Nút Đóng */}
              {onOpenDetailModal && (
                <button
                  onClick={() => onOpenDetailModal(selectedPart)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  title="Thu gọn"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* THẺ 1: THÔNG TIN TỔNG QUAN PHỤ TÙNG */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                {/* Tên & Trạng thái tồn kho */}
                <div className="flex items-start justify-between">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                    {selectedPart.name}
                  </h3>
                  <span
                    className={`ml-2 px-3 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                      selectedPart.totalDisplayStock > 0
                        ? "bg-[#e7f8ee] text-[#12a150]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {selectedPart.totalDisplayStock > 0 ? "Còn hàng" : "Tạm hết"}
                  </span>
                </div>

                {/* Đơn vị tính & Mã phụ tùng */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Đơn vị tính</span>
                    <span className="font-semibold text-slate-800">{selectedPart.unit || "Cái"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Mã phụ tùng (SKU)</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      {selectedPart.partNumber}
                      <button
                        onClick={() => handleCopy(selectedPart.partNumber)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Sao chép"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </span>
                  </div>
                </div>

                {/* Mô tả kỹ thuật */}
                <div className="text-xs">
                  <span className="text-slate-400 block mb-0.5">Mô tả kỹ thuật</span>
                  <p className="text-slate-700">
                    Phụ tùng chính hãng OEM cho dòng máy{" "}
                    <strong>{selectedPart.compatibleModels.join(", ") || "Lonking đa năng"}</strong>.{" "}
                    {selectedPart.crossRefNumbers.length > 0 && (
                      <span className="text-slate-500">
                        (Mã thay thế tương đương: {selectedPart.crossRefNumbers.join(", ")})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Ảnh sản phẩm lớn vuông bo góc - Hỗ trợ bấm phóng to */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="group relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/90 flex items-center justify-center shadow-inner cursor-zoom-in hover:border-amber-400 hover:shadow-md transition-all text-left"
                title="Bấm để xem ảnh phóng to"
              >
                {selectedPart.images && selectedPart.images.length > 0 ? (
                  <img
                    src={selectedPart.images[0]}
                    alt={selectedPart.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <PartSvgPlaceholder
                    category={selectedPart.category}
                    partNumber={selectedPart.partNumber}
                    className="h-full w-full group-hover:scale-105 transition-transform duration-200"
                  />
                )}
                {/* Overlay hover icon phóng to */}
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-1.5 rounded-full bg-slate-900/70 text-white backdrop-blur-xs shadow-md">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 4 THẺ THÔNG TIN MODULE DÀNH CHO TRA CỨU PHỤ TÙNG (Lưới 2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* THẺ 1: THÔNG SỐ KỸ THUẬT & DÒNG MÁY TƯƠNG THÍCH */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-500" />
                  <span>Thông Số & Lắp Ráp Máy</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  {selectedPart.brand}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Dòng máy tương thích */}
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium mb-1">Dòng máy tương thích:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPart.compatibleModels.length > 0 ? (
                      selectedPart.compatibleModels.map((model, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold px-2 py-0.5 text-[11px]"
                        >
                          {model}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">Dùng chung cho nhiều dòng xe / máy cơ giới</span>
                    )}
                  </div>
                </div>

                {/* Phân loại & Hệ thống */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hệ thống cụm</span>
                    <span className="font-semibold text-slate-800">{selectedPart.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Thương hiệu</span>
                    <span className="font-semibold text-slate-800">{selectedPart.brand}</span>
                  </div>
                </div>

                {/* Thuộc tính mở rộng nếu có */}
                {selectedPart.customAttributes && Object.keys(selectedPart.customAttributes).length > 0 && (
                  <div className="pt-1 border-t border-slate-50">
                    <span className="text-slate-400 block text-[11px] mb-1">Đặc tính kỹ thuật:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {Object.entries(selectedPart.customAttributes).map(([k, v]) => {
                        const attrDef = publicAttributes.find((a) => a.key === k);
                        const label = attrDef ? attrDef.name : k;
                        return (
                          <div key={k} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block">{label}:</span>
                            <span className="font-mono font-bold text-slate-800">{String(v)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* THẺ 2: MÃ PHỤ TÙNG & MÃ TRA CỨU CHÉO */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Mã Tra Cứu & Mã Chéo</span>
                </h4>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Chuẩn OEM
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Mã chính */}
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium mb-0.5">Mã chính thức (OEM Code):</span>
                  <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                      {selectedPart.partNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(selectedPart.partNumber)}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                      title="Sao chép mã"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Mã tương đương / Mã chéo (Cross-Reference) */}
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium mb-1">Mã tương đương / Thay thế chéo:</span>
                  {selectedPart.crossRefNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPart.crossRefNumbers.map((ref, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCopy(ref)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors"
                          title="Sao chép mã thay thế"
                        >
                          <span>{ref}</span>
                          <Copy className="h-2.5 w-2.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Mã gốc tiêu chuẩn từ nhà sản xuất</span>
                  )}
                </div>

                {/* Mã định danh MISA / Quản lý kho */}
                <div className="pt-1 border-t border-slate-50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Mã quản trị hệ thống:</span>
                  <span className="font-mono text-slate-600 font-medium truncate max-w-[180px]" title={selectedPart.misaRawCode}>
                    {selectedPart.misaRawCode}
                  </span>
                </div>
              </div>
            </div>

            {/* THẺ 3: TỒN KHO THỰC TẾ & GIAO HÀNG */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-emerald-600" />
                  <span>Tồn Kho & Cung Ứng</span>
                </h4>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedPart.totalDisplayStock > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {selectedPart.totalDisplayStock > 0 ? "Sẵn sàng giao" : "Đặt hàng"}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Tồn thực tế khả dụng */}
                <div className="flex items-baseline justify-between bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5">
                  <span className="text-slate-600 font-medium">Tồn khả dụng kho bán:</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {selectedPart.totalDisplayStock}
                    </span>
                    <span className="ml-1 text-xs font-semibold text-emerald-800">
                      {selectedPart.unit}
                    </span>
                  </div>
                </div>

                {/* Chi tiết tồn theo kho */}
                <div className="space-y-1 text-[11px]">
                  <span className="text-slate-400 block font-medium">Vị trí kho lưu trữ:</span>
                  {warehouses && warehouses.filter(w => w.includeInWebStock).map(wh => {
                    const stock = selectedPart.warehouseStocks[wh.id]?.stockQty ?? 0;
                    return (
                      <div key={wh.id} className="flex items-center justify-between text-slate-700 py-0.5">
                        <span className="truncate">{getFriendlyWarehouseName(wh.id, wh.name)}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {stock > 0 ? `${stock} ${selectedPart.unit}` : "0"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Thời gian giao hàng dự kiến */}
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Tiến độ giao hàng:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPart.totalDisplayStock > 0 ? "Giao nhanh 2 - 4h" : "Liên hệ 2 - 5 ngày"}
                  </span>
                </div>
              </div>
            </div>

            {/* THẺ 4: BÁO GIÁ & THAO TÁC HỎI HÀNG */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    <span>Báo Giá & Bảo Hành</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Chiết khấu tốt
                  </span>
                </div>

                <div className="space-y-2 text-xs mt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Đơn giá niêm yết:</span>
                    <span className="font-bold text-slate-900 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                      Liên hệ báo giá ưu đãi
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Chế độ bảo hành:</span>
                    <span className="font-semibold text-slate-700 text-[11px]">06 - 12 tháng chính hãng</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Hỗ trợ kỹ thuật:</span>
                    <span className="text-slate-600 text-[11px]">Tư vấn lắp đặt & kiểm tra mã miễn phí</span>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                <button
                  onClick={() => onAddToCart(selectedPart)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs active:scale-95 ${
                    isInCart
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "btn-lonking text-slate-950"
                  }`}
                >
                  {isInCart ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      Đã Thêm Vào Giỏ
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Thêm Vào Báo Giá
                    </>
                  )}
                </button>

                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 px-3.5 py-2.5 text-xs font-bold text-blue-700 transition-colors shadow-2xs"
                >
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  Báo Giá Zalo
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phóng To Ảnh Phụ Tùng */}
      {selectedPart && (
        <ImageZoomModal
          isOpen={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          images={selectedPart.images}
          partNumber={selectedPart.partNumber}
          partName={selectedPart.name}
          category={selectedPart.category}
        />
      )}
    </div>
  );
}
