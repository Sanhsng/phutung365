"use client";

import React, { useState } from "react";
import { AttributeDefinition } from "@/types/inventory";
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Type,
  Hash,
  ListFilter,
  Layers,
  HelpCircle,
} from "lucide-react";

interface AttributesManagerProps {
  attributes: AttributeDefinition[];
  onAddAttribute: (attr: Omit<AttributeDefinition, "id">) => void;
  onUpdateAttribute: (id: string, updates: Partial<AttributeDefinition>) => void;
  onDeleteAttribute: (id: string) => void;
}

export function AttributesManager({
  attributes,
  onAddAttribute,
  onUpdateAttribute,
  onDeleteAttribute,
}: AttributesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [dataType, setDataType] = useState<"text" | "number" | "select">("text");
  const [optionsInput, setOptionsInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Tự sinh key từ name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      const generatedKey = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      setKey(generatedKey);
    }
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName("");
    setKey("");
    setDataType("text");
    setOptionsInput("");
    setIsPublic(true);
  };

  const handleStartEdit = (attr: AttributeDefinition) => {
    setEditingId(attr.id);
    setIsAdding(false);
    setName(attr.name);
    setKey(attr.key);
    setDataType(attr.dataType);
    setOptionsInput(attr.options.join(", "));
    setIsPublic(attr.isPublic);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    const options =
      dataType === "select"
        ? optionsInput
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
        : [];

    if (editingId) {
      onUpdateAttribute(editingId, {
        name: name.trim(),
        key: key.trim(),
        dataType,
        options,
        isPublic,
      });
      setEditingId(null);
    } else {
      onAddAttribute({
        name: name.trim(),
        key: key.trim(),
        dataType,
        options,
        isPublic,
      });
      setIsAdding(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "number":
        return <Hash className="h-3.5 w-3.5 text-blue-500" />;
      case "select":
        return <ListFilter className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <Type className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-600" />
            Cấu Hình Thuộc Tính Động (Dynamic Attributes Builder)
          </h2>
          <p className="text-xs text-slate-500">
            Tùy biến các trường thông số kỹ thuật (Kích thước, áp lực, vị trí lưu kho) áp dụng cho mọi phụ tùng
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1.5 rounded-xl btn-lonking px-4 py-2 text-xs font-bold text-slate-950 shadow-xs transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" />
            Thêm Thuộc Tính Mới
          </button>
        )}
      </div>

      {/* Form Thêm / Sửa Thuộc Tính */}
      {(isAdding || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-amber-500/40 bg-amber-50/20 p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {editingId ? "Cập Nhật Thuộc Tính" : "Tạo Thuộc Tính Mới"}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên hiển thị thuộc tính (*)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: Vị trí kệ kho, Đường kính ren..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khóa nhận diện (Key viết liền không dấu)
              </label>
              <input
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="VD: shelf_location, thread_size..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* DataType */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kiểu dữ liệu nhập liệu
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as "text" | "number" | "select")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                <option value="text">Văn bản ngắn (text)</option>
                <option value="number">Số đo kỹ thuật (number)</option>
                <option value="select">Danh sách chọn một (select)</option>
              </select>
            </div>
          </div>

          {/* Select Options input nếu kiểu select */}
          {dataType === "select" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Các tùy chọn danh sách (Phân tách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={optionsInput}
                onChange={(e) => setOptionsInput(e.target.value)}
                placeholder="VD: Kệ A1-01, Kệ B2-05, Tầng 3 kho..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}

          {/* Public or Internal Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <div>
              <span className="text-xs font-semibold text-slate-800">
                Hiển thị công khai trên giao diện tra cứu khách hàng
              </span>
              <p className="text-[11px] text-slate-500">
                Nếu tắt, thuộc tính này chỉ xuất hiện trong trang quản trị nội bộ (thích hợp cho Vị trí kho, Giá vốn, Mã lô).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-xl btn-lonking px-5 py-2 text-xs font-bold text-slate-950 transition-all shadow-xs active:scale-98"
            >
              {editingId ? "Lưu Thay Đổi" : "Tạo Thuộc Tính"}
            </button>
          </div>
        </form>
      )}

      {/* Attributes List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 pl-4 pr-3">Tên thuộc tính</th>
                <th className="px-3 py-3">Khóa định danh (Key)</th>
                <th className="px-3 py-3">Kiểu dữ liệu</th>
                <th className="px-3 py-3">Tùy chọn cấu hình</th>
                <th className="px-3 py-3">Quyền hiển thị</th>
                <th className="py-3 pl-3 pr-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {attributes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có thuộc tính động nào được khởi tạo.
                  </td>
                </tr>
              ) : (
                attributes.map((attr) => (
                  <tr key={attr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-4 pr-3 font-semibold text-slate-900">
                      {attr.name}
                    </td>

                    <td className="px-3 py-3">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded tracking-tight">
                        {attr.key}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 font-medium">
                        {getTypeIcon(attr.dataType)}
                        <span className="capitalize">{attr.dataType}</span>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      {attr.options.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {attr.options.map((opt, i) => (
                            <span
                              key={i}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Nhập tự do</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {attr.isPublic ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <Eye className="h-3 w-3" /> Hiện công khai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          <EyeOff className="h-3 w-3" /> Chỉ nội bộ
                        </span>
                      )}
                    </td>

                    <td className="py-3 pl-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(attr)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          title="Chỉnh sửa thuộc tính"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc chắn muốn xóa thuộc tính "${attr.name}"?`)) {
                              onDeleteAttribute(attr.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Xóa thuộc tính"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
