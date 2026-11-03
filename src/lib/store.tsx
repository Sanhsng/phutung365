"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Warehouse,
  Part,
  AttributeDefinition,
  InventoryLog,
  MisaSyncLog,
  WarehouseStockDetail,
} from "../types/inventory";
import {
  INITIAL_WAREHOUSES,
  INITIAL_PARTS,
  INITIAL_ATTRIBUTES,
  INITIAL_INVENTORY_LOGS,
  INITIAL_SYNC_LOGS,
  calculateDisplayStock,
} from "./seed-data";
import { normalizeCode, parseMisaRawItem } from "./misa-parser";
import {
  fetchAllDataFromSupabase,
  upsertPartInSupabase,
  deletePartInSupabase,
  upsertInventoryLogInSupabase,
  upsertMisaSyncLogInSupabase,
  upsertWarehouseInSupabase,
  upsertAttributeInSupabase,
  deleteAttributeInSupabase,
  pushAllLocalDataToSupabase,
} from "./supabase-service";
import { isSupabaseConfigured } from "./supabase";

const STORAGE_KEYS = {
  PARTS: "phutung_parts_v1",
  WAREHOUSES: "phutung_warehouses_v1",
  ATTRIBUTES: "phutung_attributes_v1",
  INVENTORY_LOGS: "phutung_inventory_logs_v1",
  SYNC_LOGS: "phutung_sync_logs_v1",
  HOTLINE: "phutung_hotline_v1",
};

export interface AdjustStockParams {
  partId: string;
  warehouseId: string;
  newQty: number;
  performedBy: string;
  notes?: string;
  type?: "in" | "out" | "adjust" | "sync";
}

