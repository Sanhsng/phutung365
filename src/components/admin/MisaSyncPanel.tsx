"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Warehouse, Part, AttributeDefinition, MisaSyncLog } from "@/types/inventory";
import { parseMisaRawItem, normalizeCode } from "@/lib/misa-parser";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  KeyRound,
  Building,
  Warehouse as WarehouseIcon,
  Clock,
  FileCheck,
  ChevronRight,
  Info,
  Check,
  X,
  Play,
  RotateCcw,
  Copy,
  ShieldCheck,
  Zap,
  Radio,
  Send,
  Terminal,
  ExternalLink,
} from "lucide-react";

interface MisaSyncPanelProps {
  warehouses: Warehouse[];
  parts: Part[];
  attributes: AttributeDefinition[];
  syncLogs: MisaSyncLog[];
  onToggleWarehouseWebStock: (whId: string) => void;
  onBatchSyncMisaItems: (
    items: Array<{
      rawCode: string;
      rawName: string;
      unit: string;
      warehouseId: string;
      warehouseName?: string;
      openQty: number;
      inQty: number;
      outQty: number;
      stockQty: number;
    }>,
    sourceFileName?: string
  ) => {
    addedCount: number;
    updatedCount: number;
    negativeCount: number;
    log: MisaSyncLog;
  };
}

interface ParsedExcelRow {
  rawCode: string;
  rawName: string;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  openQty: number;
  inQty: number;
  outQty: number;
  stockQty: number;
  cleanedPartNumber: string;
  category: string;
  isExisting: boolean;
  isNegative: boolean;
}

