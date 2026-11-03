"use client";

import React from "react";
import { Boxes, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface MetricStripProps {
  totalCount: number;
  visibleCount: number;
  negativeCount: number;
  lastSyncTime?: string;
}

export function MetricStrip({
  totalCount,
  visibleCount,
  negativeCount,
  lastSyncTime,
}: MetricStripProps) {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "Chưa đồng bộ";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Hôm nay";
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Metric 1 */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TỔNG DANH MỤC
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Boxes className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500">mã phụ tùng</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              HIỂN THỊ CÔNG KHAI
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {visibleCount}
            </span>
            <span className="text-xs text-emerald-700 font-mono font-medium">SẴN SÀNG</span>
          </div>
        </div>

        {/* Metric 3: Cảnh báo kho âm */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CẢNH BÁO TỒN ÂM
            </span>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                negativeCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${
                negativeCount > 0 ? "text-rose-600 font-extrabold" : "text-slate-900"
              }`}
            >
              {negativeCount}
            </span>
            <span className="text-xs text-rose-600 font-medium">MÃ CẦN BÙ KHO</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ĐỒNG BỘ MISA AMIS
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-lonking-600">
              <RefreshCw className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {formatTime(lastSyncTime)}
            </span>
            <span className="text-xs text-slate-500 font-mono">LIVE SYNC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
