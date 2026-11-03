import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseMisaRawItem } from "@/lib/misa-parser";
import { mapPartToSupabase, mapSupabaseToPart } from "@/lib/supabase-service";
import { Part } from "@/types/inventory";

/**
 * GET /api/parts
 * Lấy danh sách phụ tùng (hỗ trợ tìm kiếm, lọc theo danh mục, phân trang)
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database Supabase chưa được cấu hình" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    let dbQuery = supabaseAdmin
      .from("parts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "Tất cả") {
      dbQuery = dbQuery.eq("category", category);
    }

    if (brand && brand !== "Tất cả") {
      dbQuery = dbQuery.eq("brand", brand);
    }

    if (query) {
      const cleanQ = query.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      dbQuery = dbQuery.or(
        `part_number.ilike.%${query}%,part_number_clean.ilike.%${cleanQ}%,name.ilike.%${query}%,brand.ilike.%${query}%,misa_raw_code.ilike.%${query}%`
      );
    }

    const { data, count, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const parts = (data || []).map(mapSupabaseToPart);

    return NextResponse.json({
      success: true,
      total: count || 0,
      page,
      limit,
      parts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/parts
 * Thêm một phụ tùng mới
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database Supabase chưa được cấu hình" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      misaRawCode,
      name,
      unit = "Cái",
      category,
      brand,
      minStockAlert = 5,
      isVisible = true,
      warehouseStocks = {},
      customAttributes = {},
      images = [],
    } = body;

    if (!name || (!misaRawCode && !body.partNumber)) {
      return NextResponse.json(
        { error: "Tên phụ tùng và Mã phụ tùng (hoặc mã MISA) là bắt buộc" },
        { status: 400 }
      );
    }

    // Tự động phân tích mã MISA nếu có
    const parsed = parseMisaRawItem(misaRawCode || body.partNumber, name);

    // Tính tổng tồn hiển thị
    let totalDisplayStock = 0;
    Object.values(warehouseStocks).forEach((stock: any) => {
      const qty = Number(stock?.stockQty || 0);
      if (qty > 0) totalDisplayStock += qty;
    });

    const newPart: Part = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      misaRawCode: misaRawCode || body.partNumber,
      partNumber: body.partNumber || parsed.partNumber,
      partNumberClean: parsed.partNumberClean,
      crossRefNumbers: body.crossRefNumbers || parsed.crossRefNumbers,
      name,
      unit,
      category: category || parsed.category,
      brand: brand || parsed.brand,
      compatibleModels: body.compatibleModels || parsed.compatibleModels,
      images: images.length > 0 ? images : ["/images/part-placeholder.png"],
      warehouseStocks,
      totalDisplayStock,
      minStockAlert,
      isVisible,
      customAttributes,
    };

    const supabasePayload = mapPartToSupabase(newPart);
    const { error } = await supabaseAdmin.from("parts").insert(supabasePayload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thêm phụ tùng thành công",
        part: newPart,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}