export interface InventoryContextValue {
  isLoaded: boolean;
  warehouses: Warehouse[];
  parts: Part[];
  attributes: AttributeDefinition[];
  inventoryLogs: InventoryLog[];
  syncLogs: MisaSyncLog[];
  // CRUD Parts
  addPart: (
    partData: {
      misaRawCode: string;
      rawName: string;
      unit: string;
      minStockAlert?: number;
      isVisible?: boolean;
      images?: string[];
      customAttributes?: Record<string, string | number>;
      warehouseStocks?: Record<string, WarehouseStockDetail>;
    }
  ) => Part;
  updatePart: (id: string, updates: Partial<Part>) => void;
  deletePart: (id: string) => void;
  togglePartVisibility: (id: string) => void;
  // Kho & Tồn kho
  adjustStock: (params: AdjustStockParams) => void;
  // Attributes
  addAttributeDefinition: (attr: Omit<AttributeDefinition, "id">) => AttributeDefinition;
  updateAttributeDefinition: (id: string, updates: Partial<AttributeDefinition>) => void;
  deleteAttributeDefinition: (id: string) => void;
  // Cấu hình Kho
  toggleWarehouseWebStock: (warehouseId: string) => void;
  // Logs & Sync
  recordSyncLog: (log: Omit<MisaSyncLog, "id">) => MisaSyncLog;
  batchSyncMisaItems: (
    items: Array<{
      rawCode: string;
      rawName: string;
      unit: string;
      warehouseId: string;
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
  // Reset
  resetToDefault: () => void;
  // Tra cứu nâng cao
  searchParts: (query: string, options?: { showHidden?: boolean; warehouseId?: string; category?: string }) => Part[];
  // Supabase Cloud Sync
  isSupabaseConnected: boolean;
  pushToSupabase: () => Promise<{ success: boolean; message: string }>;
  // Cấu hình Hotline & Liên hệ Zalo
  hotlinePhone: string;
  updateHotlinePhone: (phone: string) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [hotlinePhone, setHotlinePhone] = useState<string>("0909123456");
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [parts, setParts] = useState<Part[]>(INITIAL_PARTS);
  const [attributes, setAttributes] = useState<AttributeDefinition[]>(INITIAL_ATTRIBUTES);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(INITIAL_INVENTORY_LOGS);
  const [syncLogs, setSyncLogs] = useState<MisaSyncLog[]>(INITIAL_SYNC_LOGS);

  // Khởi tạo: Đọc từ LocalStorage trước để UI tức thì, sau đó đồng bộ Supabase (nếu có)
  useEffect(() => {
    try {
      const storedWarehouses = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
      const storedParts = localStorage.getItem(STORAGE_KEYS.PARTS);
      const storedAttrs = localStorage.getItem(STORAGE_KEYS.ATTRIBUTES);
      const storedInvLogs = localStorage.getItem(STORAGE_KEYS.INVENTORY_LOGS);
      const storedSyncLogs = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
      const storedHotline = localStorage.getItem(STORAGE_KEYS.HOTLINE);

      if (storedWarehouses) {
        const parsedWhs: Warehouse[] = JSON.parse(storedWarehouses);
        // Tự động gộp kho mới từ INITIAL_WAREHOUSES (Kho Miền Bắc, Biên Hòa, v.v.)
        const existingIds = new Set(parsedWhs.map((w) => w.id));
        const mergedWhs = [...parsedWhs];
        INITIAL_WAREHOUSES.forEach((initWh) => {
          if (!existingIds.has(initWh.id)) {
            mergedWhs.push(initWh);
          }
        });
        setWarehouses(mergedWhs);
      } else {
        setWarehouses(INITIAL_WAREHOUSES);
      }
      if (storedParts) setParts(JSON.parse(storedParts));
      if (storedAttrs) setAttributes(JSON.parse(storedAttrs));
      if (storedInvLogs) setInventoryLogs(JSON.parse(storedInvLogs));
      if (storedSyncLogs) setSyncLogs(JSON.parse(storedSyncLogs));
      if (storedHotline) setHotlinePhone(storedHotline);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu phụ tùng từ localStorage:", error);
    } finally {
      setIsLoaded(true);
    }

    // Nếu cấu hình Supabase hợp lệ, tải dữ liệu đám mây mới nhất
    if (isSupabaseConfigured()) {
      setIsSupabaseConnected(true);
      fetchAllDataFromSupabase().then((data) => {
        if (data) {
          if (data.parts.length > 0) {
            setParts(data.parts);
            try { localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(data.parts)); } catch (_) {}
          }
          if (data.warehouses.length > 0) {
            setWarehouses(data.warehouses);
            try { localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(data.warehouses)); } catch (_) {}
          }
          if (data.attributes.length > 0) {
            setAttributes(data.attributes);
            try { localStorage.setItem(STORAGE_KEYS.ATTRIBUTES, JSON.stringify(data.attributes)); } catch (_) {}
          }
          if (data.inventoryLogs.length > 0) {
            setInventoryLogs(data.inventoryLogs);
            try { localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(data.inventoryLogs)); } catch (_) {}
          }
          if (data.syncLogs.length > 0) {
            setSyncLogs(data.syncLogs);
            try { localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(data.syncLogs)); } catch (_) {}
          }
        }
      });
    }
  }, []);

  // Đồng bộ lưu Parts vào LocalStorage
  const saveParts = useCallback((newParts: Part[]) => {
    setParts(newParts);
    try {
      localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(newParts));
    } catch (e) {
      console.error("Lỗi lưu Parts vào LocalStorage:", e);
    }
  }, []);

  // Đồng bộ lưu Logs vào LocalStorage
  const saveInventoryLogs = useCallback((newLogs: InventoryLog[]) => {
    setInventoryLogs(newLogs);
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(newLogs));
    } catch (e) {
      console.error("Lỗi lưu InventoryLogs vào LocalStorage:", e);
    }
  }, []);

  // Thêm một phụ tùng mới
  const addPart = useCallback(
    (partData: {
      misaRawCode: string;
      rawName: string;
      unit: string;
      minStockAlert?: number;
      isVisible?: boolean;
      images?: string[];
      customAttributes?: Record<string, string | number>;
      warehouseStocks?: Record<string, WarehouseStockDetail>;
    }): Part => {
      const parsed = parseMisaRawItem(partData.misaRawCode, partData.rawName);
      const stocks = partData.warehouseStocks || {};
      const totalDisplayStock = calculateDisplayStock(stocks, warehouses);

      const newPart: Part = {
        id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        misaRawCode: partData.misaRawCode,
        partNumber: parsed.partNumber,
        partNumberClean: parsed.partNumberClean,
        crossRefNumbers: parsed.crossRefNumbers,
        name: partData.rawName,
        unit: partData.unit,
        category: parsed.category,
        brand: parsed.brand,
        compatibleModels: parsed.compatibleModels,
        images: partData.images && partData.images.length > 0 ? partData.images : ["/images/part-placeholder.png"],
        warehouseStocks: stocks,
        totalDisplayStock,
        minStockAlert: partData.minStockAlert ?? 5,
        isVisible: partData.isVisible ?? true,
        customAttributes: partData.customAttributes || {},
      };

      const updated = [newPart, ...parts];
      saveParts(updated);
      upsertPartInSupabase(newPart).catch(() => {});

      const addLog: InventoryLog = {
        id: `log-add-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        partId: newPart.id,
        partNumber: newPart.partNumber,
        warehouseId: "wh_mn_pt",
        warehouseName: "Kho phụ tùng Miền Nam",
        type: "in",
        quantityChange: totalDisplayStock,
        previousQty: 0,
        newQty: totalDisplayStock,
        timestamp: new Date().toISOString(),
        performedBy: "Quản trị viên",
        notes: `Thêm mới mã phụ tùng [${newPart.partNumber}] vào danh mục`,
      };
      saveInventoryLogs([addLog, ...inventoryLogs]);
      upsertInventoryLogInSupabase(addLog).catch(() => {});

      return newPart;
    },
    [parts, warehouses, inventoryLogs, saveParts, saveInventoryLogs]
  );

  // Cập nhật thông tin phụ tùng
  const updatePart = useCallback(
    (id: string, updates: Partial<Part>) => {
      let targetUpdated: Part | undefined;
      const oldPart = parts.find((p) => p.id === id);

      const updatedList = parts.map((part) => {
        if (part.id !== id) return part;

        const mergedStocks = updates.warehouseStocks ?? part.warehouseStocks;
        const totalDisplayStock = calculateDisplayStock(mergedStocks, warehouses);

        const newPartNumber = updates.partNumber ?? part.partNumber;
        const partNumberClean = normalizeCode(newPartNumber);

        targetUpdated = {
          ...part,
          ...updates,
          partNumber: newPartNumber,
          partNumberClean,
          warehouseStocks: mergedStocks,
          totalDisplayStock,
        };
        return targetUpdated;
      });

      saveParts(updatedList);
      if (targetUpdated) {
        upsertPartInSupabase(targetUpdated).catch(() => {});

        // Ghi nhật ký kiểm toán thay đổi thông tin phụ tùng
        if (oldPart) {
          const changes: string[] = [];
          if (updates.partNumber && updates.partNumber !== oldPart.partNumber) {
            changes.push(`Mã [${oldPart.partNumber} → ${updates.partNumber}]`);
          }
          if (updates.name && updates.name !== oldPart.name) {
            changes.push(`Đổi tên`);
          }
          if (updates.brand && updates.brand !== oldPart.brand) {
            changes.push(`Hãng [${updates.brand}]`);
          }
          if (updates.unit && updates.unit !== oldPart.unit) {
            changes.push(`ĐVT [${updates.unit}]`);
          }
          if (updates.category && updates.category !== oldPart.category) {
            changes.push(`Cụm [${updates.category}]`);
          }
          if (updates.compatibleModels && JSON.stringify(updates.compatibleModels) !== JSON.stringify(oldPart.compatibleModels)) {
            changes.push(`Model tương thích`);
          }
          if (updates.images && updates.images.length !== oldPart.images?.length) {
            changes.push(`Cập nhật ảnh`);
          }

          const changeDesc = changes.length > 0 ? changes.join(", ") : "Cập nhật thông số kỹ thuật";
          const editLog: InventoryLog = {
            id: `log-edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            partId: id,
            partNumber: targetUpdated.partNumber,
            warehouseId: "wh_mn_pt",
            warehouseName: "Kho phụ tùng Miền Nam",
            type: "edit",
            quantityChange: 0,
            previousQty: targetUpdated.totalDisplayStock,
            newQty: targetUpdated.totalDisplayStock,
            timestamp: new Date().toISOString(),
            performedBy: "Quản trị viên",
            notes: `Chỉnh sửa thông tin: ${changeDesc}`,
          };

          const updatedLogs = [editLog, ...inventoryLogs];
          saveInventoryLogs(updatedLogs);
          upsertInventoryLogInSupabase(editLog).catch(() => {});
        }
      }
    },
    [parts, warehouses, inventoryLogs, saveParts, saveInventoryLogs]
  );

  // Xóa phụ tùng
  const deletePart = useCallback(
    (id: string) => {
      const deletedPart = parts.find((p) => p.id === id);
      const updated = parts.filter((p) => p.id !== id);
      saveParts(updated);
      deletePartInSupabase(id).catch(() => {});

      if (deletedPart) {
        const deleteLog: InventoryLog = {
          id: `log-del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          partId: id,
          partNumber: deletedPart.partNumber,
          warehouseId: "wh_mn_pt",
          warehouseName: "Kho phụ tùng Miền Nam",
          type: "adjust",
          quantityChange: -deletedPart.totalDisplayStock,
          previousQty: deletedPart.totalDisplayStock,
          newQty: 0,
          timestamp: new Date().toISOString(),
          performedBy: "Quản trị viên",
          notes: `Xóa mã phụ tùng [${deletedPart.partNumber}] khỏi hệ thống`,
        };
        const updatedLogs = [deleteLog, ...inventoryLogs];
        saveInventoryLogs(updatedLogs);
        upsertInventoryLogInSupabase(deleteLog).catch(() => {});
      }
    },
    [parts, inventoryLogs, saveParts, saveInventoryLogs]
  );

  // Bật/tắt hiển thị phụ tùng (ví dụ ẩn mã QAĐP hoặc mã nội bộ)
  const togglePartVisibility = useCallback(
    (id: string) => {
      let toggledPart: Part | undefined;
      const updated = parts.map((p) => {
        if (p.id === id) {
          toggledPart = { ...p, isVisible: !p.isVisible };
          return toggledPart;
        }
        return p;
      });
      saveParts(updated);
      if (toggledPart) {
        upsertPartInSupabase(toggledPart).catch(() => {});
      }
    },
    [parts, saveParts]
  );

  // Điều chỉnh tồn kho thực tế (nhập/xuất/kiểm kê)
  const adjustStock = useCallback(
    (params: AdjustStockParams) => {
      const targetPart = parts.find((p) => p.id === params.partId);
      if (!targetPart) return;

      const currentWhStock = targetPart.warehouseStocks[params.warehouseId] || {
        openQty: 0,
        inQty: 0,
        outQty: 0,
        stockQty: 0,
      };

      const previousQty = currentWhStock.stockQty;
      const quantityChange = params.newQty - previousQty;

      const updatedWhStock: WarehouseStockDetail = {
        ...currentWhStock,
        stockQty: params.newQty,
        ...(params.type === "in" && { inQty: currentWhStock.inQty + quantityChange }),
        ...(params.type === "out" && { outQty: currentWhStock.outQty + Math.abs(quantityChange) }),
      };

      const updatedWarehouseStocks = {
        ...targetPart.warehouseStocks,
        [params.warehouseId]: updatedWhStock,
      };

      const totalDisplayStock = calculateDisplayStock(updatedWarehouseStocks, warehouses);

      // Cập nhật part
      const updatedParts = parts.map((p) =>
        p.id === params.partId
          ? {
              ...p,
              warehouseStocks: updatedWarehouseStocks,
              totalDisplayStock,
            }
          : p
      );

      saveParts(updatedParts);
      const changedPart = updatedParts.find((p) => p.id === params.partId);
      if (changedPart) upsertPartInSupabase(changedPart).catch(() => {});

      // Ghi log biến động kho
      const whName = warehouses.find((w) => w.id === params.warehouseId)?.name || params.warehouseId;
      const newLog: InventoryLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        partId: targetPart.id,
        partNumber: targetPart.partNumber,
        warehouseId: params.warehouseId,
        warehouseName: whName,
        type: params.type || "adjust",
        quantityChange,
        previousQty,
        newQty: params.newQty,
        timestamp: new Date().toISOString(),
        performedBy: params.performedBy,
        notes: params.notes,
      };

      const updatedLogs = [newLog, ...inventoryLogs];
      saveInventoryLogs(updatedLogs);
      upsertInventoryLogInSupabase(newLog).catch(() => {});
    },
    [parts, warehouses, inventoryLogs, saveParts, saveInventoryLogs]
  );

  // Đẩy toàn bộ dữ liệu Local lên Supabase (Seed / Migration 1-Click)
  const pushToSupabase = useCallback(async () => {
    return pushAllLocalDataToSupabase({
      parts,
      warehouses,
      attributes,
      inventoryLogs,
      syncLogs,
    });
  }, [parts, warehouses, attributes, inventoryLogs, syncLogs]);

  // Quản lý thuộc tính động (AttributeDefinition)
  const addAttributeDefinition = useCallback(
    (attr: Omit<AttributeDefinition, "id">): AttributeDefinition => {
      const newAttr: AttributeDefinition = {
        ...attr,
        id: `attr_${Date.now()}`,
      };
      const updated = [...attributes, newAttr];
      setAttributes(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.ATTRIBUTES, JSON.stringify(updated));
      } catch (e) {
        console.error("Lỗi lưu Attributes:", e);
      }
      upsertAttributeInSupabase(newAttr).catch(() => {});
      return newAttr;
    },
    [attributes]
  );

  const updateAttributeDefinition = useCallback(
    (id: string, updates: Partial<AttributeDefinition>) => {
      let changedAttr: AttributeDefinition | undefined;
      const updated = attributes.map((a) => {
        if (a.id === id) {
          changedAttr = { ...a, ...updates };
          return changedAttr;
        }
        return a;
      });
      setAttributes(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.ATTRIBUTES, JSON.stringify(updated));
      } catch (e) {
        console.error("Lỗi cập nhật Attributes:", e);
      }
      if (changedAttr) {
        upsertAttributeInSupabase(changedAttr).catch(() => {});
      }
    },
    [attributes]
  );

  const deleteAttributeDefinition = useCallback(
    (id: string) => {
      const updated = attributes.filter((a) => a.id !== id);
      setAttributes(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.ATTRIBUTES, JSON.stringify(updated));
      } catch (e) {
        console.error("Lỗi xóa Attribute:", e);
      }
      deleteAttributeInSupabase(id).catch(() => {});
    },
    [attributes]
  );

  // Ghi nhật ký đồng bộ MISA
  const recordSyncLog = useCallback(
    (log: Omit<MisaSyncLog, "id">): MisaSyncLog => {
      const newSyncLog: MisaSyncLog = {
        ...log,
        id: `sync-${Date.now()}`,
      };
      const updated = [newSyncLog, ...syncLogs];
      setSyncLogs(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(updated));
      } catch (e) {
        console.error("Lỗi lưu SyncLog:", e);
      }
      upsertMisaSyncLogInSupabase(newSyncLog).catch(() => {});
      return newSyncLog;
    },
    [syncLogs]
  );

  // Bật/tắt tính tồn kho lên Web cho từng kho
  const toggleWarehouseWebStock = useCallback(
    (warehouseId: string) => {
      let targetWh: Warehouse | undefined;
      const updatedWhs = warehouses.map((wh) => {
        if (wh.id === warehouseId) {
          targetWh = { ...wh, includeInWebStock: !wh.includeInWebStock };
          return targetWh;
        }
        return wh;
      });
      setWarehouses(updatedWhs);
      try {
        localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(updatedWhs));
      } catch (e) {
        console.error("Lỗi lưu Warehouses:", e);
      }
      if (targetWh) {
        upsertWarehouseInSupabase(targetWh).catch(() => {});
      }

      // Tính lại totalDisplayStock cho toàn bộ phụ tùng
      const recalculatedParts = parts.map((part) => ({
        ...part,
        totalDisplayStock: calculateDisplayStock(part.warehouseStocks, updatedWhs),
      }));
      saveParts(recalculatedParts);
    },
    [warehouses, parts, saveParts]
  );

  // Đồng bộ lô dữ liệu từ MISA (API hoặc Excel)
  const batchSyncMisaItems = useCallback(
    (
      items: Array<{
        rawCode: string;
        rawName: string;
        unit: string;
        warehouseId: string;
        openQty: number;
        inQty: number;
        outQty: number;
        stockQty: number;
      }>,
      sourceFileName: string = "MISA_AMIS_SYNC"
    ) => {
      let addedCount = 0;
      let updatedCount = 0;
      let negativeCount = 0;

      const currentPartsMap = new Map<string, Part>();
      parts.forEach((p) => {
        currentPartsMap.set(p.partNumberClean, p);
        currentPartsMap.set(normalizeCode(p.misaRawCode), p);
      });

      const updatedPartsList = [...parts];

      // Đảm bảo tất cả các kho xuất hiện trong file đều được quản lý
      let currentWarehouses = [...warehouses];
      let hasNewWh = false;
      items.forEach((it) => {
        if (it.warehouseId && !currentWarehouses.some((w) => w.id === it.warehouseId)) {
          const isInternal = it.warehouseId.includes("bh") || it.warehouseId.includes("tang");
          const newWh: Warehouse = {
            id: it.warehouseId,
            name: it.warehouseId,
            includeInWebStock: !isInternal,
          };
          currentWarehouses.push(newWh);
          hasNewWh = true;
        }
      });
      if (hasNewWh) {
        setWarehouses(currentWarehouses);
        try {
          localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(currentWarehouses));
        } catch (_) {}
      }

      for (const item of items) {
        if (item.stockQty < 0) negativeCount++;

        const parsed = parseMisaRawItem(item.rawCode, item.rawName);
        const itemClean = parsed.partNumberClean;
        const rawClean = normalizeCode(item.rawCode);

        // Tìm part hiện có theo partNumberClean hoặc rawClean
        const existing =
          currentPartsMap.get(itemClean) || currentPartsMap.get(rawClean);

        if (existing) {
          // Cập nhật tồn kho theo warehouseId, TUYỆT ĐỐI GIỮ NGUYÊN các thông số Admin đã cấu hình
          const existingStocks = { ...existing.warehouseStocks };
          existingStocks[item.warehouseId] = {
            openQty: item.openQty,
            inQty: item.inQty,
            outQty: item.outQty,
            stockQty: item.stockQty,
          };

          const totalDisplayStock = calculateDisplayStock(existingStocks, currentWarehouses);

          // Cập nhật trong mảng
          const idx = updatedPartsList.findIndex((p) => p.id === existing.id);
          if (idx !== -1) {
            updatedPartsList[idx] = {
              ...existing,
              warehouseStocks: existingStocks,
              totalDisplayStock,
            };
            // Cập nhật map để các item lặp sau (khác kho) tiếp tục cập nhật
            currentPartsMap.set(itemClean, updatedPartsList[idx]);
          }
          updatedCount++;
        } else {
          // Thêm mới
          const stocks: Record<string, WarehouseStockDetail> = {
            [item.warehouseId]: {
              openQty: item.openQty,
              inQty: item.inQty,
              outQty: item.outQty,
              stockQty: item.stockQty,
            },
          };

          const totalDisplayStock = calculateDisplayStock(stocks, currentWarehouses);

          const newPart: Part = {
            id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            misaRawCode: item.rawCode,
            partNumber: parsed.partNumber,
            partNumberClean: parsed.partNumberClean,
            crossRefNumbers: parsed.crossRefNumbers,
            name: item.rawName,
            unit: item.unit || "Cái",
            category: parsed.category,
            brand: parsed.brand,
            compatibleModels: parsed.compatibleModels,
            images: [],
            warehouseStocks: stocks,
            totalDisplayStock,
            minStockAlert: 5,
            isVisible: true,
            customAttributes: {},
          };

          updatedPartsList.unshift(newPart);
          currentPartsMap.set(itemClean, newPart);
          addedCount++;
        }
      }

      saveParts(updatedPartsList);

      // Ghi nhật ký đồng bộ MisaSyncLog
      const newSyncLog: MisaSyncLog = {
        id: `sync-${Date.now()}`,
        syncTime: new Date().toISOString(),
        fileName: sourceFileName,
        totalRows: items.length,
        successRows: addedCount + updatedCount,
        skippedRows: 0,
        errorRows: 0,
        status: "success",
        details: [
          `Đã cập nhật tồn kho cho ${updatedCount} mã phụ tùng hiện có.`,
          `Đã tạo mới ${addedCount} mã phụ tùng phát sinh.`,
          `Phát hiện ${negativeCount} lượt tồn kho âm kế toán.`,
        ],
      };

      const updatedSyncLogs = [newSyncLog, ...syncLogs];
      setSyncLogs(updatedSyncLogs);
      try {
        localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(updatedSyncLogs));
      } catch (e) {
        console.error("Lỗi lưu SyncLogs:", e);
      }

      return {
        addedCount,
        updatedCount,
        negativeCount,
        log: newSyncLog,
      };
    },
    [parts, warehouses, syncLogs, saveParts]
  );

  // Khôi phục dữ liệu ban đầu
  const resetToDefault = useCallback(() => {
    setWarehouses(INITIAL_WAREHOUSES);
    setParts(INITIAL_PARTS);
    setAttributes(INITIAL_ATTRIBUTES);
    setInventoryLogs(INITIAL_INVENTORY_LOGS);
    setSyncLogs(INITIAL_SYNC_LOGS);

    try {
      localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(INITIAL_WAREHOUSES));
      localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(INITIAL_PARTS));
      localStorage.setItem(STORAGE_KEYS.ATTRIBUTES, JSON.stringify(INITIAL_ATTRIBUTES));
      localStorage.setItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(INITIAL_INVENTORY_LOGS));
      localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(INITIAL_SYNC_LOGS));
    } catch (e) {
      console.error("Lỗi khôi phục mặc định:", e);
    }
  }, []);

  // Tìm kiếm phụ tùng hỗ trợ tìm kiếm 1 phần mã không dấu nối, mã cross-ref, tên, model
  const searchParts = useCallback(
    (
      query: string,
      options?: { showHidden?: boolean; warehouseId?: string; category?: string }
    ): Part[] => {
      const cleanQuery = normalizeCode(query);
      const textQuery = query.trim().toLowerCase();

      return parts.filter((part) => {
        // Lọc ẩn/hiện
        if (!options?.showHidden && !part.isVisible) {
          return false;
        }

        // Lọc theo danh mục
        if (options?.category && options.category !== "Tất cả" && part.category !== options.category) {
          return false;
        }

        // Lọc theo kho còn hàng nếu có chỉ định warehouseId
        if (options?.warehouseId) {
          const stock = part.warehouseStocks[options.warehouseId]?.stockQty ?? 0;
          if (stock <= 0) return false;
        }

        // Nếu không có từ khóa tìm kiếm -> trả về true
        if (!textQuery && !cleanQuery) return true;

        // 1. Khớp mã clean chính hoặc 1 phần mã clean chính
        if (cleanQuery && part.partNumberClean.includes(cleanQuery)) {
          return true;
        }

        // 2. Khớp mã tham chiếu chéo (crossRefNumbers)
        for (const ref of part.crossRefNumbers) {
          if (normalizeCode(ref).includes(cleanQuery)) {
            return true;
          }
        }

        // 3. Khớp tên vật tư
        if (part.name.toLowerCase().includes(textQuery)) {
          return true;
        }

        // 4. Khớp thương hiệu
        if (part.brand.toLowerCase().includes(textQuery)) {
          return true;
        }

        // 5. Khớp model máy tương thích
        for (const model of part.compatibleModels) {
          if (model.toLowerCase().includes(textQuery)) {
            return true;
          }
        }

        // 6. Khớp mã MISA thô
        if (part.misaRawCode.toLowerCase().includes(textQuery)) {
          return true;
        }

        return false;
      });
    },
    [parts]
  );

  const updateHotlinePhone = useCallback((phone: string) => {
    const clean = phone.trim();
    setHotlinePhone(clean);
    try {
      localStorage.setItem(STORAGE_KEYS.HOTLINE, clean);
    } catch (e) {
      console.error("Lỗi khi lưu số điện thoại Hotline:", e);
    }
  }, []);

  const value = useMemo(
    () => ({
      isLoaded,
      isSupabaseConnected,
      warehouses,
      parts,
      attributes,
      inventoryLogs,
      syncLogs,
      hotlinePhone,
      updateHotlinePhone,
      addPart,
      updatePart,
      deletePart,
      togglePartVisibility,
      adjustStock,
      addAttributeDefinition,
      updateAttributeDefinition,
      deleteAttributeDefinition,
      toggleWarehouseWebStock,
      recordSyncLog,
      batchSyncMisaItems,
      resetToDefault,
      searchParts,
      pushToSupabase,
    }),
    [
      isLoaded,
      isSupabaseConnected,
      warehouses,
      parts,
      attributes,
      inventoryLogs,
      syncLogs,
      hotlinePhone,
      updateHotlinePhone,
      addPart,
      updatePart,
      deletePart,
      togglePartVisibility,
      adjustStock,
      addAttributeDefinition,
      updateAttributeDefinition,
      deleteAttributeDefinition,
      toggleWarehouseWebStock,
      recordSyncLog,
      batchSyncMisaItems,
      resetToDefault,
      searchParts,
      pushToSupabase,
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory phải được sử dụng bên trong <InventoryProvider>");
  }
  return context;
}
