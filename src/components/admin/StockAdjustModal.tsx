"use client";

import React, { useState, useEffect } from "react";
import { Part, Warehouse } from "@/types/inventory";
import { getFriendlyWarehouseName } from "@/lib/seed-data";
import {
  X,
  Boxes,
  Plus,
  Minus,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Warehouse as WarehouseIcon,
} from "lucide-react";

interface StockAdjustModalProps {
  part: Part | null;
  warehouses: Warehouse[];
  onClose: () => void;
  onSave: (params: {
    partId: string;
    warehouseId: string;
    newQty: number;
    performedBy: string;
    notes: string;
    type: "in" | "out" | "adjust";
  }) => void;
}

export function StockAdjustModal({
  part,
  warehouses,
  onClose,
  onSave,
}: StockAdjustModalProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [newQty, setNewQty] = useState<number>(0);
  const [reason, setReason] = useState<string>("Kiểm kê định kỳ cân đối kho");
  const [customReason, setCustomReason] = useState<string>("");
  const [performedBy, setPerformedBy] = useState<string>("Admin (Thủ kho Miền Nam)");

  // Khi mở modal, tự động chọn kho đầu tiên
  useEffect(() => {
    if (part && warehouses.length > 0) {
      const defaultWh = warehouses[0].id;
      setSelectedWarehouseId(defaultWh);
      const qty = part.warehouseStocks[defaultWh]?.stockQty ?? 0;
      setCurrentQty(qty);
      setNewQty(qty);
    }
  }, [part, warehouses]);

  // Cập nhật số lượng hiện tại khi đổi kho
  const handleWarehouseChange = (whId: string) => {
    setSelectedWarehouseId(whId);
    if (part) {
      const qty = part.warehouseStocks[whId]?.stockQty ?? 0;
      setCurrentQty(qty);
      setNewQty(qty);
    }
  };

  if (!part) return null;

  const diff = newQty - currentQty;
  const adjustType: "in" | "out" | "adjust" =
    diff > 0 ? "in" : diff < 0 ? "out" : "adjust";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() ? `${reason}: ${customReason.trim()}` : reason;

    onSave({
      partId: part.id,
      warehouseId: selectedWarehouseId,
      newQty,
      performedBy,
      notes: finalReason,
      type: adjustType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Liquid Glass Frosted Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lonking-500 text-slate-950 font-bold">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Điều Chỉnh Tồn Kho Nhanh
              </h2>
              <p className="font-mono text-xs text-lonking-400 tracking-tight">
                {part.partNumber} • {part.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Warehouse Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <WarehouseIcon className="h-3.5 w-3.5 text-amber-600" />
              Chọn địa điểm kho điều chỉnh:
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {getFriendlyWarehouseName(wh.id, wh.name)} {wh.includeInWebStock ? "(Kho tính Web)" : "(Kho nội bộ)"}
                </option>
              ))}
            </select>
          </div>

          {/* Current & New Quantity Controls */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
            <div className="grid grid-cols-3 items-center text-center">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase">
                  Tồn hiện tại
                </span>
                <div
                  className={`font-mono text-xl font-bold tracking-tight mt-0.5 ${
                    currentQty < 0 ? "text-rose-600" : "text-slate-800"
                  }`}
                >
                  {currentQty} {part.unit}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span
                  className={`font-mono text-xs font-bold tracking-tight mt-1 px-1.5 py-0.5 rounded ${
                    diff > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : diff < 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase">
                  Tồn mới sau sửa
                </span>
                <div
                  className={`font-mono text-xl font-bold tracking-tight mt-0.5 ${
                    newQty < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {newQty} {part.unit}
                </div>
              </div>
            </div>

            {/* Quick Step Buttons */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setNewQty((q) => q - 10)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setNewQty((q) => q - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
                className="w-24 rounded-lg border border-slate-300 bg-white py-1.5 text-center font-mono text-base font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setNewQty((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setNewQty((q) => q + 10)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                +10
              </button>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do biến động tồn kho:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
            >
              <option value="Kiểm kê định kỳ cân đối kho">Kiểm kê định kỳ cân đối kho</option>
              <option value="Xuất bán khách lẻ tại quầy">Xuất bán khách lẻ tại quầy</option>
              <option value="Xuất ứng cấp cứu công trường">Xuất ứng cấp cứu công trường (tồn âm tạm thời)</option>
              <option value="Nhập lô hàng phụ tùng mới từ Cảng">Nhập lô hàng phụ tùng mới từ Cảng</option>
              <option value="Điều chuyển nội bộ giữa các kho">Điều chuyển nội bộ giữa các kho</option>
              <option value="Hàng trả về do bảo hành">Hàng trả về do bảo hành</option>
              <option value="Khác">Lý do khác...</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Ghi chú thêm chi tiết (số phiếu, tên khách, dự án)..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Người thực hiện thao tác:
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="rounded-xl btn-lonking px-5 py-2 text-xs font-bold text-slate-950 transition-all active:scale-98 shadow-sm"
            >
              Lưu & Ghi Nhật Ký Kho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
