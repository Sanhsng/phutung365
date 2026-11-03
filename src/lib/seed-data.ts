import {
  Warehouse,
  Part,
  AttributeDefinition,
  InventoryLog,
  MisaSyncLog,
  WarehouseStockDetail,
} from "../types/inventory";
import { parseMisaRawItem, normalizeCode } from "./misa-parser";

/**
 * Danh sách 7 kho hàng thực tế của công ty (đồng bộ chuẩn MISA AMIS)
 */
export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: "wh_mn_pt",
    name: "Kho phụ tùng Miền Nam",
    includeInWebStock: true,
    address: "Km 12+500, Quốc lộ 1A, Bình Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh",
    description: "Kho tổng phân phối phụ tùng thương mại bán hàng toàn Miền Nam",
  },
  {
    id: "wh_mb_pt",
    name: "Kho phụ tùng Miền Bắc",
    includeInWebStock: true,
    address: "Khu công nghiệp Đài Tư, 386 Nguyễn Văn Linh, Sài Đồng, Long Biên, Hà Nội",
    description: "Kho tổng phân phối phụ tùng thương mại bán hàng toàn Miền Bắc",
  },
  {
    id: "wh_bh_bienhoa",
    name: "Kho Biên Hòa",
    includeInWebStock: true,
    address: "Bãi máy Trung tâm bàn giao xe, Biên Hòa, Đồng Nai",
    description: "Kho bãi trung tâm bàn giao xe & phụ tùng cơ giới Biên Hòa",
  },
  {
    id: "wh_mn_bh",
    name: "Kho bảo hành MN",
    includeInWebStock: false,
    address: "Xưởng dịch vụ kỹ thuật Miền Nam, P. Linh Trung, TP. Thủ Đức",
    description: "Kho dự trữ phụ tùng phục vụ bảo hành, thay thế lưu động Miền Nam",
  },
  {
    id: "wh_mb_bh",
    name: "Kho bảo hành MB",
    includeInWebStock: false,
    address: "Xưởng dịch vụ kỹ thuật Miền Bắc, Long Biên, Hà Nội",
    description: "Kho dự trữ phụ tùng phục vụ bảo hành, thay thế lưu động Miền Bắc",
  },
  {
    id: "wh_mn_tang",
    name: "Kho PT tặng theo xe MN",
    includeInWebStock: false,
    address: "Bãi máy Trung tâm bàn giao xe, Biên Hòa, Đồng Nai",
    description: "Kho phụ tùng đi kèm gói khuyến mãi bàn giao theo máy mới Miền Nam",
  },
  {
    id: "wh_mb_tang",
    name: "Kho PT tặng theo xe MB",
    includeInWebStock: false,
    address: "Bãi máy Trung tâm bàn giao xe, Long Biên, Hà Nội",
    description: "Kho phụ tùng đi kèm gói khuyến mãi bàn giao theo máy mới Miền Bắc",
  },
];

/**
 * Danh mục thuộc tính động cấu hình cho phụ tùng
 */
export const INITIAL_ATTRIBUTES: AttributeDefinition[] = [
  {
    id: "attr_thread_size",
    name: "Kích thước ren",
    key: "thread_size",
    dataType: "text",
    options: [],
    isPublic: true,
  },
  {
    id: "attr_height_mm",
    name: "Chiều cao (mm)",
    key: "height_mm",
    dataType: "number",
    options: [],
    isPublic: true,
  },
  {
    id: "attr_outer_diameter_mm",
    name: "Đường kính ngoài (mm)",
    key: "outer_diameter_mm",
    dataType: "number",
    options: [],
    isPublic: true,
  },
  {
    id: "attr_micron_rating",
    name: "Độ tinh lọc (Micron)",
    key: "micron_rating",
    dataType: "number",
    options: [],
    isPublic: true,
  },
  {
    id: "attr_voltage",
    name: "Điện áp định mức",
    key: "voltage",
    dataType: "select",
    options: ["12V", "24V", "28V", "Không dùng điện"],
    isPublic: true,
  },
  {
    id: "attr_origin",
    name: "Xuất xứ",
    key: "origin",
    dataType: "select",
    options: ["Chính hãng Trung Quốc", "USA / Singapore", "OEM Đức", "Hàn Quốc", "Việt Nam"],
    isPublic: true,
  },
];

/**
 * Tính toán số lượng tồn hiển thị cho khách/bán hàng (chỉ tính các kho includeInWebStock = true).
 * Quy tắc: Nếu tổng tồn kho web âm thì quy về 0.
 */
