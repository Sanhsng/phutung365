"use client";

import React from "react";

interface TechnicalStatusBadgeProps {
  totalDisplayStock: number;
  className?: string;
}

/**
 * Chỉ báo trạng thái tồn kho chuẩn Modern Minimalist & Liquid Glass:
 * Dùng chấm tròn tín hiệu LED tinh tế kết hợp typography rõ ràng, không làm rối mắt người dùng.
 */
export function TechnicalStatusBadge({
  totalDisplayStock,
  className = "",
}: TechnicalStatusBadgeProps) {
  if (totalDisplayStock >= 5) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50/90 text-emerald-700 border border-emerald-200/80 font-mono text-[10px] sm:text-[11px] font-semibold tracking-wide ${className}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        SẴN HÀNG
      </span>
    );
  }

  if (totalDisplayStock > 0 && totalDisplayStock < 5) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50/90 text-amber-800 border border-amber-200/80 font-mono text-[10px] sm:text-[11px] font-semibold tracking-wide ${className}`}
      >
        <span className="h-2 w-2 rounded-full bg-lonking-500 shrink-0" />
        SỐ LƯỢNG ÍT
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100/90 text-slate-600 border border-slate-200/80 font-mono text-[10px] sm:text-[11px] font-medium tracking-wide ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
      ĐẶT HÀNG
    </span>
  );
}
