"use client";

import React from "react";
import { PartCategory } from "@/types/inventory";
import {
  Droplet,
  Wind,
  Gauge,
  Disc,
  Truck,
  Zap,
  Package,
} from "lucide-react";

interface PartSvgPlaceholderProps {
  category: PartCategory;
  partNumber: string;
  className?: string;
}

/**
 * Placeholder phong cách Bản Vẽ Kỹ Thuật (CAD Blueprint Grid):
 * Tối giản, chuyên nghiệp, tỷ lệ chuẩn xác, không dùng gradient màu mè.
 */
export function PartSvgPlaceholder({
  category,
  partNumber,
  className = "w-full h-full",
}: PartSvgPlaceholderProps) {
  const getCategoryDetails = () => {
    switch (category) {
      case "Lọc nhớt/Lọc dầu":
        return { icon: Droplet, label: "HỆ THỐNG LỌC DẦU / NHỚT" };
      case "Lọc gió":
        return { icon: Wind, label: "HỆ THỐNG LỌC KHÍ NẠP" };
      case "Lọc thủy lực":
        return { icon: Gauge, label: "HỆ THỐNG THỦY LỰC ÁP CAO" };
      case "Phớt & Gioăng":
        return { icon: Disc, label: "BỘ PHỚT VÀ GIOĂNG CHẮN DẦU" };
      case "Lốp & Gầm":
        return { icon: Truck, label: "BỘ PHẬN GẦM VÀ TRUYỀN ĐỘNG" };
      case "Động cơ & Điện":
        return { icon: Zap, label: "ĐỘNG CƠ VÀ KHỞI ĐỘNG ĐIỆN" };
      default:
        return { icon: Package, label: "PHỤ TÙNG CƠ GIỚI CHÍNH HÃNG" };
    }
  };

  const { icon: Icon, label } = getCategoryDetails();

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-zinc-100/90 text-zinc-400 select-none bg-technical-grid border-b border-zinc-200/80 ${className}`}
    >
      {/* Precision Crosshair Marks */}
      <div className="absolute top-2 left-2 font-mono text-[9px] text-zinc-400 tracking-tighter">
        +
      </div>
      <div className="absolute top-2 right-2 font-mono text-[9px] text-zinc-400 tracking-tighter">
        +
      </div>
      <div className="absolute bottom-2 left-2 font-mono text-[9px] text-zinc-400 tracking-tighter">
        +
      </div>
      <div className="absolute bottom-2 right-2 font-mono text-[9px] text-zinc-400 tracking-tighter">
        +
      </div>

      {/* Center Technical Blueprint Icon */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-2xs">
          <Icon className="h-6 w-6 stroke-[1.5]" />
        </div>

        <div className="text-center px-4">
          <span className="font-mono text-[10px] font-bold tracking-wider text-zinc-500 uppercase block">
            {label}
          </span>
          <span className="font-mono text-xs font-semibold text-zinc-800 tracking-tight">
            REF: {partNumber}
          </span>
        </div>
      </div>

      <div className="absolute bottom-2 right-3 font-mono text-[8px] tracking-widest text-zinc-400 uppercase">
        TECHNICAL SPEC
      </div>
    </div>
  );
}
