"use client";

import React, { useState, useMemo } from "react";
import { InventoryLog } from "@/types/inventory";
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sliders,
  Calendar,
  User,
  FileSpreadsheet,
  Edit3,
} from "lucide-react";

interface InventoryLogsTableProps {
  logs: InventoryLog[];
}

export function InventoryLogsTable({ logs }: InventoryLogsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      // Filter by type
      if (typeFilter !== "all" && log.type !== typeFilter) {
        return false;
      }

      if (!q) return true;

      return (
        log.partNumber.toLowerCase().includes(q) ||
        log.warehouseName.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        (log.notes && log.notes.toLowerCase().includes(q))
      );
    });
  }, [logs, searchQuery, typeFilter]);

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  const getTypeBadge = (type: InventoryLog["type"]) => {
    switch (type) {
      case "in":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <ArrowUpRight className="h-3 w-3" /> Nhập kho
          </span>
        );
      case "out":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
            <ArrowDownRight className="h-3 w-3" /> Xuất kho
          </span>
        );
      case "edit":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
            <Edit3 className="h-3 w-3" /> Sửa thông tin
          </span>
        );
      case "sync":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            <FileSpreadsheet className="h-3 w-3" /> MISA Sync
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            <Sliders className="h-3 w-3" /> Kiểm kê / Chỉnh tay
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-amber-600" />
            Nhật Ký Biến Động Kho (Inventory Logs)
          </h2>
          <p className="text-xs text-slate-500">
            Truy vết mọi lịch sử thay đổi tồn kho (Nhập, Xuất, Kiểm kê điều chỉnh, Đồng bộ MISA)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã, người sửa, ghi chú..."
              className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Tất cả nguồn biến động</option>
            <option value="in">Nhập kho</option>
            <option value="out">Xuất kho</option>
            <option value="adjust">Chỉnh tay / Kiểm kê</option>
            <option value="edit">Sửa thông tin phụ tùng</option>
            <option value="sync">Đồng bộ MISA</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 pl-4 pr-3">Thời gian ghi nhận</th>
                <th className="px-3 py-3">Mã phụ tùng</th>
                <th className="px-3 py-3">Kho lưu trữ</th>
                <th className="px-3 py-3">Loại biến động</th>
                <th className="px-3 py-3 text-right">Tồn trước</th>
                <th className="px-3 py-3 text-right">Thay đổi</th>
                <th className="px-3 py-3 text-right">Tồn sau</th>
                <th className="px-3 py-3">Người thực hiện</th>
                <th className="py-3 pl-3 pr-4">Lý do / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không có nhật ký biến động nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-4 pr-3 text-slate-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>

                    <td className="px-3 py-3">
                      <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">
                        {log.partNumber}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-slate-700 font-medium">
                      {log.warehouseName}
                    </td>

                    <td className="px-3 py-3">{getTypeBadge(log.type)}</td>

                    <td className="px-3 py-3 text-right font-mono font-medium text-slate-500 tracking-tight">
                      {log.previousQty}
                    </td>

                    <td className="px-3 py-3 text-right">
                      <span
                        className={`font-mono font-bold text-xs tracking-tight ${
                          log.quantityChange > 0
                            ? "text-emerald-600"
                            : log.quantityChange < 0
                            ? "text-rose-600"
                            : "text-slate-500"
                        }`}
                      >
                        {log.quantityChange > 0
                          ? `+${log.quantityChange}`
                          : log.quantityChange}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right">
                      <span
                        className={`font-mono font-bold text-xs tracking-tight ${
                          log.newQty < 0 ? "text-rose-600 font-extrabold" : "text-slate-900"
                        }`}
                      >
                        {log.newQty}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        {log.performedBy}
                      </span>
                    </td>

                    <td className="py-3 pl-3 pr-4 text-slate-500 max-w-xs truncate" title={log.notes}>
                      {log.notes || "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
