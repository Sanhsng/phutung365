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
  PhoneCall,
  Menu,
  X,
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
    hotlinePhone,
    updateHotlinePhone,
  } = useInventory();

  const toast = useToast();
  const [hotlineInput, setHotlineInput] = useState(hotlinePhone);

  useEffect(() => {
    setHotlineInput(hotlinePhone);
  }, [hotlinePhone]);

  const handleSaveHotline = () => {
    if (!hotlineInput.trim()) {
      toast.error("Lỗi", "Vui lòng nhập số điện thoại Hotline");
      return;
    }
    updateHotlinePhone(hotlineInput);
    toast.success("Đã cập nhật Hotline", `Số điện thoại & Zalo mới: ${hotlineInput}`);
  };

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("phutung_admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (password: string): boolean => {
    if (password === "adminphutung365") {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md hover:scale-105 transition-transform p-1 overflow-hidden border border-amber-400/40"
              title="Về trang tra cứu khách hàng"
            >
              <img
                src="/images/logo-365.png"
                alt="Logo Phụ Tùng 365"
                className="h-full w-full object-contain"
              />
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

        {/* 2. Inner Secondary White Sidebar (Desktop Style) */}
        <aside className="hidden md:flex md:w-56 bg-white border-r border-slate-200/80 p-4 sm:p-5 flex-col justify-between shrink-0 shadow-2xs">
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

          {/* Nút liên kết về trang tra cứu & Đăng xuất */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Về trang tra cứu</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-600 px-3 py-2 text-xs font-semibold transition-colors shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất quản trị</span>
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MOBILE POPUP DRAWER (Trượt từ cạnh góc bên trái)        */}
        {/* ======================================================== */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-in Container from Left Corner */}
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left duration-200">
              <div className="space-y-5">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 overflow-hidden p-0.5 shadow-2xs flex items-center justify-center">
                      <img
                        src="/images/logo-365.png"
                        alt="Logo Phụ Tùng 365"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="font-bold text-sm text-slate-900 tracking-tight">
                      Quản Trị Kho 365
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Đóng menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Danh sách tab chức năng */}
                <div className="space-y-1 text-xs">
                  {/* Tổng quan kho */}
                  <button
                    onClick={() => {
                      setActiveMenu("overview");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-bold transition-all ${
                      activeMenu === "overview"
                        ? "bg-[#ffc000] text-slate-950 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Tổng quan kho</span>
                  </button>

                  {/* Thuộc tính kỹ thuật */}
                  <button
                    onClick={() => {
                      setActiveMenu("attributes");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "attributes"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                    <span>Thuộc tính kỹ thuật</span>
                  </button>

                  {/* Lịch sử biến động kho */}
                  <button
                    onClick={() => {
                      setActiveMenu("logs");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "logs"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Lịch sử biến động kho</span>
                  </button>

                  {/* Đồng bộ MISA */}
                  <button
                    onClick={() => {
                      setActiveMenu("misa");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "misa"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <PieChart className="h-4 w-4" />
                    <span>Đồng bộ MISA AMIS</span>
                  </button>

                  {/* Thông báo kho */}
                  <button
                    onClick={() => {
                      setActiveMenu("notifications");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "notifications"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Bell className="h-4 w-4" />
                      <span>Thông báo kho</span>
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      10
                    </span>
                  </button>

                  {/* Báo cáo phân tích */}
                  <button
                    onClick={() => {
                      setActiveMenu("analytics");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "analytics"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Báo cáo phân tích</span>
                  </button>

                  {/* Báo cáo đã lưu */}
                  <button
                    onClick={() => {
                      setActiveMenu("saved_reports");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "saved_reports"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Báo cáo đã lưu</span>
                  </button>

                  {/* Lịch trình báo cáo */}
                  <button
                    onClick={() => {
                      setActiveMenu("scheduled_reports");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "scheduled_reports"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Lịch trình báo cáo</span>
                  </button>

                  {/* Báo cáo người dùng */}
                  <button
                    onClick={() => {
                      setActiveMenu("user_reports");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "user_reports"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Báo cáo người dùng</span>
                  </button>

                  {/* Quản lý thông báo */}
                  <button
                    onClick={() => {
                      setActiveMenu("manage_notifications");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-medium transition-all ${
                      activeMenu === "manage_notifications"
                        ? "bg-[#ffc000] text-slate-950 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Quản lý thông báo</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer: Về tra cứu & Đăng xuất */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Về trang tra cứu</span>
                </Link>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-600 px-3 py-2 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Đăng xuất quản trị</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. KHU VỰC NỘI DUNG CHÍNH (Chuẩn Image 3)                 */}
        {/* ======================================================== */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 space-y-5 min-w-0 overflow-y-auto">
          {/* Thanh điều hướng nhanh trên Mobile (Mở popup Menu góc) */}
          <div className="md:hidden flex items-center justify-between bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl btn-lonking text-slate-950 text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <Menu className="h-4 w-4" />
              <span>Menu Quản Trị</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
                {activeMenu === "overview" && "Tổng Quan"}
                {activeMenu === "attributes" && "Thuộc Tính"}
                {activeMenu === "logs" && "Lịch Sử Kho"}
                {activeMenu === "misa" && "MISA Sync"}
                {activeMenu === "notifications" && "Thông Báo"}
                {activeMenu === "analytics" && "Phân Tích"}
                {activeMenu === "saved_reports" && "Báo Cáo Lưu"}
                {activeMenu === "scheduled_reports" && "Lịch Trình"}
                {activeMenu === "user_reports" && "Báo Cáo User"}
                {activeMenu === "manage_notifications" && "Cài Đặt TB"}
              </span>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

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

            {/* Supabase Status Pill & Logout Button */}
            <div className="flex items-center gap-2">
              {isSupabaseConnected ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Supabase: Đã kết nối</span>
                  <span className="sm:hidden">Supabase: OK</span>
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-2xs"
                  title="Thêm NEXT_PUBLIC_SUPABASE_URL & ANON_KEY vào .env.local để kích hoạt"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>DB: Local</span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
                title="Đăng xuất khỏi trang quản trị"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Tiêu đề phân mục & Ô cấu hình nhanh Hotline / Zalo */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Quản Trị Tồn Kho & Danh Mục Phụ Tùng
              </h2>
              <p className="text-[11px] text-slate-500">
                Tra cứu, kiểm kê số lượng tồn và chỉnh sửa thuộc tính kỹ thuật
              </p>
            </div>

            {/* Ô Cấu Hình Số Điện Thoại Hotline & Zalo Báo Giá */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
              <PhoneCall className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Hotline & Zalo Web
                </span>
                <input
                  type="text"
                  value={hotlineInput}
                  onChange={(e) => setHotlineInput(e.target.value)}
                  placeholder="0909123456"
                  className="w-28 sm:w-32 font-mono text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveHotline}
                className="px-3 py-1.5 rounded-lg btn-lonking text-xs font-bold text-slate-950 shadow-2xs hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                Lưu Số
              </button>
            </div>
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
