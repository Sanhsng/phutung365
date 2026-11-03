"use client";

import React, { useState } from "react";
import { Part } from "@/types/inventory";
import { useInventory } from "@/lib/store";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/Toast";
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  Copy,
  Check,
  FileSpreadsheet,
  ArrowRight,
  Boxes,
  Download,
} from "lucide-react";

export interface QuoteCartItem {
  part: Part;
  quantity: number;
}

interface QuoteCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: QuoteCartItem[];
  onUpdateQuantity: (partId: string, quantity: number) => void;
  onRemoveItem: (partId: string) => void;
  onClearCart: () => void;
}

export function QuoteCartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: QuoteCartDrawerProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const { hotlinePhone } = useInventory();
  const cleanHotline = (hotlinePhone || "0909123456").replace(/\D/g, "");

  if (!isOpen) return null;

  const generateQuoteText = () => {
    let text = `YÊU CẦU BÁO GIÁ PHỤ TÙNG CƠ GIỚI MIỀN NAM - LONKING OEM\n`;
    text += `========================================\n`;
    if (customerName) text += `Người yêu cầu: ${customerName}\n`;
    if (customerPhone) text += `Số điện thoại: ${customerPhone}\n`;
    if (companyName) text += `Công ty/Dự án: ${companyName}\n`;
    if (note) text += `Model/Đời máy: ${note}\n`;
    text += `\nDANH SÁCH MÃ PHỤ TÙNG CẦN BÁO GIÁ (${items.length} mục):\n`;

    items.forEach((item, index) => {
      text += `${index + 1}. [${item.part.partNumber}] - ${item.part.name}\n`;
      text += `   Số lượng: ${item.quantity} ${item.part.unit}\n`;
      if (item.part.crossRefNumbers.length > 0) {
        text += `   Mã chéo: ${item.part.crossRefNumbers.join(", ")}\n`;
      }
      if (item.part.compatibleModels.length > 0) {
        text += `   Máy: ${item.part.compatibleModels.join(", ")}\n`;
      }
    });

    text += `========================================\n`;
    text += `Nhờ phòng kinh doanh kiểm tra kho và báo giá sớm. Trân trọng!`;
    return text;
  };

  const handleSendZalo = () => {
    const message = encodeURIComponent(generateQuoteText());
    const zaloUrl = `https://zalo.me/${cleanHotline}?text=${message}`;
    window.open(zaloUrl, "_blank");
    toast.success("Đang mở Zalo", "Nội dung báo giá đã được chuẩn bị sẵn.");
  };

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateQuoteText());
      setCopied(true);
      toast.success("Đã sao chép danh sách", "Nội dung đã được lưu vào bộ nhớ tạm.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Lỗi sao chép:", err);
      toast.error("Không thể sao chép", "Vui lòng cấp quyền truy cập clipboard.");
    }
  };

  const handleExportExcel = () => {
    try {
      const rows = items.map((item, idx) => ({
        "STT": idx + 1,
        "Mã Phụ Tùng": item.part.partNumber,
        "Mã MISA": item.part.misaRawCode,
        "Mã Thay Thế OEM": item.part.crossRefNumbers.join(", "),
        "Tên Phụ Tùng": item.part.name,
        "Số Lượng": item.quantity,
        "Đơn Vị Tính": item.part.unit,
        "Hãng": item.part.brand,
        "Dòng Máy Lắp Vừa": item.part.compatibleModels.join(", "),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column width
      ws["!cols"] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 18 },
        { wch: 22 },
        { wch: 35 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 30 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "DanhSachBaoGia");
      XLSX.writeFile(
        wb,
        `YeuCauBaoGia_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Xuất file Excel thành công", "File đã được tải xuống máy.");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      toast.error("Không thể xuất Excel", "Đã có lỗi xảy ra khi tạo file.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Liquid Glass Frosted Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-250">
          {/* 1. Drawer Header */}
          <div className="border-b border-slate-200 bg-slate-900 px-4 sm:px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lonking-500 text-slate-950 font-black">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  DANH SÁCH YÊU CẦU BÁO GIÁ
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  {items.length} mã phụ tùng đã chọn
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors touch-target sm:min-h-0 flex items-center justify-center"
              title="Đóng giỏ báo giá"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 2. Drawer Body (Items List + Optional Form) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3 border border-slate-200">
                  <Boxes className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Danh sách báo giá trống
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                  Bấm nút &quot;+ Hỏi giá&quot; trên các thẻ phụ tùng để gom mã vào danh sách này và nhận báo giá nhanh.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  Tiếp tục tra cứu
                </button>
              </div>
            ) : (
              <>
                {/* Header Action: Clear All */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    PHỤ TÙNG ĐÃ CHỌN ({items.length})
                  </span>
                  <button
                    onClick={onClearCart}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Xóa tất cả
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.part.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex items-start justify-between gap-3 transition-colors hover:border-slate-300"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900 tracking-tight">
                            {item.part.partNumber}
                          </span>
                          <span className="rounded bg-slate-200/80 px-1.5 py-0.2 font-mono text-[10px] text-slate-700">
                            {item.part.brand}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 truncate mt-0.5" title={item.part.name}>
                          {item.part.name}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                          <span>ĐVT: <strong className="text-slate-800 font-mono">{item.part.unit}</strong></span>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">
                            {item.part.compatibleModels.join(", ") || "Dùng chung"}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Control & Remove */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => onRemoveItem(item.part.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Xóa phụ tùng này"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden shadow-2xs">
                          <button
                            onClick={() =>
                              onUpdateQuantity(
                                item.part.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Giảm"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono text-xs font-bold px-2.5 py-1 text-slate-900 min-w-[28px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.part.id, item.quantity + 1)
                            }
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Tăng"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Customer Information Form */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    THÔNG TIN LIÊN HỆ ĐÍNH KÈM (TÙY CHỌN):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Họ tên người liên hệ..."
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-lonking-500 focus:outline-none focus:ring-1 focus:ring-lonking-500"
                    />

                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Số điện thoại / Zalo..."
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-lonking-500 focus:outline-none focus:ring-1 focus:ring-lonking-500 font-mono"
                    />
                  </div>

                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Tên công ty hoặc công trình xây dựng..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-lonking-500 focus:outline-none focus:ring-1 focus:ring-lonking-500"
                  />

                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm (VD: Cần gấp trong ngày, đời máy...)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-lonking-500 focus:outline-none focus:ring-1 focus:ring-lonking-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* 3. Drawer Sticky Footer */}
          {items.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/90 p-4 sm:p-5 space-y-2.5">
              {/* Primary CTA: Zalo (Lonking Yellow) */}
              <button
                onClick={handleSendZalo}
                className="w-full btn-lonking py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm touch-target"
              >
                <MessageCircle className="h-4 w-4 text-blue-700" />
                <span>Gửi Danh Sách Báo Giá Qua Zalo Ngay</span>
              </button>

              {/* Secondary Options: Excel Export & Copy */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs touch-target sm:min-h-0"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  Xuất File Excel
                </button>

                <button
                  onClick={handleCopyClipboard}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs touch-target sm:min-h-0"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span>{copied ? "Đã sao chép" : "Sao chép văn bản"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
