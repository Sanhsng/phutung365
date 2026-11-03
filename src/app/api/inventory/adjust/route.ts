import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapSupabaseToPart } from "@/lib/supabase-service";

/**
 * POST /api/inventory/adjust
 * Điều chỉnh tồn kho thực tế (nhập/xuất/kiểm kê) và ghi log lịch sử
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database chưa cấu hình" }, { status: 503 });
    }

    const body = await request.json();
    const {
      partId,
      warehouseId,
      newQty,
      type = "adjust",
      performedBy = "Quản trị viên",
      notes = "",
    } = body;

    if (!partId || !warehouseId || newQty === undefined) {
      return NextResponse.json(
        { error: "partId, warehouseId và newQty là bắt buộc" },
        { status: 400 }
      );
    }

    // 1. Lấy thông tin phụ tùng hiện tại
    const { data: partData, error: partErr } = await supabaseAdmin
      .from("parts")
      .select("*")
      .eq("id", partId)
      .single();

    if (partErr || !partData) {
      return NextResponse.json({ error: "Không tìm thấy phụ tùng" }, { status: 404 });
    }

    const warehouseStocks = partData.warehouse_stocks || {};
    const currentWhStock = warehouseStocks[warehouseId] || {
      openQty: 0,
      inQty: 0,
      outQty: 0,
      stockQty: 0,
    };

    const previousQty = Number(currentWhStock.stockQty || 0);
    const quantityChange = Number(newQty) - previousQty;

    const updatedWhStock = {
      ...currentWhStock,
      stockQty: Number(newQty),
      ...(type === "in" && { inQty: Number(currentWhStock.inQty || 0) + quantityChange }),
      ...(type === "out" && { outQty: Number(currentWhStock.outQty || 0) + Math.abs(quantityChange) }),
    };

    const updatedWarehouseStocks = {
      ...warehouseStocks,
      [warehouseId]: updatedWhStock,
    };

    // Tính lại tổng tồn hiển thị trên web
    let totalDisplayStock = 0;
    Object.values(updatedWarehouseStocks).forEach((stock: any) => {
      const q = Number(stock?.stockQty || 0);
      if (q > 0) totalDisplayStock += q;
    });

    // 2. Cập nhật bảng parts
    const { data: updatedPart, error: updateErr } = await supabaseAdmin
      .from("parts")
      .update({
        warehouse_stocks: updatedWarehouseStocks,
        total_display_stock: totalDisplayStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", partId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. Lấy tên kho và ghi log vào inventory_logs
    const { data: whData } = await supabaseAdmin
      .from("warehouses")
      .select("name")
      .eq("id", warehouseId)
      .single();

    const warehouseName = whData?.name || warehouseId;

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      part_id: partId,
      part_number: partData.part_number,
      warehouse_id: warehouseId,
      warehouse_name: warehouseName,
      type,
      quantity_change: quantityChange,
      previous_qty: previousQty,
      new_qty: Number(newQty),
      performed_by: performedBy,
      notes,
      timestamp: new Date().toISOString(),
    };

    await supabaseAdmin.from("inventory_logs").insert(logEntry);

    return NextResponse.json({
      success: true,
      message: "Điều chỉnh tồn kho thành công",
      part: mapSupabaseToPart(updatedPart),
      log: logEntry,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

