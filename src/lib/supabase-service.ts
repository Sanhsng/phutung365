import { supabase, isSupabaseConfigured } from "./supabase";
import {
  Part,
  Warehouse,
  AttributeDefinition,
  InventoryLog,
  MisaSyncLog,
} from "../types/inventory";

// Mapping Part
export function mapSupabaseToPart(row: any): Part {
  return {
    id: row.id,
    misaRawCode: row.misa_raw_code || "",
    partNumber: row.part_number || "",
    partNumberClean: row.part_number_clean || "",
    crossRefNumbers: row.cross_ref_numbers || [],
    name: row.name || "",
    unit: row.unit || "",
    category: row.category || "Khác",
    brand: row.brand || "Lonking",
    compatibleModels: row.compatible_models || [],
    images: row.images || [],
    warehouseStocks: row.warehouse_stocks || {},
    totalDisplayStock: Number(row.total_display_stock || 0),
    minStockAlert: Number(row.min_stock_alert || 5),
    isVisible: row.is_visible ?? true,
    customAttributes: row.custom_attributes || {},
  };
}

export function mapPartToSupabase(part: Part): any {
  return {
    id: part.id,
    misa_raw_code: part.misaRawCode,
    part_number: part.partNumber,
    part_number_clean: part.partNumberClean,
    cross_ref_numbers: part.crossRefNumbers,
    name: part.name,
    unit: part.unit,
    category: part.category,
    brand: part.brand,
    compatible_models: part.compatibleModels,
    images: part.images,
    warehouse_stocks: part.warehouseStocks,
    total_display_stock: part.totalDisplayStock,
    min_stock_alert: part.minStockAlert,
    is_visible: part.isVisible,
    custom_attributes: part.customAttributes,
    updated_at: new Date().toISOString(),
  };
}

// Mapping Warehouse
export function mapSupabaseToWarehouse(row: any): Warehouse {
  return {
    id: row.id,
    name: row.name,
    includeInWebStock: row.include_in_web_stock ?? true,
    address: row.address,
    description: row.description,
  };
}

export function mapWarehouseToSupabase(w: Warehouse): any {
  return {
    id: w.id,
    name: w.name,
    include_in_web_stock: w.includeInWebStock,
    address: w.address,
    description: w.description,
  };
}

// Mapping Attribute
export function mapSupabaseToAttribute(row: any): AttributeDefinition {
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    dataType: row.data_type,
    options: row.options || [],
    isPublic: row.is_public ?? true,
  };
}

export function mapAttributeToSupabase(attr: AttributeDefinition): any {
  return {
    id: attr.id,
    name: attr.name,
    key: attr.key,
    data_type: attr.dataType,
    options: attr.options,
    is_public: attr.isPublic,
  };
}

// Mapping InventoryLog
export function mapSupabaseToInventoryLog(row: any): InventoryLog {
  return {
    id: row.id,
    partId: row.part_id,
    partNumber: row.part_number,
    warehouseId: row.warehouse_id,
    warehouseName: row.warehouse_name,
    type: row.type,
    quantityChange: Number(row.quantity_change),
    previousQty: Number(row.previous_qty),
    newQty: Number(row.new_qty),
    performedBy: row.performed_by,
    notes: row.notes,
    timestamp: row.timestamp,
  };
}

export function mapInventoryLogToSupabase(log: InventoryLog): any {
  return {
    id: log.id,
    part_id: log.partId,
    part_number: log.partNumber,
    warehouse_id: log.warehouseId,
    warehouse_name: log.warehouseName,
    type: log.type,
    quantity_change: log.quantityChange,
    previous_qty: log.previousQty,
    new_qty: log.newQty,
    performed_by: log.performedBy,
    notes: log.notes,
    timestamp: log.timestamp,
  };
}

// Mapping MisaSyncLog
export function mapSupabaseToMisaSyncLog(row: any): MisaSyncLog {
  return {
    id: row.id,
    syncTime: row.sync_time,
    fileName: row.file_name,
    totalRows: row.total_rows,
    successRows: row.success_rows,
    skippedRows: row.skipped_rows,
    errorRows: row.error_rows,
    status: row.status,
    details: row.details || [],
  };
}

export function mapMisaSyncLogToSupabase(log: MisaSyncLog): any {
  return {
    id: log.id,
    sync_time: log.syncTime,
    file_name: log.fileName,
    total_rows: log.totalRows,
    success_rows: log.successRows,
    skipped_rows: log.skippedRows,
    error_rows: log.errorRows,
    status: log.status,
    details: log.details,
  };
}

// ========================================================
// SUPABASE CRUD OPERATIONS
// ========================================================