export function MisaSyncPanel({
  warehouses,
  parts,
  attributes,
  syncLogs,
  onToggleWarehouseWebStock,
  onBatchSyncMisaItems,
}: MisaSyncPanelProps) {
  // --- MISA WEBHOOK & TAB CONFIG STATE ---
  const [syncTab, setSyncTab] = useState<"webhook" | "api">("webhook");
  const [webhookUrl, setWebhookUrl] = useState("/api/misa/sync");
  const [webhookSecret, setWebhookSecret] = useState("whsec_misa_live_ptmn_2026");
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    message: string;
    itemsCount?: number;
    savedToSupabase?: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/misa/sync`);
    }
  }, []);

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch("/api/misa/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookSecret}`,
        },
        body: JSON.stringify({
          appId,
          accessToken,
          companyCode,
          warehouseId: "wh_mn_pt",
          fileName: "MISA_AMIS_TEST_PING",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWebhookTestResult({
          success: true,
          message: data.message || "Kết nối Webhook thành công!",
          itemsCount: data.items?.length,
          savedToSupabase: data.savedToDatabase,
        });
        if (data.items) {
          onBatchSyncMisaItems(data.items, "MISA_AMIS_TEST_PING");
        }
      } else {
        setWebhookTestResult({
          success: false,
          message: data.message || "Webhook trả về lỗi",
        });
      }
    } catch (e: any) {
      setWebhookTestResult({
        success: false,
        message: e?.message || "Không thể gọi endpoint Webhook",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // --- MISA AMIS API CONFIG STATE ---
  const [appId, setAppId] = useState("MISA_AMIS_PT_SOUTH_2026");
  const [accessToken, setAccessToken] = useState("misatk_live_8f93bc2147ae4901");
  const [companyCode, setCompanyCode] = useState("CTY_PHUTUNG_MIENNAM");
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [apiSuccessMessage, setApiSuccessMessage] = useState("");

  // --- AUTO SYNC TIMER STATE ---
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState(15);
  const [countdownSeconds, setCountdownSeconds] = useState(15 * 60);

  // --- EXCEL IMPORTER STATE ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelPreviewRows, setExcelPreviewRows] = useState<ParsedExcelRow[]>([]);
  const [excelStats, setExcelStats] = useState<{
    total: number;
    existing: number;
    newItems: number;
    negatives: number;
  } | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "preview" | "success" | "error">("idle");
  const [importErrorMessage, setImportErrorMessage] = useState("");

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoSyncEnabled) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            handleTriggerApiSync(true);
            return syncIntervalMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [autoSyncEnabled, syncIntervalMinutes]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // --- 1. TRIGGER MISA API SYNC ---
  const handleTriggerApiSync = async (isAuto: boolean = false) => {
    setIsSyncingApi(true);
    setApiSuccessMessage("");

    try {
      const response = await fetch("/api/misa/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          accessToken,
          companyCode,
          warehouseId: "wh_mn_pt",
        }),
      });

      const data = await response.json();
      if (data.success && data.items) {
        const result = onBatchSyncMisaItems(data.items, isAuto ? "MISA_AMIS_AUTOSYNC" : "MISA_AMIS_MANUAL_API");
        setApiSuccessMessage(
          `Đã đồng bộ thành công ${data.items.length} mã (${result.updatedCount} cập nhật, ${result.addedCount} mới tạo, ${result.negativeCount} tồn âm).`
        );
      } else {
        alert("Lỗi phản hồi từ API MISA: " + (data.message || "Không xác định"));
      }
    } catch (err: any) {
      alert("Không thể kết nối API MISA: " + err.message);
    } finally {
      setIsSyncingApi(false);
    }
  };

  // --- 2. SMART EXCEL IMPORT LOGIC (SheetJS) ---
  const mapWarehouseNameToId = (whText: string): { id: string; name: string } => {
    // Tách bỏ tiền tố "Tên kho:" hoặc "Kho:" nếu có
    const cleaned = whText
      .replace(/^(tên\s+kho\s*:|kho\s*:)/i, "")
      .trim();

    const lower = cleaned.toLowerCase();

    // 1. So khớp chính xác hoặc gần đúng với danh sách kho đang có trong hệ thống
    const exactWh = warehouses.find(
      (w) => w.name.toLowerCase() === lower || lower === w.name.toLowerCase()
    );
    if (exactWh) {
      return { id: exactWh.id, name: exactWh.name };
    }

    // 2. Phân loại chuẩn xác 7 kho thực tế từ MISA AMIS
    if (
      lower.includes("bảo hành mb") ||
      lower.includes("bao hanh mb") ||
      (lower.includes("bảo hành") && (lower.includes("mb") || lower.includes("bắc")))
    ) {
      return { id: "wh_mb_bh", name: "Kho bảo hành MB" };
    }
    if (
      lower.includes("bảo hành mn") ||
      lower.includes("bao hanh mn") ||
      (lower.includes("bảo hành") && (lower.includes("mn") || lower.includes("nam")))
    ) {
      return { id: "wh_mn_bh", name: "Kho bảo hành MN" };
    }
    if (lower.includes("biên hòa") || lower.includes("bien hoa")) {
      return { id: "wh_bh_bienhoa", name: "Kho Biên Hòa" };
    }
    if (
      lower.includes("tặng theo xe mb") ||
      (lower.includes("tặng") && (lower.includes("mb") || lower.includes("bắc")))
    ) {
      return { id: "wh_mb_tang", name: "Kho PT tặng theo xe MB" };
    }
    if (
      lower.includes("tặng theo xe mn") ||
      (lower.includes("tặng") && (lower.includes("mn") || lower.includes("nam")))
    ) {
      return { id: "wh_mn_tang", name: "Kho PT tặng theo xe MN" };
    }
    if (
      lower.includes("miền bắc") ||
      lower.includes("mien bac") ||
      lower.includes("hà nội") ||
      (lower.includes("phụ tùng") && lower.includes("mb"))
    ) {
      return { id: "wh_mb_pt", name: "Kho phụ tùng Miền Bắc" };
    }
    if (
      lower.includes("miền nam") ||
      lower.includes("mien nam") ||
      lower.includes("sài gòn") ||
      (lower.includes("phụ tùng") && lower.includes("mn"))
    ) {
      return { id: "wh_mn_pt", name: "Kho phụ tùng Miền Nam" };
    }

    // 3. Fallback: Nếu xuất hiện kho mới chưa từng khai báo, tự tạo ID slug và giữ nguyên tên từ MISA
    const fallbackName = cleaned || "Kho phụ tùng";
    const slug =
      "wh_" +
      normalizeCode(fallbackName)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .substring(0, 20);
    return { id: slug, name: fallbackName };
  };

  const getWarehouseNameById = (id: string): string => {
    return warehouses.find((w) => w.id === id)?.name || id;
  };

  const processExcelFile = (file: File) => {
    setImportStatus("parsing");
    setImportErrorMessage("");
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Đọc toàn bộ sheet thành mảng 2 chiều
        const rawSheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });

        if (rawSheetData.length === 0) {
          throw new Error("Tệp Excel rỗng hoặc không có dữ liệu bảng tính!");
        }

        // Tìm dòng Header có chữ 'Mã hàng', 'Tên hàng'
        let headerRowIndex = -1;
        let colMap = {
          code: -1,
          name: -1,
          unit: -1,
          openQty: -1,
          inQty: -1,
          outQty: -1,
          stockQty: -1,
        };

        for (let i = 0; i < Math.min(25, rawSheetData.length); i++) {
          const row = rawSheetData[i].map((cell) => String(cell).trim().toLowerCase());

          const codeIdx = row.findIndex((c) => c.includes("mã hàng") || c.includes("ma hang") || c === "mã");
          const nameIdx = row.findIndex((c) => c.includes("tên hàng") || c.includes("ten hang") || c.includes("tên vật tư"));

          if (codeIdx !== -1 && nameIdx !== -1) {
            headerRowIndex = i;
            colMap.code = codeIdx;
            colMap.name = nameIdx;
            colMap.unit = row.findIndex((c) => c.includes("đvt") || c.includes("đơn vị tính") || c.includes("dvt"));

            // Tìm các cột số lượng
            colMap.openQty = row.findIndex((c) => c.includes("đầu kỳ") || c.includes("dau ky"));
            colMap.inQty = row.findIndex((c) => c.includes("nhập") || c.includes("nhap"));
            colMap.outQty = row.findIndex((c) => c.includes("xuất") || c.includes("xuat"));
            colMap.stockQty = row.findIndex(
              (c) => c.includes("tồn") || c.includes("cuối kỳ") || c.includes("ton") || c.includes("cuoi ky")
            );
            break;
          }
        }

        // Nếu không tìm thấy Header kiểu MISA chuẩn, fallback về vị trí mặc định phổ biến
        if (headerRowIndex === -1) {
          headerRowIndex = 0;
          colMap = { code: 0, name: 1, unit: 2, openQty: 3, inQty: 4, outQty: 5, stockQty: 6 };
        }

        // Ngữ cảnh kho mặc định ban đầu
        let currentWarehouseId = "wh_mn_pt";
        let currentWarehouseName = "Kho phụ tùng Miền Nam";
        const parsedRows: ParsedExcelRow[] = [];

        // Tạo map để kiểm tra mã đã tồn tại
        const existingCleanMap = new Set(parts.map((p) => p.partNumberClean));
        const existingRawMap = new Set(parts.map((p) => normalizeCode(p.misaRawCode)));

        for (let i = headerRowIndex + 1; i < rawSheetData.length; i++) {
          const row = rawSheetData[i];
          if (!row || row.length === 0) continue;

          const rawCode = String(row[colMap.code] || "").trim();
          const rawName = String(row[colMap.name] || "").trim();

          // 1. Kiểm tra dòng chuyển kho: "Tên kho: Kho bảo hành MB"
          const isWarehouseRow =
            rawCode.toLowerCase().startsWith("tên kho:") ||
            rawCode.toLowerCase().startsWith("kho:") ||
            rawName.toLowerCase().startsWith("tên kho:") ||
            rawName.toLowerCase().startsWith("kho:");

          if (isWarehouseRow) {
            const combinedText = `${rawCode} ${rawName}`.trim();
            const wh = mapWarehouseNameToId(combinedText);
            currentWarehouseId = wh.id;
            currentWarehouseName = wh.name;
            continue;
          }

          // 2. Bỏ qua dòng tổng cộng hoặc rỗng
          if (
            !rawCode ||
            rawCode.toLowerCase().includes("tổng cộng") ||
            rawCode.toLowerCase().includes("tong cong") ||
            rawName.toLowerCase().includes("tổng cộng")
          ) {
            continue;
          }

          // Parse số lượng
          const unit = String(row[colMap.unit] || "Cái").trim();
          const openQty = parseFloat(String(row[colMap.openQty]).replace(/,/g, "")) || 0;
          const inQty = parseFloat(String(row[colMap.inQty]).replace(/,/g, "")) || 0;
          const outQty = parseFloat(String(row[colMap.outQty]).replace(/,/g, "")) || 0;
          const stockQty = parseFloat(String(row[colMap.stockQty]).replace(/,/g, "")) || 0;

          const parsed = parseMisaRawItem(rawCode, rawName);
          const isExisting =
            existingCleanMap.has(parsed.partNumberClean) ||
            existingRawMap.has(normalizeCode(rawCode));

          parsedRows.push({
            rawCode,
            rawName,
            unit,
            warehouseId: currentWarehouseId,
            warehouseName: currentWarehouseName,
            openQty,
            inQty,
            outQty,
            stockQty,
            cleanedPartNumber: parsed.partNumber,
            category: parsed.category,
            isExisting,
            isNegative: stockQty < 0,
          });
        }

        if (parsedRows.length === 0) {
          throw new Error("Không tìm thấy dòng vật tư hàng hóa hợp lệ nào trong tệp Excel!");
        }

        const total = parsedRows.length;
        const existing = parsedRows.filter((r) => r.isExisting).length;
        const newItems = total - existing;
        const negatives = parsedRows.filter((r) => r.isNegative).length;

        setExcelPreviewRows(parsedRows);
        setExcelStats({ total, existing, newItems, negatives });
        setImportStatus("preview");
      } catch (err: any) {
        setImportStatus("error");
        setImportErrorMessage(err.message || "Lỗi đọc tệp Excel");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (excelPreviewRows.length === 0) return;

    const itemsToSync = excelPreviewRows.map((r) => ({
      rawCode: r.rawCode,
      rawName: r.rawName,
      unit: r.unit,
      warehouseId: r.warehouseId,
      warehouseName: r.warehouseName,
      openQty: r.openQty,
      inQty: r.inQty,
      outQty: r.outQty,
      stockQty: r.stockQty,
    }));

    onBatchSyncMisaItems(itemsToSync, excelFileName || "MISA_EXCEL_IMPORT.xlsx");
    setImportStatus("success");
  };

  // --- 3. EXPORT EXCEL LOGIC (SheetJS) ---
  const handleExportExcel = () => {
    // Chuẩn bị dữ liệu mảng các object
    const exportData = parts.map((part, index) => {
      const ptStock = part.warehouseStocks["wh_mn_pt"]?.stockQty ?? 0;
      const bhStock = part.warehouseStocks["wh_mn_bh"]?.stockQty ?? 0;
      const tangStock = part.warehouseStocks["wh_mn_tang"]?.stockQty ?? 0;

      const baseRow: Record<string, any> = {
        "STT": index + 1,
        "Mã phụ tùng chuẩn": part.partNumber,
        "Mã gốc MISA": part.misaRawCode,
        "Mã thay thế / Mã chéo": part.crossRefNumbers.join(", "),
        "Tên phụ tùng vật tư": part.name,
        "Đơn vị tính": part.unit,
        "Chủng loại": part.category,
        "Thương hiệu": part.brand,
        "Dòng máy tương thích": part.compatibleModels.join(", "),
        "Tồn Kho PT Miền Nam": ptStock,
        "Tồn Kho Bảo Hành": bhStock,
        "Tồn Kho Tặng Kèm": tangStock,
        "Tổng Tồn Web Hiển Thị": part.totalDisplayStock,
        "Định mức tồn tối thiểu": part.minStockAlert,
        "Trạng thái hiển thị": part.isVisible ? "Công khai" : "Ẩn nội bộ",
      };

      // Thêm các cột thuộc tính động
      attributes.forEach((attr) => {
        baseRow[`Thuộc tính: ${attr.name}`] = part.customAttributes?.[attr.key] ?? "";
      });

      return baseRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Căn chỉnh độ rộng cột tự động
    const colWidths = [
      { wch: 6 },  // STT
      { wch: 18 }, // Mã chuẩn
      { wch: 26 }, // Mã MISA
      { wch: 22 }, // Mã chéo
      { wch: 45 }, // Tên
      { wch: 8 },  // ĐVT
      { wch: 18 }, // Danh mục
      { wch: 14 }, // Thương hiệu
      { wch: 24 }, // Dòng máy
      { wch: 14 }, // Kho PT
      { wch: 14 }, // Kho BH
      { wch: 14 }, // Kho Tặng
      { wch: 16 }, // Tồn Web
      { wch: 14 }, // Cảnh báo
      { wch: 14 }, // Hiển thị
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bao_Cao_Ton_Kho");

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Bao_cao_ton_kho_Phu_Tung_Mien_Nam_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: CẤU HÌNH KHO & ĐỒNG BỘ API/WEBHOOK MISA AMIS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-5 w-5 text-amber-600" />
              1. Cấu Hình Tích Hợp MISA AMIS Kế Toán
            </h2>
            <p className="text-xs text-slate-500">
              Kết nối Webhook Realtime hoặc Open API MISA AMIS để tự động cập nhật tồn kho tức thì
            </p>
          </div>

          {/* Tab Switcher: Webhook vs API */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSyncTab("webhook")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                syncTab === "webhook"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              <span>Webhook Realtime</span>
            </button>

            <button
              onClick={() => setSyncTab("api")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                syncTab === "api"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
              <span>API Polling</span>
            </button>
          </div>
        </div>

        {/* --- TAB 1: WEBHOOK REALTIME (Khuyến nghị cho MISA AMIS) --- */}
        {syncTab === "webhook" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Cấu Hình Webhook Endpoint (MISA AMIS bắn sự kiện sang)
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ● Endpoint Sẵn Sàng (24/7)
                </span>
              </div>

              {/* Webhook URL Input & Copy Button */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Đường dẫn Webhook URL (Copy dán vào Cài đặt Webhook trên MISA AMIS)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-xs font-semibold text-slate-900 select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    {copiedWebhook ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Chép URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Webhook Secret Key & Event Triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3 text-slate-400" />
                    Webhook Secret Token (Xác thực bảo mật)
                  </label>
                  <input
                    type="text"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    placeholder="whsec_misa_live_..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sự kiện MISA AMIS tự động gửi sang
                  </label>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-700 pt-0.5">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-emerald-800">
                      ✓ Phiếu xuất kho
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-emerald-800">
                      ✓ Phiếu nhập kho
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-600">
                      ✓ Hóa đơn bán hàng
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút Test Ping Webhook */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-amber-200/60">
                <span className="text-[11px] text-slate-600">
                  Gửi dữ liệu kiểm tra mẫu để test xem Webhook có nhận và cập nhật vào kho Supabase không.
                </span>
                <button
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className={`h-3.5 w-3.5 ${isTestingWebhook ? "animate-spin" : ""}`} />
                  <span>{isTestingWebhook ? "Đang gửi test..." : "Test Webhook Ping"}</span>
                </button>
              </div>

              {webhookTestResult && (
                <div
                  className={`rounded-xl p-3 flex items-start gap-2 text-xs font-medium ${
                    webhookTestResult.success
                      ? "bg-emerald-100/80 border border-emerald-300 text-emerald-950"
                      : "bg-rose-50 border border-rose-200 text-rose-900"
                  }`}
                >
                  {webhookTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">
                      {webhookTestResult.success ? "Thành công (200 OK): " : "Thất bại: "}
                    </span>
                    <span>{webhookTestResult.message}</span>
                    {webhookTestResult.savedToSupabase && (
                      <span className="block text-[11px] text-emerald-800 font-mono mt-0.5 font-bold">
                        ✓ Dữ liệu test đã được cập nhật trực tiếp vào Supabase Database!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: API POLLING (Kéo định kỳ) --- */}
        {syncTab === "api" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Cấu hình API Key để máy chủ chủ động gọi sang MISA lấy số dư sổ kho định kỳ.
              </span>
              <button
                onClick={() => handleTriggerApiSync(false)}
                disabled={isSyncingApi}
                className="inline-flex items-center gap-2 rounded-xl btn-lonking px-4 py-2 text-xs font-bold text-slate-950 shadow-xs transition-all disabled:opacity-50 active:scale-98"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncingApi ? "animate-spin text-slate-950" : ""}`} />
                {isSyncingApi ? "Đang đồng bộ MISA..." : "Đồng bộ API MISA ngay"}
              </button>
            </div>

            {apiSuccessMessage && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{apiSuccessMessage}</span>
              </div>
            )}

            {/* API Credentials Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  MISA App ID
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  Access Token
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  Mã Chi Nhánh / Company Code
                </label>
                <input
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Auto-sync Scheduler */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Bật tự động quét MISA theo chu kỳ:
                  </span>
                </label>

                <select
                  disabled={!autoSyncEnabled}
                  value={syncIntervalMinutes}
                  onChange={(e) => {
                    const mins = parseInt(e.target.value);
                    setSyncIntervalMinutes(mins);
                    setCountdownSeconds(mins * 60);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 disabled:opacity-50"
                >
                  <option value={5}>Mỗi 5 phút</option>
                  <option value={15}>Mỗi 15 phút</option>
                  <option value={30}>Mỗi 30 phút</option>
                  <option value={60}>Mỗi 60 phút</option>
                </select>
              </div>

              {autoSyncEnabled && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1 font-mono text-xs font-bold text-amber-700">
                  <Clock className="h-3.5 w-3.5 animate-pulse text-amber-600" />
                  Lần quét kế tiếp sau: {formatCountdown(countdownSeconds)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: SMART EXCEL IMPORTER & EXPORTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Drag-and-drop Excel Importer */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-amber-600" />
                2. Nhập Báo Cáo Tồn Kho Excel MISA AMIS
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ tệp <code>.xlsx</code> xuất trực tiếp từ MISA (tự nhận diện cột & ngữ cảnh kho theo nhóm)
              </p>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processExcelFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-amber-500 bg-amber-50/50"
                : "border-slate-300 bg-slate-50/60 hover:border-amber-500/60 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processExcelFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-2">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Kéo & thả file &quot;Báo cáo tổng hợp tồn kho.xlsx&quot; vào đây hoặc bấm để chọn tệp
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tự động nhận diện cấu trúc phân nhóm: <code>Tên kho: Kho phụ tùng MN</code>, <code>Tên kho: Kho bảo hành MN</code>
            </p>
          </div>

          {importStatus === "parsing" && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-slate-600">
              <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
              Đang phân tích cấu trúc tệp MISA Excel...
            </div>
          )}

          {importStatus === "error" && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{importErrorMessage}</span>
            </div>
          )}

          {importStatus === "success" && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Đã nạp và cập nhật tồn kho thành công từ tệp &quot;{excelFileName}&quot;!
              </div>
              <p className="text-emerald-700 text-[11px]">
                Toàn bộ dữ liệu tồn kho thực tế và tổng tồn web đã được cập nhật chính xác.
              </p>
            </div>
          )}

          {/* Dry-Run Preview Table */}
          {importStatus === "preview" && excelStats && (
            <div className="space-y-3 pt-2">
              {/* Preview Stats Badges */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-slate-100 p-2">
                  <span className="text-[10px] text-slate-500 block uppercase">Tổng dòng đọc</span>
                  <span className="font-mono text-base font-bold text-slate-900">{excelStats.total}</span>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
                  <span className="text-[10px] text-blue-700 block uppercase">Cập nhật tồn</span>
                  <span className="font-mono text-base font-bold text-blue-800">{excelStats.existing}</span>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
                  <span className="text-[10px] text-amber-700 block uppercase">Mã mới tạo</span>
                  <span className="font-mono text-base font-bold text-amber-800">{excelStats.newItems}</span>
                </div>
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2">
                  <span className="text-[10px] text-rose-700 block uppercase">Tồn kho âm</span>
                  <span className="font-mono text-base font-bold text-rose-800">{excelStats.negatives}</span>
                </div>
              </div>

              {/* Preview Table list */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="py-2 pl-3">Mã chuẩn hóa</th>
                      <th className="py-2 px-2">Kho đích</th>
                      <th className="py-2 px-2 text-right">Tồn cuối</th>
                      <th className="py-2 pr-3 text-right">Phân loại tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {excelPreviewRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 pl-3 font-bold text-slate-900">
                          {row.cleanedPartNumber}
                          <span className="block font-sans font-normal text-[10px] text-slate-400 line-clamp-1">
                            {row.rawName}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-sans text-[11px] text-slate-600">
                          {row.warehouseName}
                        </td>
                        <td className="py-1.5 px-2 text-right font-bold">
                          <span className={row.isNegative ? "text-rose-600 bg-rose-50 px-1 rounded" : "text-slate-800"}>
                            {row.stockQty} {row.unit}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3 text-right">
                          {row.isExisting ? (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-sans font-medium text-blue-700">
                              Cập nhật tồn
                            </span>
                          ) : (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-sans font-medium text-amber-700">
                              Tạo mới
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {excelPreviewRows.length > 50 && (
                <p className="text-[11px] text-slate-400 text-center italic">
                  Đang hiển thị 50/{excelPreviewRows.length} dòng xem trước...
                </p>
              )}

              {/* Confirm Import Button */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setImportStatus("idle");
                    setExcelPreviewRows([]);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy xem trước
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="rounded-xl btn-lonking px-5 py-2 text-xs font-bold text-slate-950 transition-all shadow-xs active:scale-98"
                >
                  Xác Nhận Cập Nhật Vào Kho ({excelPreviewRows.length} mã)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Export Excel Action & Quick Info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-600" />
                3. Xuất Dữ Liệu Tồn Kho Ra Excel
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Xuất toàn bộ {parts.length} mã phụ tùng kèm chi tiết từng kho và các thuộc tính động
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-98"
            >
              <Download className="h-4 w-4" />
              Tải File Excel Báo Cáo Tồn Kho
            </button>

            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 space-y-1.5">
              <span className="font-semibold text-slate-700 block">Cấu trúc file xuất gồm:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>Mã chuẩn, mã MISA, mã chéo, dòng máy</li>
                <li>Tồn kho từng điểm: PT MN, Bảo hành, Tặng xe</li>
                <li>Tổng tồn hiển thị web</li>
                <li>Toàn bộ {attributes.length} trường thuộc tính kỹ thuật động</li>
              </ul>
            </div>
          </div>

          {/* Sync History Summary card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-blue-600" />
              Nhật Ký Đồng Bộ Gần Đây
            </h4>

            <div className="space-y-2">
              {syncLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span className="truncate max-w-[170px]" title={log.fileName}>
                      {log.fileName}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded">
                      +{log.successRows} dòng
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(log.syncTime).toLocaleString("vi-VN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
