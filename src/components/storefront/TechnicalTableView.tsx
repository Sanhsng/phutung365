"use client";

import React, { useState } from "react";
import { Part } from "@/types/inventory";
import { HighlightText } from "./HighlightText";
import { TechnicalStatusBadge } from "./TechnicalStatusBadge";
import { useToast } from "@/components/ui/Toast";
import {
  Copy,
  Check,
  Eye,
  Plus,
  CheckCheck,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";

interface TechnicalTableViewProps {
  parts: Part[];
  searchQuery: string;
  onOpenDetail: (part: Part) => void;
  onAddToCart: (part: Part) => void;
  cartItemIds: Set<string>;
}

export function TechnicalTableView({
  parts,
  searchQuery,
  onOpenDetail,
  onAddToCart,
  cartItemIds,
}: TechnicalTableViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const toast = useToast();

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
            {parts.map((part) => {
              const isInCart = cartItemIds.has(part.id);
              const isCopied = copiedId === part.id;
              const hasImage = part.images && part.images.length > 0;

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

                  {/* Stock Status */}
                  <td className="py-2.5 px-3">
                    <TechnicalStatusBadge totalDisplayStock={part.totalDisplayStock} />
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
