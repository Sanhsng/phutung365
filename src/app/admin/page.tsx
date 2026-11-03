"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useInventory } from "@/lib/store";
import { Part, AttributeDefinition } from "@/types/inventory";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { PartsManagerTable } from "@/components/admin/PartsManagerTable";
import { StockAdjustModal } from "@/components/admin/StockAdjustModal";
import { PartEditModal } from "@/components/admin/PartEditModal";
import { AttributesManager } from "@/components/admin/AttributesManager";
import { InventoryLogsTable } from "@/components/admin/InventoryLogsTable";
import { MisaSyncPanel } from "@/components/admin/MisaSyncPanel";
import { useToast } from "@/components/ui/Toast";
import {
  Boxes,
  Sliders,
  History,
  ArrowLeft,
  LogOut,
  FileSpreadsheet,
  Home,
  Layers,
  CheckSquare,
  PieChart,
  Users,
  Settings,
  Bell,
  ChevronRight,
  TrendingUp,
  FileText,
  Clock,
  UserCheck,
  Database,
  Cloud,
  UploadCloud,
} from "lucide-react";

/**
 * BPJT SaaS Management Dashboard Page
 * Pixel-perfect implementation matching User Reference Image 3
 */
export default function AdminDashboardPage() {
  const {
    parts,
    warehouses,
    attributes,
    inventoryLogs,
    syncLogs,
    isLoaded,
    addPart,
    updatePart,
    deletePart,
    togglePartVisibility,
    adjustStock,
    addAttributeDefinition,
    updateAttributeDefinition,
    deleteAttributeDefinition,
    toggleWarehouseWebStock,
    batchSyncMisaItems,
    resetToDefault,
    isSupabaseConnected,
    pushToSupabase,
  } = useInventory();

  const toast = useToast();
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("phutung_admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (password: string): boolean => {
    if (password === "admin123" || password === "phutung2026") {
      setIsAuthenticated(true);
      sessionStorage.setItem("phutung_admin_auth", "true");
      toast.success("Đăng nhập thành công", "Chào mừng Olivia / Quản trị viên");
      return true;
    }
    toast.error("Mật khẩu không chính xác", "Vui lòng nhập lại (mặc định: admin123)");
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("phutung_admin_auth");
    toast.info("Đã đăng xuất", "Phiên làm việc quản trị đã kết thúc");
  };

  // Active Menu: "overview" | "notifications" | "analytics" | "saved_reports" | "scheduled_reports" | "user_reports" | "manage_notifications" | "attributes" | "logs" | "misa"
  const [activeMenu, setActiveMenu] = useState<string>("overview");

  // Modals state
  const [adjustingPart, setAdjustingPart] = useState<Part | null>(null);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEdit = (part: Part | null) => {
    setEditingPart(part);
    setIsEditModalOpen(true);
  };

  const handleSavePart = (partData: {
    id?: string;
    misaRawCode: string;
    partNumber: string;
    crossRefNumbers: string[];
    name: string;
    unit: string;
    category: any;
    brand: string;
    compatibleModels: string[];
    images: string[];
    minStockAlert: number;
    isVisible: boolean;
    customAttributes: Record<string, string | number>;
  }) => {
    if (partData.id) {
      updatePart(partData.id, partData);
      toast.success("Cập nhật thành công", `Đã lưu thay đổi cho mã [${partData.partNumber}]`);
    } else {
      addPart({
        misaRawCode: partData.misaRawCode,
        rawName: partData.name,
        unit: partData.unit,
        minStockAlert: partData.minStockAlert,
        isVisible: partData.isVisible,
        images: partData.images,
        customAttributes: partData.customAttributes,
      });
      toast.success("Thêm mới thành công", `Đã tạo mã phụ tùng [${partData.partNumber}]`);
    }
    setIsEditModalOpen(false);
  };

  const handleSaveStock = (params: {
    partId: string;
    warehouseId: string;
    newQty: number;
    performedBy: string;
    notes: string;
    type: "in" | "out" | "adjust";
  }) => {
    adjustStock(params);
    setAdjustingPart(null);
  };

  return (
    <AdminAuthGuard isAuthenticated={isAuthenticated} onLogin={handleLogin}>
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col md:flex-row text-slate-900 selection:bg-[#ffc000] selection:text-slate-950 font-sans">
        {/* ======================================================== */}
        {/* LEFT DUAL SIDEBAR (Exact Match with Image 3)            */}
        {/* ======================================================== */}

        {/* 1. Leftmost Iconic Navigation Strip (Bright Yellow #FCB710) */}
        <div className="hidden lg:flex w-16 bg-[#ffc000] flex-col items-center justify-between py-6 shrink-0 shadow-sm">
          {/* Top Logo */}
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0e1726] text-[#ffc000] font-black shadow-md hover:scale-105 transition-transform"
              title="Về trang tra cứu khách hàng"
            >
              <span className="font-mono text-sm tracking-tighter">LK</span>
            </Link>

            {/* Vertical Stack of Navigation Icons (Image 3 Style) */}
            <div className="flex flex-col items-center gap-3">
              {/* Home / Overview (Active: Navy dark rounded pill) */}
              <button
                onClick={() => setActiveMenu("overview")}
                className={`p-2.5 rounded-2xl transition-all ${activeMenu === "overview"
                    ? "bg-[#0e1726] text-white shadow-md"
                    : "text-slate-900/80 hover:bg-[#e6ad00]"
                  }`}
                title="Overview Dashboard"
              >
                <Home className="h-5 w-5" />
              </button>

              {/* BarChart / Analytics */}
              <button
                onClick={() => setActiveMenu("analytics")}
                className={`p-2.5 rounded-2xl transition-all ${activeMenu === "analytics"
                    ? "bg-[#0e1726] text-white shadow-md"
                    : "text-slate-900/80 hover:bg-[#e6ad00]"
                  }`}
                title="Analytics"
              >
                <TrendingUp className="h-5 w-5" />
              </button>

              {/* Layers */}
              <button
                onClick={() => setActiveMenu("attributes")}
                className={`p-2.5 rounded-2xl transition-all ${activeMenu === "attributes"
                    ? "bg-[#0e1726] text-white shadow-md"
                    : "text-slate-900/80 hover:bg-[#e6ad00]"
                  }`}
                title="Attributes"
              >
                <Layers className="h-5 w-5" />
              </button>

              {/* CheckSquare / Tasks */}
              <button
                onClick={() => setActiveMenu("logs")}
                className={`p-2.5 rounded-2xl transition-all ${activeMenu === "logs"
                    ? "bg-[#0e1726] text-white shadow-md"
                    : "text-slate-900/80 hover:bg-[#e6ad00]"
                  }`}
                title="Inventory Logs"
              >
                <CheckSquare className="h-5 w-5" />
              </button>

              {/* PieChart */}
              <button
                onClick={() => setActiveMenu("misa")}
                className={`p-2.5 rounded-2xl transition-all ${activeMenu === "misa"
                    ? "bg-[#0e1726] text-white shadow-md"
                    : "text-slate-900/80 hover:bg-[#e6ad00]"
                  }`}
                title="MISA Sync"
              >
                <PieChart className="h-5 w-5" />
              </button>

              {/* Users */}
              <button
                onClick={() => setActiveMenu("user_reports")}
                className={`p-2.5 rounded-2xl transition-all ${activeMenu === "user_reports"
                    ? "bg-[#0e1726] text-white shadow-md"
                    : "text-slate-900/80 hover:bg-[#e6ad00]"
                  }`}
                title="User Reports"
              >
                <Users className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Bottom Settings & User Avatar (Image 3 Style) */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setActiveMenu("attributes")}
              className="p-2.5 rounded-2xl text-slate-900/80 hover:bg-[#e6ad00] transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Dark circular avatar */}
            <div
              onClick={handleLogout}
              className="h-9 w-9 rounded-full bg-[#0e1726] text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-md hover:opacity-90"
              title="Olivia (Bấm để đăng xuất)"
            >
              OL
            </div>
          </div>
        </div>

        {/* 2. Inner Secondary White Sidebar (Image 3 Style) */}
        <aside className="w-full md:w-60 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 shadow-2xs">
          <div className="space-y-6">
            {/* Header: Quản Trị Kho */}
            <div className="px-1">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Quản Trị Kho 365
              </h2>
            </div>

            {/* Menu điều hướng */}
            <div className="space-y-1 text-xs">
              {/* Tổng quan kho */}
              <button
                onClick={() => setActiveMenu("overview")}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-bold transition-all ${activeMenu === "overview"
                    ? "bg-[#ffc000] text-slate-950 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Tổng quan kho</span>
              </button>

              {/* Thông báo kho */}
              <button
                onClick={() => setActiveMenu("notifications")}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 font-medium transition-all ${activeMenu === "notifications"
                    ? "bg-[#ffc000] text-slate-950 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="h-4 w-4" />
                  Thông báo kho
                </span>
                <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-semibold">
                  10
                </span>
              </button>

              {/* Báo cáo phân tích */}
              <button
                onClick={() => setActiveMenu("analytics")}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${activeMenu === "analytics"
                    ? "bg-[#ffc000] text-slate-950 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Báo cáo phân tích</span>
              </button>

              {/* Báo cáo đã lưu */}
              <button
                onClick={() => setActiveMenu("saved_reports")}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${activeMenu === "saved_reports"
                    ? "bg-[#ffc000] text-slate-950 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <FileText className="h-4 w-4" />
                <span>Báo cáo đã lưu</span>
              </button>

              {/* Lịch trình báo cáo */}
              <button
                onClick={() => setActiveMenu("scheduled_reports")}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${activeMenu === "scheduled_reports"
                    ? "bg-[#ffc000] text-slate-950 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Clock className="h-4 w-4" />
                <span>Lịch trình báo cáo</span>
              </button>

              {/* Báo cáo người dùng */}
              <button
                onClick={() => setActiveMenu("user_reports")}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${activeMenu === "user_reports"
                    ? "bg-[#ffc000] text-slate-950 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Báo cáo người dùng</span>
              </button>

              {/* Quản lý thông báo */}
              <button
                onClick={() => setActiveMenu("manage_notifications")}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${activeMenu === "manage_notifications"
                    ? "bg-[#ffc000] text-slate-950 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Settings className="h-4 w-4" />
                <span>Quản lý thông báo</span>
              </button>
            </div>
          </div>

          {/* Nút liên kết về trang tra cứu */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Về trang tra cứu</span>
            </Link>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* 3. KHU VỰC NỘI DUNG CHÍNH (Chuẩn Image 3)                 */}
        {/* ======================================================== */}
        <main className="flex-1 p-5 sm:p-7 lg:p-8 space-y-6 overflow-y-auto">
          {/* Breadcrumbs: Icon Home > Trang quản trị > Tổng Quan (Thẻ tag vàng) */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Home className="h-3.5 w-3.5 text-slate-400" />
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span>Trang quản trị</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="rounded bg-[#ffc000] px-2 py-0.5 text-xs font-bold text-slate-950">
              Tổng Quan
            </span>
          </div>

          {/* Lời chào mừng & Trạng thái Database Supabase */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Chào mừng trở lại, Quản trị viên
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi xuất nhập tồn thực tế, quản lý danh mục phụ tùng và đồng bộ chứng từ MISA
              </p>
            </div>

            {/* Supabase Status Pill & Sync Button */}
            <div className="flex items-center gap-2.5">
              {isSupabaseConnected ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Supabase: Đã kết nối</span>
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-2xs"
                  title="Thêm NEXT_PUBLIC_SUPABASE_URL & ANON_KEY vào .env.local để kích hoạt"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>DB: LocalStorage</span>
                </div>
              )}

              {isSupabaseConnected && (
                <button
                  onClick={async () => {
                    setIsSyncingSupabase(true);
                    try {
                      const res = await pushToSupabase();
                      if (res.success) {
                        toast.success(res.message);
                      } else {
                        toast.error(res.message);
                      }
                    } catch (e: any) {
                      toast.error(e?.message || "Lỗi đồng bộ lên Supabase");
                    } finally {
                      setIsSyncingSupabase(false);
                    }
                  }}
                  disabled={isSyncingSupabase}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  title="Đẩy toàn bộ phụ tùng & kho hiện tại lên Supabase"
                >
                  <UploadCloud className={`h-3.5 w-3.5 ${isSyncingSupabase ? "animate-spin" : ""}`} />
                  <span>{isSyncingSupabase ? "Đang đẩy..." : "Đẩy lên Cloud"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tiêu đề phân mục */}
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Quản Trị Tồn Kho & Danh Mục Phụ Tùng
            </h2>
          </div>

          {/* Table & Toolbar (Exact Match with Image 3) */}
          {activeMenu === "overview" && (
            <PartsManagerTable
              parts={parts}
              warehouses={warehouses}
              onToggleVisibility={togglePartVisibility}
              onOpenAdjustStock={(part) => setAdjustingPart(part)}
              onOpenEditPart={handleOpenEdit}
              onDeletePart={deletePart}
            />
          )}

          {activeMenu === "attributes" && (
            <AttributesManager
              attributes={attributes}
              onAddAttribute={addAttributeDefinition}
              onUpdateAttribute={updateAttributeDefinition}
              onDeleteAttribute={deleteAttributeDefinition}
            />
          )}

          {activeMenu === "logs" && (
            <InventoryLogsTable logs={inventoryLogs} />
          )}

          {activeMenu === "misa" && (
            <MisaSyncPanel
              warehouses={warehouses}
              parts={parts}
              attributes={attributes}
              syncLogs={syncLogs}
              onToggleWarehouseWebStock={toggleWarehouseWebStock}
              onBatchSyncMisaItems={batchSyncMisaItems}
            />
          )}

          {(activeMenu === "notifications" ||
            activeMenu === "analytics" ||
            activeMenu === "saved_reports" ||
            activeMenu === "scheduled_reports" ||
            activeMenu === "user_reports" ||
            activeMenu === "manage_notifications") && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
                <h3 className="text-base font-bold text-slate-800 capitalize">
                  {activeMenu.replace("_", " ")}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Báo cáo số liệu và tính năng thông báo theo chuẩn BPJT Industrial SaaS đã sẵn sàng.
                </p>
                <button
                  onClick={() => setActiveMenu("overview")}
                  className="rounded-xl bg-[#0e1726] text-white px-4 py-2 text-xs font-semibold"
                >
                  Quay lại bảng dữ liệu chính
                </button>
              </div>
            )}
        </main>
      </div>

      {/* MODAL: Chỉnh sửa tồn kho */}
      {adjustingPart && (
        <StockAdjustModal
          part={adjustingPart}
          warehouses={warehouses}
          onClose={() => setAdjustingPart(null)}
          onSave={handleSaveStock}
        />
      )}

      {/* MODAL: Thêm mới / Chỉnh sửa thông số phụ tùng */}
      {isEditModalOpen && (
        <PartEditModal
          part={editingPart}
          attributes={attributes}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSavePart}
        />
      )}
    </AdminAuthGuard>
  );
}
