"use client";

import React, { useEffect, useState } from "react";
import { Part, AttributeDefinition } from "@/types/inventory";
import { PartSvgPlaceholder } from "./PartSvgPlaceholder";
import { TechnicalStatusBadge } from "./TechnicalStatusBadge";
import { useToast } from "@/components/ui/Toast";
import {
  X,
  Copy,
  Check,
  Plus,
  CheckCheck,
  MessageCircle,
  ShieldCheck,
  FileText,
  Warehouse as WarehouseIcon,
} from "lucide-react";

interface PartDetailModalProps {
  part: Part | null;
  onClose: () => void;
  onAddToCart: (part: Part) => void;
  isInCart: boolean;
  publicAttributes: AttributeDefinition[];
}

export function PartDetailModal({
  part,
  onClose,
  onAddToCart,
  isInCart,
  publicAttributes,
}: PartDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (part) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [part, onClose]);

  if (!part) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(part.partNumber);
    setCopied(true);
    toast.success("Đã sao chép mã", part.partNumber);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = () => {
    onAddToCart(part);
    if (!isInCart) {
      toast.success("Đã thêm vào danh sách hỏi giá", `${part.partNumber}`);
    } else {
      toast.info("Đã có trong danh sách", `${part.partNumber}`);
    }
  };

  const zaloMessage = encodeURIComponent(
    `Xin chào, tôi cần báo giá phụ tùng [${part.partNumber}] - ${part.name} (Tương thích: ${
      part.compatibleModels.join(", ") || "Dùng chung"
    }).`
  );
  const zaloUrl = `https://zalo.me/0909123456?text=${zaloMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Liquid Glass Frosted Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 duration-200">
        {/* Technical Header with Lonking Accent */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 sm:px-6 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-lonking-400 uppercase tracking-wider">
              ĐẶC TẢ KỸ THUẬT PHỤ TÙNG
            </span>
            <span className="text-slate-600 font-mono text-[11px]">|</span>
            <span className="font-mono text-[11px] text-slate-400">ID: {part.id}</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors touch-target sm:min-h-0 flex items-center justify-center"
            title="Đóng hộp thoại"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Top Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left: Product Media Preview */}
            <div className="space-y-3">
              <div className="relative aspect-[4/3] w-full rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                {part.images && part.images.length > 0 ? (
                  <img
                    src={part.images[0]}
                    alt={part.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PartSvgPlaceholder
                    category={part.category}
                    partNumber={part.partNumber}
                    className="h-full w-full"
                  />
                )}

                <div className="absolute top-2.5 left-2.5">
                  <span className="rounded-md bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 font-mono text-[10px] font-bold text-lonking-400 border border-slate-800">
                    {part.category}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <TechnicalStatusBadge totalDisplayStock={part.totalDisplayStock} />
                </div>
              </div>

              {/* Trust Badge Strip */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Tiêu chuẩn xuất xưởng & tương thích OEM 100%</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Mã quản lý hệ thống: <span className="font-mono font-medium">{part.misaRawCode}</span></span>
                </div>
              </div>
            </div>

            {/* Right: Technical Specs */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    {part.partNumber}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>

                <h2 className="mt-1.5 text-sm font-semibold text-slate-800 leading-snug">
                  {part.name}
                </h2>
              </div>

              {/* Spec Table */}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Thương hiệu</span>
                  <span className="font-bold text-slate-900">{part.brand}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-slate-500 font-medium">Đơn vị tính</span>
                  <span className="font-mono font-bold text-slate-900">{part.unit}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Tình trạng xuất kho</span>
                  <span className="font-semibold text-emerald-700">
                    {part.totalDisplayStock > 0 ? "Sẵn sàng giao hàng" : "Đặt hàng 3 - 5 ngày"}
                  </span>
                </div>
              </div>

              {/* Dynamic Attributes */}
              {publicAttributes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    THÔNG SỐ VẬT LÝ & KÍCH THƯỚC:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {publicAttributes.map((attr) => {
                      const val = part.customAttributes?.[attr.key];
                      if (!val) return null;
                      return (
                        <div
                          key={attr.key}
                          className="rounded-lg border border-slate-200 bg-slate-50/70 p-2"
                        >
                          <span className="text-[10px] text-slate-500 block">{attr.name}</span>
                          <span className="font-mono font-semibold text-slate-900">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cross Ref Numbers */}
              {part.crossRefNumbers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    MÃ THAY THẾ TƯƠNG ĐƯƠNG (OEM CROSS-REF):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {part.crossRefNumbers.map((ref, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-1 font-mono text-xs font-semibold text-slate-800"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatible Models */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  DÒNG MÁY CƠ GIỚI LẮP VỪA:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {part.compatibleModels.length > 0 ? (
                    part.compatibleModels.map((m, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-amber-50 border border-amber-200/80 px-2 py-1 font-mono text-xs font-bold text-amber-900"
                      >
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Dùng chung cho nhiều dòng máy</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50/90 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Mã tra cứu: <span className="text-slate-800 font-bold">{part.partNumber}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors touch-target sm:min-h-0"
            >
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span>Báo giá Zalo</span>
            </a>

            <button
              onClick={handleAdd}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition-all touch-target sm:min-h-0 ${
                isInCart
                  ? "bg-emerald-600 text-white"
                  : "btn-lonking"
              }`}
            >
              {isInCart ? (
                <>
                  <CheckCheck className="h-4 w-4" />
                  <span>Đã thêm báo giá</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-slate-950" />
                  <span>+ Thêm vào báo giá</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
