"use client";

import React, { useState, useEffect } from "react";
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

          {/* Image URL & Min Stock Alert */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                Đường dẫn ảnh sản phẩm (URL)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              />
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
