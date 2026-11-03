"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { PartSvgPlaceholder } from "./PartSvgPlaceholder";
import { PartCategory } from "@/types/inventory";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images?: string[];
  partNumber: string;
  partName: string;
  category: PartCategory;
  initialIndex?: number;
}

export function ImageZoomModal({
  isOpen,
  onClose,
  images = [],
  partNumber,
  partName,
  category,
  initialIndex = 0,
}: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  // Cập nhật index khi mở modal
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  // Phím tắt bàn phím
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight" && images.length > 1) {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[currentIndex] : null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const toggleZoom = () => {
    setScale((prev) => (prev === 1 ? 1.75 : 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-slate-950/95 backdrop-blur-md p-3 sm:p-5 select-none animate-in fade-in duration-200">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 max-w-[70vw] sm:max-w-xl truncate">
          <span className="font-mono text-xs sm:text-sm font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-lg shrink-0">
            {partNumber}
          </span>
          <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
            {partName}
          </span>
        </div>

        {/* Toolbar action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Thu nhỏ (-)"
              disabled={scale <= 0.75}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 rounded-lg text-xs font-mono font-bold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              title="Khôi phục kích thước ban đầu (0)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Phóng to (+)"
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-600/80 hover:text-white text-slate-200 transition-colors border border-white/10"
            title="Đóng (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden my-3">
        {/* Navigation arrow Left */}
        {hasImages && images.length > 1 && (
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
            }
            className="absolute left-2 sm:left-4 z-10 p-2.5 sm:p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-all shadow-lg border border-white/10 backdrop-blur-sm"
            title="Ảnh trước (Mũi tên trái)"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}

        {/* Displayed Image Container */}
        <div
          onClick={toggleZoom}
          className="cursor-zoom-in max-h-[75vh] max-w-[88vw] flex items-center justify-center transition-transform duration-150 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          {hasImages && currentImage ? (
            <img
              src={currentImage}
              alt={partName}
              className="max-h-[75vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl bg-white p-2 border border-slate-700 pointer-events-none"
            />
          ) : (
            <div className="w-[320px] sm:w-[460px] h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-white">
              <PartSvgPlaceholder
                category={category}
                partNumber={partNumber}
                className="w-full h-full"
              />
            </div>
          )}
        </div>

        {/* Navigation arrow Right */}
        {hasImages && images.length > 1 && (
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
            }
            className="absolute right-2 sm:right-4 z-10 p-2.5 sm:p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-all shadow-lg border border-white/10 backdrop-blur-sm"
            title="Ảnh tiếp theo (Mũi tên phải)"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}
      </div>

      {/* Bottom Footer & Thumbnails */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10 shrink-0">
        {hasImages && images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setScale(1);
                }}
                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white p-0.5 ${
                  currentIndex === idx
                    ? "border-amber-400 scale-105 shadow-md"
                    : "border-white/20 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover rounded-lg"
                />
              </button>
            ))}
          </div>
        )}

        <div className="text-[11px] text-slate-400 flex items-center gap-3">
          <span>Bấm chuột vào ảnh để phóng to/thu nhỏ</span>
          <span>•</span>
          <span>Dùng phím <kbd className="bg-white/10 px-1 py-0.5 rounded text-slate-300 font-mono text-[10px]">+</kbd> <kbd className="bg-white/10 px-1 py-0.5 rounded text-slate-300 font-mono text-[10px]">-</kbd> hoặc phím <kbd className="bg-white/10 px-1 py-0.5 rounded text-slate-300 font-mono text-[10px]">Esc</kbd> để đóng</span>
        </div>
      </div>
    </div>
  );
}

