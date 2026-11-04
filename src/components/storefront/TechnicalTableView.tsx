"use client";

import React, { useState, useMemo } from "react";
import { Part, Warehouse } from "@/types/inventory";
import { useInventory } from "@/lib/store";
import { getFriendlyWarehouseName } from "@/lib/seed-data";
import { HighlightText } from "./HighlightText";
import { TechnicalStatusBadge } from "./TechnicalStatusBadge";
import { useToast } from "@/components/ui/Toast";
import {
  Copy,
  Check,
  Eye,
  Plus,
  CheckCheck,
  Image as ImageIcon,
  MapPin,
  Boxes,
  RotateCcw,
} from "lucide-react";

interface TechnicalTableViewProps {
  parts: Part[];
  allParts?: Part[];
  searchQuery: string;
  onOpenDetail: (part: Part) => void;
  onAddToCart: (part: Part) => void;
  cartItemIds: Set<string>;
  warehouses?: Warehouse[];
  selectedWarehouse?: string;
  onSelectWarehouse?: (whId: string) => void;
}

export function TechnicalTableView({
  parts,
  allParts,
  searchQuery,
  onOpenDetail,
  onAddToCart,
  cartItemIds,
  warehouses: propWarehouses,
  selectedWarehouse: propSelectedWarehouse,
  onSelectWarehouse,
}: TechnicalTableViewProps) {
  const { warehouses: contextWarehouses } = useInventory();
  const warehouses =
    propWarehouses && propWarehouses.length > 0 ? propWarehouses : contextWarehouses;

  const [internalWarehouse, setInternalWarehouse] = useState<string>("all");
  const activeWarehouse =
    propSelectedWarehouse !== undefined ? propSelectedWarehouse : internalWarehouse;

  const handleSelectWarehouse = (whId: string) => {
    if (onSelectWarehouse) {
      onSelectWarehouse(whId);
    } else {
      setInternalWarehouse(whId);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const toast = useToast();

  // Đếm số lượng phụ tùng có sẵn tại từng kho
  const warehouseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const sourceParts = allParts && allParts.length > 0 ? allParts : parts;
    warehouses.forEach((wh) => {
      counts[wh.id] = sourceParts.filter(
        (p) => (p.warehouseStocks?.[wh.id]?.stockQty ?? 0) > 0
      ).length;
    });
    return counts;
  }, [warehouses, allParts, parts]);

  const totalAllCount = useMemo(() => {
    const sourceParts = allParts && allParts.length > 0 ? allParts : parts;
    return sourceParts.length;
  }, [allParts, parts]);

  // Nếu không có onSelectWarehouse truyền từ ngoài (uncontrolled mode), tự lọc danh sách
  const displayParts = useMemo(() => {
    if (onSelectWarehouse || activeWarehouse === "all") return parts;
    return parts.filter(
      (p) => (p.warehouseStocks?.[activeWarehouse]?.stockQty ?? 0) > 0
    );
  }, [parts, activeWarehouse, onSelectWarehouse]);

  const activeWarehouseObj = warehouses.find((w) => w.id === activeWarehouse);
  const activeWarehouseName =
    activeWarehouse === "all"
      ? "Tất cả kho"
      : getFriendlyWarehouseName(activeWarehouse, activeWarehouseObj?.name);

  const handleCopy = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Đã sao chép mã", code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdd = (part: Part, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(part);
    if (!cartItemIds.has(part.id)) {
      toast.success("Đã thêm vào danh sách hỏi giá", `${part.partNumber}`);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ======================================================== */}
      {/* THANH BỘ LỌC THEO KHO HÀNG (Chuẩn Lonking & Hiện đại)    */}
      {/* ======================================================== */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fcb710] text-slate-950 font-bold shadow-2xs shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Bộ lọc kho hàng:
                </span>
                {activeWarehouse !== "all" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    Đang xem: <strong>{activeWarehouseName}</strong>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-200/80 text-slate-700">
                    Toàn hệ thống (7 kho)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bấm vào từng kho để xem danh sách và tồn thực tế phụ tùng tại địa điểm đó
              </p>
            </div>
          </div>

          {/* Đếm số lượng & nút reset về tất cả kho */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <span className="text-xs text-slate-600 font-mono">
              Hiển thị: <strong className="text-slate-950 font-bold">{displayParts.length}</strong> mã
            </span>
            {activeWarehouse !== "all" && (
              <button
                onClick={() => handleSelectWarehouse("all")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                title="Quay lại tất cả kho"
              >
                <RotateCcw className="h-3 w-3 text-slate-500" />
                <span>Tất cả kho</span>
              </button>
            )}
          </div>
        </div>

        {/* Danh sách nút chọn kho dạng viên thuốc (Pills - Cuộn ngang mượt mà) */}
        <div className="pt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {/* Nút: Tất cả kho */}
          <button
            onClick={() => handleSelectWarehouse("all")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeWarehouse === "all"
                ? "bg-slate-950 text-white shadow-xs font-bold"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Tất cả kho</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeWarehouse === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
                }`}
            >
              {totalAllCount}
            </span>
          </button>

          {/* Từng kho cụ thể */}
          {warehouses.map((wh) => {
            const isSelected = activeWarehouse === wh.id;
            const count = warehouseCounts[wh.id] ?? 0;
            const friendlyName = getFriendlyWarehouseName(wh.id, wh.name);

            return (
              <button
                key={wh.id}
                onClick={() => handleSelectWarehouse(wh.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${isSelected
                    ? "bg-[#fcb710] text-slate-950 font-bold shadow-xs border border-amber-500 ring-2 ring-amber-400/30"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 font-medium"
                  }`}
              >
                <span>{friendlyName}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${isSelected
                      ? "bg-black/15 text-slate-950"
                      : count > 0
                        ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                        : "bg-slate-100 text-slate-400"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* BẢNG DỮ LIỆU CHI TIẾT (Technical Table View)             */}
      {/* ======================================================== */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-900 text-[10px] uppercase tracking-wider font-semibold text-slate-200">
              <tr>
                <th className="py-3 pl-3 pr-2 w-12 text-center">ẢNH</th>
                <th className="py-3 px-3">MÃ PHỤ TÙNG</th>
                <th className="py-3 px-3">MÃ THAY THẾ</th>
                <th className="py-3 px-3">TÊN PHỤ TÙNG</th>
                <th className="py-3 px-2">ĐVT</th>
                <th className="py-3 px-3">DÒNG MÁY TƯƠNG THÍCH</th>
                <th className="py-3 px-3">TÌNH TRẠNG</th>
                <th className="py-3 pl-2 pr-3 text-center">TÁC VỤ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayParts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Boxes className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Không có phụ tùng nào có hàng tại {activeWarehouseName}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Vui lòng chọn kho khác hoặc bấm &quot;Tất cả kho&quot; để tra cứu toàn bộ danh mục.
                      </p>
                      {activeWarehouse !== "all" && (
                        <button
                          onClick={() => handleSelectWarehouse("all")}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Xem tất cả kho</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayParts.map((part) => {
                  const isInCart = cartItemIds.has(part.id);
                  const isCopied = copiedId === part.id;
                  const hasImage = part.images && part.images.length > 0;

                  // Lấy số lượng tồn kho theo kho được chọn hoặc tổng tồn
                  const itemStock =
                    activeWarehouse !== "all"
                      ? part.warehouseStocks?.[activeWarehouse]?.stockQty ?? 0
                      : part.totalDisplayStock;

                  return (
                    <tr
                      key={part.id}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      {/* Thumbnail 40x40 */}
                      <td className="py-2.5 pl-3 pr-2">
                        <div
                          onClick={() => onOpenDetail(part)}
                          className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center cursor-pointer transition-transform group-hover:scale-105"
                        >
                          {hasImage ? (
                            <img
                              src={part.images[0]}
                              alt={part.partNumber}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Part Number + Copy */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onOpenDetail(part)}
                            className="font-mono text-xs font-bold tracking-tight text-slate-950 hover:text-lonking-600 transition-colors text-left"
                          >
                            <HighlightText text={part.partNumber} query={searchQuery} />
                          </button>
                          <button
                            onClick={(e) => handleCopy(part.id, part.partNumber, e)}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Sao chép mã"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {part.brand} • {part.category}
                        </div>
                      </td>

                      {/* Cross Ref */}
                      <td className="py-2.5 px-3">
                        {part.crossRefNumbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {part.crossRefNumbers.map((ref, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-700"
                              >
                                <HighlightText text={ref} query={searchQuery} />
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <div
                          onClick={() => onOpenDetail(part)}
                          className="font-medium text-slate-900 cursor-pointer hover:text-lonking-600 transition-colors line-clamp-2"
                          title={part.name}
                        >
                          <HighlightText text={part.name} query={searchQuery} />
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-2 font-mono text-slate-600">
                        {part.unit}
                      </td>

                      {/* Compatible Models */}
                      <td className="py-2.5 px-3">
                        {part.compatibleModels.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {part.compatibleModels.map((m, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800"
                              >
                                <HighlightText text={m} query={searchQuery} />
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Dùng chung</span>
                        )}
                      </td>

                      {/* Stock Status & Stock Details */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <TechnicalStatusBadge totalDisplayStock={itemStock} />
                          {itemStock > 0 ? (
                            <span className="text-[10px] text-slate-600 font-mono">
                              {activeWarehouse !== "all" ? "Tại kho: " : "Tồn: "}
                              <strong className="text-slate-900 font-bold">{itemStock}</strong> {part.unit}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              {activeWarehouse !== "all" ? "Hết tại kho này" : "Liên hệ"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 pl-2 pr-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDetail(part)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <span className="hidden sm:inline">Chi tiết</span>
                          </button>

                          <button
                            onClick={(e) => handleAdd(part, e)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${isInCart
                                ? "bg-emerald-600 text-white"
                                : "btn-lonking"
                              }`}
                            title="Thêm vào danh sách hỏi giá"
                          >
                            {isInCart ? (
                              <>
                                <CheckCheck className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Đã thêm</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5 text-slate-950" />
                                <span>Hỏi giá</span>
                              </>
                            )}
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
      </div>
    </div>
  );
}
