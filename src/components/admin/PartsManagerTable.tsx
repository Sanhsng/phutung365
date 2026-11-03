"use client";

import React, { useState, useMemo } from "react";
import { Part, Warehouse } from "@/types/inventory";
import { normalizeCode } from "@/lib/misa-parser";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Download,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

interface PartsManagerTableProps {
  parts: Part[];
  warehouses: Warehouse[];
  onToggleVisibility: (partId: string) => void;
  onOpenAdjustStock: (part: Part) => void;
  onOpenEditPart: (part: Part | null) => void;
  onDeletePart: (partId: string) => void;
}

/**
 * Industrial SaaS Data Table
 * 100% Vietnamese localization with exact visual layout from Reference Image 3
 */
export function PartsManagerTable({
  parts,
  warehouses,
  onToggleVisibility,
  onOpenAdjustStock,
  onOpenEditPart,
  onDeletePart,
}: PartsManagerTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();

  const categories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach((p) => set.add(p.category));
    return ["all", ...Array.from(set)];
  }, [parts]);

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cleanQ = normalizeCode(searchQuery);

    return parts.filter((part) => {
      if (selectedCategory !== "all" && part.category !== selectedCategory) {
        return false;
      }

      if (statusFilter === "visible" && !part.isVisible) return false;
      if (statusFilter === "hidden" && part.isVisible) return false;
      if (statusFilter === "negative") {
        const hasNegative = Object.values(part.warehouseStocks).some(
          (st) => st.stockQty < 0
        );
        if (!hasNegative) return false;
      }

      if (!q && !cleanQ) return true;

      if (cleanQ && part.partNumberClean.includes(cleanQ)) return true;
      if (
        part.crossRefNumbers.some((ref) =>
          normalizeCode(ref).includes(cleanQ)
        )
      ) {
        return true;
      }

      return (
        part.name.toLowerCase().includes(q) ||
        part.misaRawCode.toLowerCase().includes(q) ||
        part.brand.toLowerCase().includes(q) ||
        part.compatibleModels.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [parts, searchQuery, selectedCategory, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredParts.length / pageSize));
  const paginatedParts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredParts.slice(start, start + pageSize);
  }, [filteredParts, currentPage, pageSize]);

  const handleToggle = (part: Part) => {
    onToggleVisibility(part.id);
    if (part.isVisible) {
      toast.info("Đã ẩn mã phụ tùng", `${part.partNumber} không còn hiển thị trên web`);
    } else {
      toast.success("Đã bật hiển thị", `${part.partNumber} đã hiển thị công khai`);
    }
  };

  const handleDelete = (part: Part) => {
    if (confirm(`Xác nhận xóa mã phụ tùng "${part.partNumber}"?`)) {
      onDeletePart(part.id);
      toast.success("Đã xóa phụ tùng", part.partNumber);
    }
  };

  const handleExportExcel = () => {
    try {
      const rows = filteredParts.map((part, idx) => ({
        "STT": idx + 1,
        "Mã Phụ Tùng": part.partNumber,
        "Mã MISA Gốc": part.misaRawCode,
        "Mã Thay Thế": part.crossRefNumbers.join(", "),
        "Tên Phụ Tùng": part.name,
        "Nhóm Phụ Tùng": part.category,
        "Đơn Vị": part.unit,
        "Hãng": part.brand,
        "Dòng Máy": part.compatibleModels.join(", "),
        "Kho PT Miền Nam": part.warehouseStocks["wh_mn_pt"]?.stockQty ?? 0,
        "Kho Bảo Hành": part.warehouseStocks["wh_mn_bh"]?.stockQty ?? 0,
        "Kho Tặng Kèm": part.warehouseStocks["wh_mn_tang"]?.stockQty ?? 0,
        "Tổng Tồn Web": part.totalDisplayStock,
        "Hiển Thị Web": part.isVisible ? "CÓ" : "ẨN",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "TonKhoPhuTung");
      XLSX.writeFile(
        wb,
        `TonKho_PhuTung_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Đã xuất file Excel", "Tải xuống bảng tính tồn kho thành công.");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      toast.error("Không thể xuất Excel", "Đã có lỗi xảy ra.");
    }
  };

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* THANH TÁC VỤ & BỘ LỌC (Chuẩn bố cục Image 3)            */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Nhóm nút bên trái: Nút thêm màu xanh đen Navy + Chip lọc */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút Navy (Chuẩn Image 3: + Thêm phụ tùng mới) */}
          <button
            onClick={() => onOpenEditPart(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0e1726] hover:bg-[#1a273e] text-white px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Thêm phụ tùng mới
          </button>

          {/* Chip lọc: Tất cả dữ liệu ✕ */}
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setStatusFilter("all");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
          >
            <span>Tất cả dữ liệu</span>
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Nút lọc mở rộng */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 pl-3 pr-7 py-2 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer focus:outline-none"
            >
              <option value="all">Bộ lọc nhóm ({categories.length - 1} nhóm)</option>
              {categories.filter((c) => c !== "all").map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Công cụ xuất file Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="Xuất bảng tính Excel tồn kho"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Xuất Excel
          </button>
        </div>

        {/* Ô tìm kiếm bên phải */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm mã, tên phụ tùng..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* BẢNG DỮ LIỆU CÔNG NGHIỆP SAAS (Chuẩn thiết kế Image 3)   */}
      {/* ======================================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="border-b border-slate-200/80 bg-white text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="py-3 pl-3 pr-1 w-10 text-slate-400 font-mono text-center">STT</th>
                <th className="py-3 px-3 w-[220px] lg:w-[260px]">Mã & Tên phụ tùng</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Dòng máy tương thích</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Tồn kho thực tế</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Kho lưu trữ</th>
                <th className="py-3 px-2 whitespace-nowrap">Cập nhật</th>
                <th className="py-3 pl-2 pr-3 text-left w-28 min-w-[105px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy dữ liệu phụ tùng phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedParts.map((part, index) => {
                  const itemIndex = (currentPage - 1) * pageSize + index + 1;
                  const itemNumber = itemIndex < 10 ? `0${itemIndex}` : `${itemIndex}`;
                  const inStock = part.totalDisplayStock > 0;

                  return (
                    <tr
                      key={part.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* STT (01, 02, 03...) */}
                      <td className="py-3 pl-3 pr-1 font-mono text-slate-400 text-center">
                        {itemNumber}
                      </td>

                      {/* Mã & Tên phụ tùng */}
                      <td className="py-3 px-3 max-w-[220px] lg:max-w-[260px]">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {part.images && part.images.length > 0 ? (
                              <img
                                src={part.images[0]}
                                alt={part.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-900 truncate block text-xs" title={part.name}>
                              {part.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block truncate">
                              {part.partNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Dòng máy tương thích */}
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <span className="text-slate-700 font-mono">
                          {part.compatibleModels[0] || "Lonking đa năng"}
                        </span>
                      </td>

                      {/* Tồn kho thực tế */}
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <span
                          className={`font-mono font-semibold ${inStock ? "text-slate-900" : "text-rose-600"
                            }`}
                        >
                          {part.totalDisplayStock} {part.unit}
                        </span>
                      </td>

                      {/* Kho lưu trữ */}
                      <td className="py-3 px-2.5 whitespace-nowrap text-slate-600">
                        Kho Miền Nam
                      </td>

                      {/* Ngày cập nhật */}
                      <td className="py-3 px-2 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        Hôm nay
                      </td>

                      {/* Thao tác: Mắt xem/kiểm kho, Bút sửa, Thùng rác xóa */}
                      <td className="py-3 pl-2 pr-3 text-left w-28 min-w-[105px]">
                        <div className="flex items-center justify-start gap-1.5 text-slate-400 flex-nowrap shrink-0">
                          {/* Eye: Xem / Điều chỉnh tồn kho */}
                          <button
                            onClick={() => onOpenAdjustStock(part)}
                            className="p-1 hover:text-slate-800 transition-colors shrink-0"
                            title="Kiểm kê & điều chỉnh tồn kho"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit: Sửa - Đưa lên trước để luôn dễ bấm */}
                          <button
                            onClick={() => onOpenEditPart(part)}
                            className="p-1 hover:text-amber-600 transition-colors shrink-0"
                            title="Chỉnh sửa thông số kỹ thuật"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Trash: Xóa */}
                          <button
                            onClick={() => handleDelete(part)}
                            className="p-1 hover:text-rose-600 transition-colors shrink-0"
                            title="Xóa phụ tùng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* THANH PHÂN TRANG ĐÁY BẢNG (Chuẩn Image 3)                */}
        {/* ======================================================== */}
        <div className="border-t border-slate-200/80 px-4 py-3 flex items-center justify-between bg-white text-xs text-slate-600">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            Trang trước
          </button>

          <span className="font-medium text-slate-700">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
}