export async function fetchAllDataFromSupabase() {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const [partsRes, warehousesRes, attrsRes, logsRes, syncLogsRes] = await Promise.all([
      supabase.from("parts").select("*").order("created_at", { ascending: false }),
      supabase.from("warehouses").select("*").order("name"),
      supabase.from("attributes").select("*").order("name"),
      supabase.from("inventory_logs").select("*").order("timestamp", { ascending: false }).limit(200),
      supabase.from("misa_sync_logs").select("*").order("sync_time", { ascending: false }).limit(50),
    ]);

    if (partsRes.error) throw partsRes.error;

    return {
      parts: (partsRes.data || []).map(mapSupabaseToPart),
      warehouses: (warehousesRes.data || []).map(mapSupabaseToWarehouse),
      attributes: (attrsRes.data || []).map(mapSupabaseToAttribute),
      inventoryLogs: (logsRes.data || []).map(mapSupabaseToInventoryLog),
      syncLogs: (syncLogsRes.data || []).map(mapSupabaseToMisaSyncLog),
    };
  } catch (error) {
    console.error("Lỗi fetch dữ liệu từ Supabase:", error);
    return null;
  }
}

export async function upsertPartInSupabase(part: Part): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("parts").upsert(mapPartToSupabase(part));
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Lỗi lưu phụ tùng lên Supabase:", error);
    return false;
  }
}

export async function deletePartInSupabase(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("parts").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Lỗi xóa phụ tùng trên Supabase:", error);
    return false;
  }
}

export async function upsertInventoryLogInSupabase(log: InventoryLog): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("inventory_logs").upsert(mapInventoryLogToSupabase(log));
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Lỗi lưu log kho lên Supabase:", error);
    return false;
  }
}

export async function upsertMisaSyncLogInSupabase(log: MisaSyncLog): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("misa_sync_logs").upsert(mapMisaSyncLogToSupabase(log));
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Lỗi lưu sync log lên Supabase:", error);
    return false;
  }
}

export async function upsertWarehouseInSupabase(warehouse: Warehouse): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("warehouses").upsert(mapWarehouseToSupabase(warehouse));
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Lỗi lưu kho lên Supabase:", error);
    return false;
  }
}

export async function upsertAttributeInSupabase(attribute: AttributeDefinition): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("attributes").upsert(mapAttributeToSupabase(attribute));
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Lỗi lưu thuộc tính lên Supabase:", error);
    return false;
  }
}

export async function deleteAttributeInSupabase(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("attributes").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Lỗi xóa thuộc tính trên Supabase:", error);
    return false;
  }
}

export async function pushAllLocalDataToSupabase(data: {
  parts: Part[];
  warehouses: Warehouse[];
  attributes: AttributeDefinition[];
  inventoryLogs: InventoryLog[];
  syncLogs: MisaSyncLog[];
}): Promise<{ success: boolean; message: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: "Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local",
    };
  }

  try {
    // 1. Warehouses
    if (data.warehouses.length > 0) {
      const { error: wErr } = await supabase
        .from("warehouses")
        .upsert(data.warehouses.map(mapWarehouseToSupabase));
      if (wErr) throw new Error(`Lỗi kho: ${wErr.message}`);
    }

    // 2. Attributes
    if (data.attributes.length > 0) {
      const { error: aErr } = await supabase
        .from("attributes")
        .upsert(data.attributes.map(mapAttributeToSupabase));
      if (aErr) throw new Error(`Lỗi thuộc tính: ${aErr.message}`);
    }

    // 3. Parts (chia theo batch 100 để tránh giới hạn payload)
    const BATCH_SIZE = 100;
    for (let i = 0; i < data.parts.length; i += BATCH_SIZE) {
      const batch = data.parts.slice(i, i + BATCH_SIZE).map(mapPartToSupabase);
      const { error: pErr } = await supabase.from("parts").upsert(batch);
      if (pErr) throw new Error(`Lỗi phụ tùng (batch ${i}): ${pErr.message}`);
    }

    // 4. Inventory Logs
    if (data.inventoryLogs.length > 0) {
      const logsBatch = data.inventoryLogs.map(mapInventoryLogToSupabase);
      const { error: lErr } = await supabase.from("inventory_logs").upsert(logsBatch);
      if (lErr) throw new Error(`Lỗi nhật ký: ${lErr.message}`);
    }

    // 5. Sync Logs
    if (data.syncLogs.length > 0) {
      const syncBatch = data.syncLogs.map(mapMisaSyncLogToSupabase);
      const { error: sErr } = await supabase.from("misa_sync_logs").upsert(syncBatch);
      if (sErr) throw new Error(`Lỗi sync logs: ${sErr.message}`);
    }

    return {
      success: true,
      message: `Đồng bộ thành công ${data.parts.length} phụ tùng, ${data.warehouses.length} kho, ${data.attributes.length} thuộc tính lên Supabase!`,
    };
  } catch (error: any) {
    console.error("Lỗi đồng bộ lên Supabase:", error);
    return {
      success: false,
      message: error?.message || "Đã xảy ra lỗi khi đẩy dữ liệu lên Supabase.",
    };
  }
}

