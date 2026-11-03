"use client";

import React, { useState, useMemo } from "react";
import { Part, AttributeDefinition } from "@/types/inventory";
import { HighlightText } from "./HighlightText";
import { PartSvgPlaceholder } from "./PartSvgPlaceholder";
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
  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.id || "");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "inactive">("all");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const toast = useToast();

  // Lọc danh sách theo tab: Tất cả, Còn hàng, Hết hàng
  const filteredList = useMemo(() => {
    if (filterTab === "active") {
      return parts.filter((p) => p.totalDisplayStock > 0);
    }
    if (filterTab === "inactive") {
      return parts.filter((p) => p.totalDisplayStock <= 0);
    }
    return parts;
  }, [parts, filterTab]);

  const activeCount = useMemo(() => parts.filter((p) => p.totalDisplayStock > 0).length, [parts]);
  const inactiveCount = useMemo(() => parts.filter((p) => p.totalDisplayStock <= 0).length, [parts]);

  const selectedPart = parts.find((p) => p.id === selectedPartId) || filteredList[0] || parts[0];

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

  const isInCart = selectedPart ? cartItemIds.has(selectedPart.id) : false;

  const zaloUrl = selectedPart
    ? `https://zalo.me/0909123456?text=${encodeURIComponent(
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
            Tất cả ({parts.length})
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
              const inStock = part.totalDisplayStock > 0;

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
                        Tồn: <strong className="text-slate-700">{part.totalDisplayStock} {part.unit}</strong>
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

              {/* Ảnh sản phẩm lớn vuông bo góc */}
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/90 flex items-center justify-center shadow-inner">
                {selectedPart.images && selectedPart.images.length > 0 ? (
                  <img
                    src={selectedPart.images[0]}
                    alt={selectedPart.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PartSvgPlaceholder
                    category={selectedPart.category}
                    partNumber={selectedPart.partNumber}
                    className="h-full w-full"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 4 THẺ THÔNG TIN MODULE (Lưới 2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Thẻ A: Thông tin bán hàng */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Thông Tin Bán Hàng
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tài khoản doanh thu</span>
                  <span className="font-medium text-slate-700">511 - Doanh thu bán phụ tùng cơ giới</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Thuế GTGT</span>
                    <span className="font-medium text-slate-700">Chịu thuế (VAT 10%)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Giá niêm yết</span>
                    <span className="font-bold text-slate-900">Liên hệ báo giá</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Chính sách bán hàng</span>
                  <span className="text-slate-500 italic">Bảo hành chính hãng Lonking OEM</span>
                </div>
              </div>
            </div>

            {/* Thẻ B: Thông tin mua hàng & Giá vốn */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Thông Tin Mua Hàng & Giá Vốn
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tài khoản giá vốn</span>
                  <span className="font-medium text-slate-700">632 - Giá vốn hàng phụ tùng bán</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nhà cung cấp</span>
                    <span className="font-medium text-slate-700">Tập đoàn {selectedPart.brand}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Giá vốn kho</span>
                    <span className="font-bold text-slate-900 font-mono">Đồng bộ MISA</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nguồn gốc xuất xứ</span>
                  <span className="text-slate-500 italic">Nhập khẩu chính ngạch tiêu chuẩn OEM</span>
                </div>
              </div>
            </div>

            {/* Thẻ C: Thông tin quản trị kho */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Thông Tin Quản Trị Kho
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tài khoản kho</span>
                  <span className="font-medium text-slate-700">156 - Kho phụ tùng Miền Nam</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tồn đầu kỳ</span>
                    <span className="font-medium text-slate-700">
                      {Math.max(0, selectedPart.totalDisplayStock - 5)} {selectedPart.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tồn thực tế khả dụng</span>
                    <span className="font-bold text-emerald-700">
                      {selectedPart.totalDisplayStock} {selectedPart.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thẻ D: Trạng thái chứng từ & Nút tác vụ */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">SL chờ xuất hóa đơn</span>
                  <span className="font-bold text-slate-800 text-sm">0</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">SL chờ thanh toán</span>
                  <span className="font-bold text-slate-800 text-sm">0</span>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onAddToCart(selectedPart)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs active:scale-95 ${
                    isInCart
                      ? "bg-emerald-600 text-white"
                      : "bg-[#544df8] text-white hover:bg-[#463fe6]"
                  }`}
                >
                  {isInCart ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      Đã Có Trong Báo Giá
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-2xs"
                >
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Báo Giá Zalo
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
