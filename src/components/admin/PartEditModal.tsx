"use client";

import React, { useState, useEffect, useRef } from "react";
import { Part, AttributeDefinition, PartCategory } from "@/types/inventory";
import { normalizeCode } from "@/lib/misa-parser";
import {
  X,
  Plus,
  Save,
  Wrench,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  Layers,
  Tag,
  UploadCloud,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface PartEditModalProps {
  part: Part | null; // Nếu null là Thêm mới, nếu có part là Sửa
  isOpen: boolean;
  onClose: () => void;
  attributes: AttributeDefinition[];
  onSave: (partData: {
    id?: string;
    misaRawCode: string;
    partNumber: string;
    crossRefNumbers: string[];
    name: string;
    unit: string;
    category: PartCategory;
    brand: string;
    compatibleModels: string[];
    images: string[];
    minStockAlert: number;
    isVisible: boolean;
    customAttributes: Record<string, string | number>;
  }) => void;
}

const CATEGORIES: PartCategory[] = [
  "Lọc nhớt/Lọc dầu",
  "Lọc gió",
  "Lọc thủy lực",
  "Phớt & Gioăng",
  "Lốp & Gầm",
  "Động cơ & Điện",
  "Khác",
];

/**
 * Tự động nén và tối ưu ảnh trực tiếp trên trình duyệt (Max width 1000px, JPEG chất lượng 85%)
 * Đảm bảo hình ảnh sắc nét, dung lượng nhẹ, không lag giao diện.
 */
function compressImageFile(file: File, maxDim = 1000, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const compressedDataUrl = canvas.toDataURL(outputType, quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PartEditModal({
  part,
  isOpen,
  onClose,
  attributes,
  onSave,
}: PartEditModalProps) {
  const isEditing = Boolean(part);

  const [partNumber, setPartNumber] = useState("");
  const [misaRawCode, setMisaRawCode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("Cái");
  const [category, setCategory] = useState<PartCategory>("Lọc nhớt/Lọc dầu");
  const [brand, setBrand] = useState("OEM");
  const [crossRefInput, setCrossRefInput] = useState("");
  const [modelsInput, setModelsInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [isVisible, setIsVisible] = useState(true);
  const [customAttrs, setCustomAttrs] = useState<Record<string, string | number>>({});

  // Chế độ tải ảnh từ máy hoặc URL
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)!");
      return;
    }

    try {
      setIsProcessingImage(true);
      const dataUrl = await compressImageFile(file);
      setImageUrl(dataUrl);
    } catch (err) {
      console.error("Lỗi đọc file ảnh:", err);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsProcessingImage(true);
      try {
        const dataUrl = await compressImageFile(file);
        setImageUrl(dataUrl);
      } catch (err) {
        console.error("Lỗi kéo thả ảnh:", err);
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  useEffect(() => {
    if (part) {
      setPartNumber(part.partNumber);
      setMisaRawCode(part.misaRawCode);
      setName(part.name);
      setUnit(part.unit);
      setCategory(part.category);
      setBrand(part.brand);
      setCrossRefInput(part.crossRefNumbers.join(", "));
      setModelsInput(part.compatibleModels.join(", "));
      setImageUrl(part.images[0] || "");
      setMinStockAlert(part.minStockAlert);
      setIsVisible(part.isVisible);
      setCustomAttrs(part.customAttributes || {});
    } else {
      // Giá trị mặc định khi tạo mới
      setPartNumber("");
      setMisaRawCode("");
      setName("");
      setUnit("Cái");
      setCategory("Lọc nhớt/Lọc dầu");
      setBrand("OEM");
      setCrossRefInput("");
      setModelsInput("");
      setImageUrl("");
      setMinStockAlert(5);
      setIsVisible(true);
      setCustomAttrs({});
    }
  }, [part, isOpen]);

  if (!isOpen) return null;

  const handleCustomAttrChange = (key: string, value: string | number) => {
    setCustomAttrs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const crossRefNumbers = crossRefInput
      .split(/[,;\/]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const compatibleModels = modelsInput
      .split(/[,;\/]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const images = imageUrl.trim() ? [imageUrl.trim()] : [];

    onSave({
      ...(part && { id: part.id }),
      partNumber: partNumber.trim(),
      misaRawCode: misaRawCode.trim() || partNumber.trim(),
      name: name.trim(),
      unit: unit.trim() || "Cái",
      category,
      brand: brand.trim() || "OEM",
      crossRefNumbers,
      compatibleModels,
      images,
      minStockAlert,
      isVisible,
      customAttributes: customAttrs,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Liquid Glass Frosted Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden my-4 sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 sm:px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lonking-500 text-slate-950 font-bold">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {isEditing ? `Chỉnh Sửa Phụ Tùng: ${part?.partNumber}` : "Thêm Mã Phụ Tùng Mới"}
              </h2>
              <p className="text-[11px] text-slate-400">
                Cập nhật thông tin nhận diện, dòng máy và thuộc tính kỹ thuật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Part Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã phụ tùng hiển thị (*)
              </label>
              <input
                type="text"
                required
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="VD: LF667, FS1280..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* MISA raw code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã gốc kế toán MISA
              </label>
              <input
                type="text"
                value={misaRawCode}
                onChange={(e) => setMisaRawCode(e.target.value)}
                placeholder="VD: MA311_LK_PT_LF667..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Part Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên phụ tùng / Vật tư (*)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lọc nhớt động cơ Weichai WD615 máy xúc lật 833..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhóm danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartCategory)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thương hiệu / Hãng
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="VD: Fleetguard, Weichai..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đơn vị tính (ĐVT)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Cái, Quả, Bộ, Bình..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cross Ref Numbers */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã thay thế / Mã chéo (Cách nhau bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={crossRefInput}
                onChange={(e) => setCrossRefInput(e.target.value)}
                placeholder="P554004, 1000424655, LF16015..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Compatible Models */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dòng máy tương thích (Cách nhau bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={modelsInput}
                onChange={(e) => setModelsInput(e.target.value)}
                placeholder="833, 855, ZL50NC, CDM6225..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* HÌNH ẢNH SẢN PHẨM & CẢNH BÁO TỒN TỐI THIỂU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                  Ảnh phụ tùng
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(false)}
                    className={`font-medium transition-colors ${
                      !useUrlInput ? "text-amber-600 font-bold" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Tải từ máy
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(true)}
                    className={`font-medium transition-colors ${
                      useUrlInput ? "text-amber-600 font-bold" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Nhập link URL
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {useUrlInput ? (
                <div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                  {imageUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  )}
                </div>
              ) : imageUrl ? (
                /* Đã có ảnh (từ máy tải lên hoặc có sẵn của sản phẩm) */
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <div className="relative h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                    <img
                      src={imageUrl}
                      alt="Ảnh phụ tùng"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {isEditing ? `Ảnh của ${part?.partNumber}` : "Đã chọn ảnh phụ tùng"}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      ✓ Đã tối ưu hiển thị sắc nét
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Đổi ảnh khác
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500 hover:text-rose-600 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" />
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Chưa có ảnh: Khung kéo thả / click tải từ máy */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/30 p-4 transition-all cursor-pointer text-center"
                >
                  {isProcessingImage ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600 py-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý & tối ưu ảnh...
                    </div>
                  ) : (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-2xs border border-slate-200 group-hover:scale-105 group-hover:border-amber-400 transition-transform mb-1.5 text-amber-600">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-amber-700 transition-colors">
                        Bấm để tải ảnh từ máy tính lên
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        hoặc kéo thả file ảnh vào đây (JPG, PNG, WEBP)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cảnh báo tồn tối thiểu
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Visibility Switch */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800">
                Hiển thị trên giao diện tra cứu công khai
              </span>
              <p className="text-[11px] text-slate-500">
                Tắt tùy chọn này với mã vật tư thử nghiệm nội bộ, mã tạm QAĐP hoặc mã hàng đặc thù xưởng.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* DYNAMIC ATTRIBUTES BUILDER SECTION */}
          {attributes.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-amber-600" />
                  Thuộc tính kỹ thuật mở rộng
                </span>
                <span className="text-[11px] text-slate-400">
                  Tự động sinh theo cấu hình Admin
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attributes.map((attr) => {
                  const currentValue = customAttrs[attr.key] ?? "";

                  return (
                    <div
                      key={attr.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>{attr.name}</span>
                        {attr.isPublic ? (
                          <span className="text-[10px] text-emerald-600 font-normal">
                            Hiện công khai
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal">
                            Chỉ nội bộ
                          </span>
                        )}
                      </label>

                      {attr.dataType === "select" ? (
                        <select
                          value={String(currentValue)}
                          onChange={(e) => handleCustomAttrChange(attr.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="">-- Chọn giá trị --</option>
                          {attr.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : attr.dataType === "number" ? (
                        <input
                          type="number"
                          value={currentValue}
                          onChange={(e) =>
                            handleCustomAttrChange(
                              attr.key,
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          placeholder={`Nhập ${attr.name.toLowerCase()}...`}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(currentValue)}
                          onChange={(e) => handleCustomAttrChange(attr.key, e.target.value)}
                          placeholder={`Nhập ${attr.name.toLowerCase()}...`}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="rounded-xl btn-lonking px-5 py-2 text-xs font-bold text-slate-950 transition-all active:scale-98 shadow-sm flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              {isEditing ? "Cập Nhật Phụ Tùng" : "Tạo Mới Phụ Tùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
