"use client";

import React from "react";
import { Part } from "@/types/inventory";
import { HighlightText } from "./HighlightText";
import { PartSvgPlaceholder } from "./PartSvgPlaceholder";
import { MoreVertical, CheckCheck, Plus } from "lucide-react";

interface MobileProductListItemProps {
  part: Part;
  searchQuery: string;
  onOpenDetail: (part: Part) => void;
  onAddToCart: (part: Part) => void;
  isInCart: boolean;
}

/**
 * Mobile-First Product Item
 * 100% Vietnamese translation matching User Reference Image 2:
 * Thumbnail vuông trái | Tên & Nhóm ở giữa | Báo giá / Còn hàng / menu 3 chấm phải | Mã, Tồn kho, Dòng máy dưới đáy
 */
export function MobileProductListItem({
  part,
  searchQuery,
  onOpenDetail,
  onAddToCart,
  isInCart,
}: MobileProductListItemProps) {
  const hasImage = part.images && part.images.length > 0;
  const inStock = part.totalDisplayStock > 0;

  return (
    <div
      onClick={() => onOpenDetail(part)}
      className="bg-white border-b border-slate-100 py-3.5 px-3 flex flex-col gap-2 transition-colors active:bg-slate-50 cursor-pointer select-none"
    >
      {/* Hàng trên: Thumbnail + Tên/Nhóm + Báo giá/Còn hàng/Menu */}
      <div className="flex items-start gap-3">
        {/* Thumbnail vuông bo góc (Chuẩn Image 2) */}
        <div className="h-14 w-14 rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-200/80 flex items-center justify-center">
          {hasImage ? (
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

        {/* Ở giữa: Tên phụ tùng & Nhóm */}
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
            <HighlightText text={part.name} query={searchQuery} />
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Nhóm: {part.category}
          </p>
        </div>

        {/* Bên phải: Giá / Báo giá & Nhãn Còn hàng */}
        <div className="flex flex-col items-end shrink-0 text-right">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-900">
              {inStock ? "Báo giá" : "Đặt hàng"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(part);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600"
              title="Tùy chọn phụ tùng"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <span
            className={`text-xs font-semibold mt-0.5 ${
              inStock ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {inStock ? "Còn hàng" : "Đặt trước"}
          </span>
        </div>
      </div>

      {/* Hàng metadata dưới đáy: Mã | Tồn kho | Model máy */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pl-17">
        <div className="flex items-center gap-4">
          <span>
            Mã: <strong className="text-slate-700">{part.partNumber}</strong>
          </span>
          <span>
            Tồn kho:{" "}
            <strong className={inStock ? "text-slate-900 font-bold" : "text-rose-500"}>
              {part.totalDisplayStock} {part.unit}
            </strong>
          </span>
          <span className="truncate max-w-[110px]">
            Máy: <strong className="text-slate-700">{part.compatibleModels[0] || "Đa năng"}</strong>
          </span>
        </div>

        {/* Nút thêm nhanh vào báo giá */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(part);
          }}
          className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
            isInCart
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          title={isInCart ? "Đã chọn vào giỏ báo giá" : "Thêm vào báo giá"}
        >
          {isInCart ? <CheckCheck className="h-3 w-3" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
