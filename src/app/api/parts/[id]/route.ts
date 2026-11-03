import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapSupabaseToPart } from "@/lib/supabase-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/parts/[id]
 * Lấy chi tiết 1 phụ tùng
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database chưa cấu hình" }, { status: 503 });
    }

    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("parts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Không tìm thấy phụ tùng" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      part: mapSupabaseToPart(data),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

/**
 * PATCH /api/parts/[id]
 * Cập nhật thông tin phụ tùng
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database chưa cấu hình" }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json();

    // Lấy bản ghi hiện tại
    const { data: existing, error: getErr } = await supabaseAdmin
      .from("parts")
      .select("*")
      .eq("id", id)
      .single();

    if (getErr || !existing) {
      return NextResponse.json({ error: "Không tìm thấy phụ tùng để cập nhật" }, { status: 404 });
    }

    // Nếu có cập nhật warehouseStocks, tính lại totalDisplayStock
    let totalDisplayStock = existing.total_display_stock;
    if (body.warehouseStocks) {
      totalDisplayStock = 0;
      Object.values(body.warehouseStocks).forEach((stock: any) => {
        const qty = Number(stock?.stockQty || 0);
        if (qty > 0) totalDisplayStock += qty;
      });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.category !== undefined) updates.category = body.category;
    if (body.brand !== undefined) updates.brand = body.brand;
    if (body.partNumber !== undefined) {
      updates.part_number = body.partNumber;
      updates.part_number_clean = body.partNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    }
    if (body.crossRefNumbers !== undefined) updates.cross_ref_numbers = body.crossRefNumbers;
    if (body.compatibleModels !== undefined) updates.compatible_models = body.compatibleModels;
    if (body.warehouseStocks !== undefined) {
      updates.warehouse_stocks = body.warehouseStocks;
      updates.total_display_stock = totalDisplayStock;
    }
    if (body.minStockAlert !== undefined) updates.min_stock_alert = body.minStockAlert;
    if (body.isVisible !== undefined) updates.is_visible = body.isVisible;
    if (body.customAttributes !== undefined) updates.custom_attributes = body.customAttributes;
    if (body.images !== undefined) updates.images = body.images;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("parts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật phụ tùng thành công",
      part: mapSupabaseToPart(updated),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

/**
 * DELETE /api/parts/[id]
 * Xóa một phụ tùng
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database chưa cấu hình" }, { status: 503 });
    }

    const { id } = await params;
    const { error } = await supabaseAdmin.from("parts").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa phụ tùng thành công",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