export function calculateDisplayStock(
  stocks: Record<string, WarehouseStockDetail>,
  warehouses: Warehouse[] = INITIAL_WAREHOUSES
): number {
  let total = 0;
  for (const wh of warehouses) {
    if (wh.includeInWebStock && stocks[wh.id]) {
      total += stocks[wh.id].stockQty;
    }
  }
  return total > 0 ? total : 0;
}

/**
 * 15 mã phụ tùng thực tế từ kho Miền Nam (chuẩn hóa tiền tố, tồn âm, đa kho và mã nội bộ)
 */
interface RawSeedItem {
  id: string;
  misaRawCode: string;
  rawName: string;
  unit: string;
  minStockAlert: number;
  isVisible: boolean;
  images: string[];
  customAttributes: Record<string, string | number>;
  warehouseStocks: Record<string, WarehouseStockDetail>;
}

const RAW_SEED_DATA: RawSeedItem[] = [
  // 1. Lọc nhớt - Mã chéo kép, tồn sẵn kho thương mại
  {
    id: "part-001",
    misaRawCode: "MA311_LK_PT_LF667/P554004",
    rawName: "Lọc nhớt động cơ Weichai WD615 (LF667 / P554004) máy xúc lật 833, 855",
    unit: "Quả",
    minStockAlert: 10,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      thread_size: "1 1/8-16 UN-2B",
      height_mm: 202,
      outer_diameter_mm: 93,
      micron_rating: 30,
      origin: "USA / Singapore",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 25, inQty: 30, outQty: 10, stockQty: 45 },
      wh_mn_tang: { openQty: 5, inQty: 5, outQty: 2, stockQty: 8 },
    },
  },

  // 2. Lọc tách nước nhiên liệu - Fleetguard chính hãng
  {
    id: "part-002",
    misaRawCode: "MA321_LK_PT_FS1280",
    rawName: "Lọc tách nước nhiên liệu Fleetguard (FS1280 / 3930942) máy LG833NTG, ZL50NC",
    unit: "Quả",
    minStockAlert: 12,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      thread_size: "13/16-18 UNS-2B",
      height_mm: 168,
      outer_diameter_mm: 93,
      micron_rating: 20,
      origin: "USA / Singapore",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 15, inQty: 20, outQty: 11, stockQty: 24 },
      wh_mn_bh: { openQty: 4, inQty: 2, outQty: 1, stockQty: 5 },
    },
  },

  // 3. Bộ lọc gió chính và lọc gió phụ
  {
    id: "part-003",
    misaRawCode: "MC321_PT_LK_AF25276/AF25277",
    rawName: "Bộ ruột lọc gió Donaldson (AF25276 + AF25277) cho máy đào Lonking CDM6225, 6225",
    unit: "Bộ",
    minStockAlert: 6,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      height_mm: 410,
      outer_diameter_mm: 236,
      origin: "USA / Singapore",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 8, inQty: 10, outQty: 6, stockQty: 12 },
    },
  },

  // 4. Lọc dầu động cơ Weichai
  {
    id: "part-004",
    misaRawCode: "MA311_LK_1000424655",
    rawName: "Lọc dầu Weichai chính hãng (1000424655) máy ZL50NCG",
    unit: "Quả",
    minStockAlert: 15,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      thread_size: "M24x1.5",
      height_mm: 175,
      outer_diameter_mm: 95,
      micron_rating: 10,
      origin: "Chính hãng Trung Quốc",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 30, inQty: 50, outQty: 42, stockQty: 38 },
      wh_mn_bh: { openQty: 6, inQty: 10, outQty: 8, stockQty: 8 },
    },
  },

  // 5. Lọc thủy lực áp cao
  {
    id: "part-005",
    misaRawCode: "MA321_LK_HF6510",
    rawName: "Lọc hồi thủy lực áp cao (HF6510 / P164378) máy xúc bánh lốp CDM6150w",
    unit: "Quả",
    minStockAlert: 8,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      height_mm: 242,
      outer_diameter_mm: 128,
      micron_rating: 15,
      origin: "USA / Singapore",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 10, inQty: 15, outQty: 7, stockQty: 18 },
    },
  },

  // 6. Gioăng quy lát động cơ
  {
    id: "part-006",
    misaRawCode: "LK_PT_1110010007",
    rawName: "Gioăng mặt máy quy lát amiang kim loại động cơ WP6G125E22 máy xúc 833",
    unit: "Cái",
    minStockAlert: 5,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      origin: "Chính hãng Trung Quốc",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 4, inQty: 10, outQty: 5, stockQty: 9 },
    },
  },

  // 7. Bơm nước làm mát động cơ
  {
    id: "part-007",
    misaRawCode: "MA311_LK_PT_612600081334",
    rawName: "Bơm nước làm mát động cơ Weichai WP10 (612600081334) máy 855 / ZL50NC",
    unit: "Cái",
    minStockAlert: 3,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      origin: "Chính hãng Trung Quốc",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 2, inQty: 5, outQty: 3, stockQty: 4 },
      wh_mn_bh: { openQty: 1, inQty: 2, outQty: 1, stockQty: 2 },
    },
  },

  // 8. Phớt xilanh - Mã ÂM KHO NHẸ (-1) do xuất ứng cấp cứu công trường
  {
    id: "part-008",
    misaRawCode: "MA321_LK_1453058",
    rawName: "Bộ phớt chắn dầu xilanh nâng hạ cần Lonking LG833NTG (1453058)",
    unit: "Bộ",
    minStockAlert: 5,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1530982011887-3cc11cc85693?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      origin: "OEM Đức",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 0, inQty: 2, outQty: 3, stockQty: -1 }, // Âm kho -1
      wh_mn_bh: { openQty: 0, inQty: 1, outQty: 1, stockQty: 0 },
    },
  },

  // 9. Răng gầu máy xúc - Mã ÂM KHO LỚN (-170) do giao trước dự án cao tốc chưa nhập hóa đơn MISA
  {
    id: "part-009",
    misaRawCode: "MC331_PT_LK_209-70-54210",
    rawName: "Răng gầu vát kim cương chống mài mòn máy đào CDM6225, 6225, WE215 (209-70-54210)",
    unit: "Cái",
    minStockAlert: 50,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      origin: "Chính hãng Trung Quốc",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 30, inQty: 100, outQty: 300, stockQty: -170 }, // Âm kho lớn -170
      wh_mn_bh: { openQty: 5, inQty: 15, outQty: 10, stockQty: 10 },
    },
  },

  // 10. Mã vật tư nội bộ xưởng - QAĐP kiểm tra chất lượng (ẨN TRÊN WEB)
  {
    id: "part-010",
    misaRawCode: "QAĐP_NOIBO_9981",
    rawName: "Vật tư thử nghiệm áp lực van xưởng sửa chữa nội bộ QAĐP (Không bán)",
    unit: "Bộ",
    minStockAlert: 1,
    isVisible: false, // Ẩn khỏi màn hình tra cứu công khai
    images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      origin: "Việt Nam",
    },
    warehouseStocks: {
      wh_mn_bh: { openQty: 2, inQty: 0, outQty: 1, stockQty: 1 },
    },
  },

  // 11. Củ đề khởi động 24V động cơ Yuchai
  {
    id: "part-011",
    misaRawCode: "MA311_LK_PT_610800080024",
    rawName: "Máy khởi động củ đề 24V 7.5KW động cơ Yuchai (610800080024) máy xúc lật 835",
    unit: "Cái",
    minStockAlert: 2,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      voltage: "24V",
      origin: "Chính hãng Trung Quốc",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 1, inQty: 4, outQty: 2, stockQty: 3 },
    },
  },

  // 12. Máy phát điện 28V 55A - Mã tồn tại song song cả 2 kho với số lượng lớn
  {
    id: "part-012",
    misaRawCode: "MA321_LK_PT_12159770",
    rawName: "Máy phát điện sạc bình 28V 55A Bosch Lonking 856Max (12159770)",
    unit: "Cái",
    minStockAlert: 3,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      voltage: "28V",
      origin: "OEM Đức",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 6, inQty: 10, outQty: 8, stockQty: 8 },
      wh_mn_bh: { openQty: 2, inQty: 5, outQty: 3, stockQty: 4 },
      wh_mn_tang: { openQty: 1, inQty: 1, outQty: 1, stockQty: 1 },
    },
  },

  // 13. Vành bánh sao truyền động máy ủi
  {
    id: "part-013",
    misaRawCode: "MC321_PT_LK_5000030",
    rawName: "Vành bánh sao truyền động xích đúc cường lực máy ủi Shantui / Komatsu D31, D41 (5000030)",
    unit: "Cái",
    minStockAlert: 2,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      origin: "Chính hãng Trung Quốc",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 2, inQty: 4, outQty: 2, stockQty: 4 },
    },
  },

  // 14. Cảm biến nhiệt độ nước làm mát
  {
    id: "part-014",
    misaRawCode: "MA311_LK_4110000076",
    rawName: "Cảm biến nhiệt độ nước làm mát động cơ Cummins máy đào WE215, WE245, WE330",
    unit: "Cái",
    minStockAlert: 5,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      voltage: "24V",
      origin: "USA / Singapore",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 8, inQty: 10, outQty: 6, stockQty: 12 },
      wh_mn_bh: { openQty: 3, inQty: 2, outQty: 2, stockQty: 3 },
    },
  },

  // 15. Lốp xúc lật 17.5-25 kèm săm yếm
  {
    id: "part-015",
    misaRawCode: "MA321_LK_PT_9340003",
    rawName: "Bộ lốp xe xúc lật cỡ 17.5-25 16PR gai dấu ngã kèm săm yếm máy 833, ZL50NC (9340003)",
    unit: "Bộ",
    minStockAlert: 4,
    isVisible: true,
    images: ["https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80"],
    customAttributes: {
      origin: "Chính hãng Trung Quốc",
    },
    warehouseStocks: {
      wh_mn_pt: { openQty: 4, inQty: 8, outQty: 6, stockQty: 6 },
    },
  },
];

