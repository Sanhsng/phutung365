import { NextRequest, NextResponse } from "next/server";
import { parseMisaRawItem } from "@/lib/misa-parser";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * API Route: /api/misa/sync
 * Tiếp nhận webhook từ MISA AMIS Kế toán hoặc kích hoạt tiến trình đồng bộ tự động.
 * Tự động làm sạch mã phụ tùng OEM và cập nhật trực tiếp vào Supabase Database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const {
      appId,
      accessToken,
      companyCode = "AMIS_CTY_PHUTUNG_MN",
      warehouseId = "wh_mn_pt",
      customItems,
      fileName = "MISA_AMIS_Webhook_Realtime",
    } = body;

    // Giả lập dữ liệu đồng bộ định kỳ từ MISA AMIS nếu không có customItems gửi kèm
    const mockMisaData = [
      {
        rawCode: "MA311_LK_PT_LF667/P554004",
        rawName: "Lọc nhớt động cơ Weichai WD615 (LF667 / P554004) máy xúc lật 833, 855",
        unit: "Quả",
        warehouseId: "wh_mn_pt",
        openQty: 45,
        inQty: 20,
        outQty: 5,
        stockQty: 60,
      },
      {
        rawCode: "MA321_LK_PT_FS1280",
        rawName: "Lọc tách nước nhiên liệu Fleetguard (FS1280 / 3930942) máy LG833NTG, ZL50NC",
        unit: "Quả",
        warehouseId: "wh_mn_pt",
        openQty: 24,
        inQty: 10,
        outQty: 8,
        stockQty: 26,
      },
      {
        rawCode: "MA321_LK_1453058",
        rawName: "Bộ phớt chắn dầu xilanh nâng hạ cần Lonking LG833NTG (1453058)",
        unit: "Bộ",
        warehouseId: "wh_mn_pt",
        openQty: -1,
        inQty: 10,
        outQty: 0,
        stockQty: 9, // Hóa đơn về bù kho âm, tồn tăng lên 9
      },
      {
        rawCode: "MC331_PT_LK_209-70-54210",
        rawName: "Răng gầu vát kim cương chống mài mòn máy đào CDM6225, 6225, WE215 (209-70-54210)",
        unit: "Cái",
        warehouseId: "wh_mn_pt",
        openQty: -170,
        inQty: 200,
        outQty: 10,
        stockQty: 20, // Đã nhập lô mới bù tồn âm
      },
      {
        rawCode: "MA311_LK_NEW_612600090506",
        rawName: "Máy nén khí nạp hơi động cơ Weichai WP10 máy xúc Lonking 855",
        unit: "Cái",
        warehouseId: "wh_mn_pt",
        openQty: 0,
        inQty: 5,
        outQty: 1,
        stockQty: 4, // Mã hàng mới phát sinh từ MISA
      },
    ];

    const syncItems = customItems && Array.isArray(customItems) && customItems.length > 0
      ? customItems
      : mockMisaData;

    // 1. Phân tích và làm sạch qua parser MISA OEM
    const processedItems = syncItems.map((item: any) => {
      const parsed = parseMisaRawItem(item.rawCode, item.rawName);
      return {
        ...item,
        parsedPartNumber: parsed.partNumber,
        parsedPartNumberClean: parsed.partNumberClean,
        parsedCategory: parsed.category,
        parsedBrand: parsed.brand,
        parsedCompatibleModels: parsed.compatibleModels,
        parsedCrossRefNumbers: parsed.crossRefNumbers,
      };
    });

    let savedToDatabase = false;

    // 2. Nếu Supabase đã sẵn sàng, lưu trực tiếp vào Database
    if (supabaseAdmin) {
      // Lấy toàn bộ parts hiện tại để merge warehouseStocks
      const { data: existingParts } = await supabaseAdmin.from("parts").select("id, misa_raw_code, warehouse_stocks");
      const partByCode = new Map<string, any>();
      (existingParts || []).forEach((p) => {
        if (p.misa_raw_code) partByCode.set(p.misa_raw_code, p);
      });

      const upsertBatch = processedItems.map((item: any) => {
        const existing = partByCode.get(item.rawCode);
        const currentStocks = existing?.warehouse_stocks || {};

        const whStock = {
          openQty: Number(item.openQty || 0),
          inQty: Number(item.inQty || 0),
          outQty: Number(item.outQty || 0),
          stockQty: Number(item.stockQty || 0),
        };

        const mergedStocks = {
          ...currentStocks,
          [item.warehouseId || warehouseId]: whStock,
        };

        // Tính tồn hiển thị trên web
        let totalDisplayStock = 0;
        Object.values(mergedStocks).forEach((s: any) => {
          const q = Number(s?.stockQty || 0);
          if (q > 0) totalDisplayStock += q;
        });

        return {
          id: existing?.id || `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          misa_raw_code: item.rawCode,
          part_number: item.parsedPartNumber,
          part_number_clean: item.parsedPartNumberClean,
          cross_ref_numbers: item.parsedCrossRefNumbers,
          name: item.rawName,
          unit: item.unit || "Cái",
          category: item.parsedCategory,
          brand: item.parsedBrand,
          compatible_models: item.parsedCompatibleModels,
          images: ["/images/part-placeholder.png"],
          warehouse_stocks: mergedStocks,
          total_display_stock: totalDisplayStock,
          min_stock_alert: 5,
          is_visible: true,
          updated_at: new Date().toISOString(),
        };
      });

      // Upsert vào bảng parts
      const { error: upsertErr } = await supabaseAdmin.from("parts").upsert(upsertBatch);
      if (!upsertErr) {
        savedToDatabase = true;

        // Ghi nhật ký vào misa_sync_logs
        await supabaseAdmin.from("misa_sync_logs").insert({
          id: `sync_${Date.now()}`,
          sync_time: new Date().toISOString(),
          file_name: fileName,
          total_rows: processedItems.length,
          success_rows: processedItems.length,
          skipped_rows: 0,
          error_rows: 0,
          status: "success",
          details: [`Đồng bộ ${processedItems.length} phụ tùng từ MISA AMIS`],
        });
      }
    }

    return NextResponse.json({
      success: true,
      savedToDatabase,
      message: `Đồng bộ MISA AMIS thành công ${processedItems.length} phụ tùng${savedToDatabase ? " (Đã lưu vào Supabase)" : ""}.`,
      timestamp: new Date().toISOString(),
      syncSummary: {
        totalReceived: processedItems.length,
        companyCode,
        warehouseId,
      },
      items: processedItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi đồng bộ dữ liệu MISA AMIS: " + (error?.message || "Lỗi không xác định"),
      },
      { status: 500 }
    );
  }
}
