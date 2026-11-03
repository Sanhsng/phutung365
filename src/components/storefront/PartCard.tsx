"use client";

import React, { useState } from "react";
import { Part } from "@/types/inventory";
import { useInventory } from "@/lib/store";
import { HighlightText } from "./HighlightText";
import { PartSvgPlaceholder } from "./PartSvgPlaceholder";
import { TechnicalStatusBadge } from "./TechnicalStatusBadge";
import { useToast } from "@/components/ui/Toast";
import {
  Copy,
  Check,
  Eye,
  MessageCircle,
  Plus,
  CheckCheck,
} from "lucide-react";

interface PartCardProps {
  part: Part;
  searchQuery: string;
  onOpenDetail: (part: Part) => void;
  onAddToCart: (part: Part) => void;
  isInCart: boolean;
}

export function PartCard({
  part,
  searchQuery,
  onOpenDetail,
  onAddToCart,
  isInCart,
}: PartCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const toast = useToast();
  const hasImage = part.images && part.images.length > 0 && !imageError;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(part.partNumber);
    setCopied(true);
    toast.success("Đã sao chép mã", part.partNumber);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(part);
    if (!isInCart) {
      toast.success("Đã thêm vào danh sách hỏi giá", `${part.partNumber} - ${part.name}`);
    } else {
      toast.info("Đã có trong danh sách", `${part.partNumber}`);
    }
  };

  const { hotlinePhone } = useInventory();
  const cleanHotline = (hotlinePhone || "0909123456").replace(/\D/g, "");

  const zaloMessage = encodeURIComponent(
    `Xin chào, tôi cần báo giá phụ tùng [${part.partNumber}] - ${part.name} (Tương thích máy: ${
      part.compatibleModels.join(", ") || "Dùng chung"
    }).`
  );
  const zaloUrl = `https://zalo.me/${cleanHotline}?text=${zaloMessage}`;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-md overflow-hidden group">
      {/* 1. TOP: Product Image Frame (Aspect 4/3) */}
      <div
        onClick={() => onOpenDetail(part)}
        className="relative aspect-[4/3] w-full cursor-pointer bg-slate-100/80 overflow-hidden select-none border-b border-slate-100"
      >
        {hasImage ? (
          <img
            src={part.images[0]}
            alt={part.name}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <PartSvgPlaceholder
            category={part.category}
            partNumber={part.partNumber}
            className="h-full w-full"
          />
        )}

        {/* Top-left: Category Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="rounded-md bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 font-mono text-[10px] font-bold text-lonking-400 border border-slate-800">
            {part.category}
          </span>
        </div>

        {/* Top-right: Stock Status Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <TechnicalStatusBadge totalDisplayStock={part.totalDisplayStock} />
        </div>
      </div>

      {/* 2. MIDDLE: Part Number, Description & Specs */}
      <div className="p-3.5 sm:p-4 space-y-2.5 flex-1">
        {/* Main Code + Copy Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => onOpenDetail(part)}
              className="text-left font-mono text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-lonking-600 transition-colors truncate"
            >
              <HighlightText text={part.partNumber} query={searchQuery} />
            </button>
            <button
              onClick={handleCopyCode}
              className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 touch-target sm:min-h-0 flex items-center justify-center"
              title="Sao chép mã phụ tùng"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 uppercase border border-slate-200 shrink-0">
            {part.brand}
          </span>
        </div>

        {/* Part Description Name */}
        <h3
          onClick={() => onOpenDetail(part)}
          className="text-xs font-medium text-slate-700 line-clamp-2 leading-relaxed cursor-pointer hover:text-slate-950 transition-colors"
          title={part.name}
        >
          <HighlightText text={part.name} query={searchQuery} />
        </h3>

        {/* Cross Reference Codes */}
        {part.crossRefNumbers.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              MÃ THAY THẾ (CROSS-REF):
            </span>
            <div className="flex flex-wrap gap-1">
              {part.crossRefNumbers.map((ref, idx) => (
                <span
                  key={idx}
                  className="rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-700 tracking-tight"
                >
                  <HighlightText text={ref} query={searchQuery} />
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>Đơn vị: <strong className="text-slate-800 font-mono">{part.unit}</strong></span>
          <span className="font-mono text-[10px] text-slate-400">ID: {part.id}</span>
        </div>
      </div>

      {/* 3. BOTTOM: Machine Models & Action Bar */}
      <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 space-y-2.5">
        {/* Machine Compatibility Tag List */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            DÒNG MÁY TƯƠNG THÍCH:
          </span>
          <div className="flex flex-wrap gap-1">
            {part.compatibleModels.length > 0 ? (
              part.compatibleModels.map((m, idx) => (
                <span
                  key={idx}
                  className="rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800 tracking-tight"
                >
                  <HighlightText text={m} query={searchQuery} />
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                Dùng chung đa dòng máy
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Chi Tiết & Báo Giá (Lonking Yellow) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onOpenDetail(part)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-98 touch-target sm:min-h-0"
          >
            <Eye className="h-3.5 w-3.5 text-slate-400" />
            Chi tiết
          </button>

          <button
            onClick={handleAdd}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all active:scale-98 touch-target sm:min-h-0 ${
              isInCart
                ? "bg-emerald-600 text-white shadow-xs"
                : "btn-lonking"
            }`}
          >
            {isInCart ? (
              <>
                <CheckCheck className="h-3.5 w-3.5" />
                Đã thêm
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 text-slate-950" />
                Hỏi giá
              </>
            )}
          </button>
        </div>

        {/* Zalo Direct Button */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-[11px] font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors active:scale-99 touch-target sm:min-h-0"
        >
          <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
          Báo giá nhanh qua Zalo
        </a>
      </div>
    </div>
  );
}