/**
 * Danh sách 15 sản phẩm phụ tùng hoàn chỉnh sau khi xử lý qua misa-parser
 */
export const INITIAL_PARTS: Part[] = RAW_SEED_DATA.map((item) => {
  const parsed = parseMisaRawItem(item.misaRawCode, item.rawName);
  const totalDisplayStock = calculateDisplayStock(item.warehouseStocks, INITIAL_WAREHOUSES);

  return {
    id: item.id,
    misaRawCode: item.misaRawCode,
    partNumber: parsed.partNumber,
    partNumberClean: parsed.partNumberClean,
    crossRefNumbers: parsed.crossRefNumbers,
    name: item.rawName,
    unit: item.unit,
    category: parsed.category,
    brand: parsed.brand,
    compatibleModels: parsed.compatibleModels,
    images: item.images,
    warehouseStocks: item.warehouseStocks,
    totalDisplayStock,
    minStockAlert: item.minStockAlert,
    isVisible: item.isVisible,
    customAttributes: item.customAttributes,
  };
});

/**
 * Lịch sử biến động kho mẫu (InventoryLog)
 */
export const INITIAL_INVENTORY_LOGS: InventoryLog[] = [
  {
    id: "log-001",
    partId: "part-001",
    partNumber: "LF667",
    warehouseId: "wh_mn_pt",
    warehouseName: "Kho phụ tùng Miền Nam",
    type: "in",
    quantityChange: 30,
    previousQty: 25,
    newQty: 55,
    timestamp: "2026-10-25T08:30:00.000Z",
    performedBy: "Nguyễn Văn Hùng (Thủ kho)",
    notes: "Nhập lô lọc định kỳ từ Cảng Cát Lái",
  },
  {
    id: "log-002",
    partId: "part-008",
    partNumber: "1453058",
    warehouseId: "wh_mn_pt",
    warehouseName: "Kho phụ tùng Miền Nam",
    type: "out",
    quantityChange: -3,
    previousQty: 2,
    newQty: -1,
    timestamp: "2026-10-28T14:15:00.000Z",
    performedBy: "Trần Đình Khôi (Điều phối)",
    notes: "Xuất khẩn cấp cứu xilanh máy LG833NTG công trường Bình Dương (tồn tạm âm -1)",
  },
  {
    id: "log-003",
    partId: "part-009",
    partNumber: "209-70-54210",
    warehouseId: "wh_mn_pt",
    warehouseName: "Kho phụ tùng Miền Nam",
    type: "out",
    quantityChange: -300,
    previousQty: 130,
    newQty: -170,
    timestamp: "2026-10-29T10:00:00.000Z",
    performedBy: "Lê Hoàng Long (Quản lý dự án)",
    notes: "Giao 300 răng gầu tuyến cao tốc Dầu Giây - Tân Phú, chờ kế toán MISA nhập bổ sung hóa đơn",
  },
];

/**
 * Lịch sử đồng bộ tệp MISA mẫu (MisaSyncLog)
 */
export const INITIAL_SYNC_LOGS: MisaSyncLog[] = [
  {
    id: "sync-001",
    syncTime: "2026-10-30T09:00:00.000Z",
    fileName: "Bao_cao_ton_kho_MISA_T10_2026.xlsx",
    totalRows: 15,
    successRows: 14,
    skippedRows: 1,
    errorRows: 0,
    status: "success",
    details: [
      "Đã nhận diện và xử lý 14 mã phụ tùng thương mại.",
      "Mã 'QAĐP_NOIBO_9981' được gắn nhãn nội bộ và ẩn khỏi tra cứu web.",
    ],
  },
];
