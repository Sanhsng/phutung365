import { PartCategory } from "../types/inventory";

/**
 * Danh sách các tiền tố mã hàng kế toán MISA thường gặp trong ngành phụ tùng máy công trình.
 * Được sắp xếp theo thứ tự ưu tiên (chuỗi dài hơn được xử lý trước).
 */
export const MISA_PREFIXES = [
  "MA311_LK_PT_",
  "MA311_LK_",
  "MA321_LK_PT_",
  "MA321_LK_",
  "MC321_PT_LK_",
  "MC331_PT_LK_",
  "MB331_LK_",
  "LK_PT_",
] as const;

/**
 * Danh mục các model máy xúc, máy ủi, máy xúc lật phổ biến cần nhận diện tự động
 */
export const TARGET_MODELS = [
  "LG833NTG",
  "856Max",
  "ZL50NCG",
  "ZL50NC",
  "CDM6150w",
  "CDM6225",
  "CDM6420",
  "WE215",
  "WE245",
  "WE330",
  "6150",
  "6225",
  "6420",
  "833",
  "835",
  "853",
  "855",
  "863",
  "876",
  "D31",
  "D41",
  "D51",
  "D6",
] as const;

/**
 * Thương hiệu phụ tùng / thiết bị máy công trình phổ biến
 */
const BRAND_KEYWORDS: Record<string, string> = {
  FLEETGUARD: "Fleetguard",
  DONALDSON: "Donaldson",
  WEICHAI: "Weichai",
  CUMMINS: "Cummins",
  LONKING: "Lonking",
  SHANTUI: "Shantui",
  KOMATSU: "Komatsu",
  YUCHAI: "Yuchai",
  SHANGCHAI: "Shangchai",
  DEUTZ: "Deutz",
  BOSCH: "Bosch",
  LIUGONG: "Liugong",
  XCMG: "XCMG",
  CAT: "Caterpillar",
  CATERPILLAR: "Caterpillar",
  HYUNDAI: "Hyundai",
  DOOSAN: "Doosan",
};

/**
 * Chuẩn hóa chuỗi mã phụ tùng:
 * Loại bỏ toàn bộ ký tự đặc biệt (`-`, `.`, `_`, `/`, `\`, khoảng trắng) và chuyển thành chữ in hoa (A-Z, 0-9).
 * Dùng để tìm kiếm 1 phần mã nhanh chóng, không phụ thuộc vào dấu gạch nối hay dấu chấm của nhà sản xuất.
 *
 * Ví dụ: "LF-667 / P55-4004" -> "LF667P554004"
 */
export function normalizeCode(str: string): string {
  if (!str) return "";
  return str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Xóa tiền tố kế toán MISA khỏi mã phụ tùng thô.
 */
export function stripMisaPrefix(rawCode: string): string {
  if (!rawCode) return "";
  let cleaned = rawCode.trim();

  for (const prefix of MISA_PREFIXES) {
    if (cleaned.toUpperCase().startsWith(prefix.toUpperCase())) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  return cleaned;
}

/**
 * Nhận diện thương hiệu từ chuỗi tên hoặc mã
 */
export function detectBrand(rawText: string): string {
  if (!rawText) return "OEM";
  const upper = rawText.toUpperCase();

  for (const [key, brandName] of Object.entries(BRAND_KEYWORDS)) {
    // Regex tìm từ khóa nguyên vẹn để tránh match nhầm
    const regex = new RegExp(`\\b${key}\\b`, "i");
    if (regex.test(upper)) {
      return brandName;
    }
  }

  return "OEM";
}

/**
 * Trích xuất danh sách model máy tương thích từ chuỗi văn bản (rawName + rawCode)
 */
export function extractCompatibleModels(text: string): string[] {
  if (!text) return [];

  const foundModels = new Set<string>();

  for (const model of TARGET_MODELS) {
    // Escape ký tự regex đặc biệt nếu có
    const escapedModel = model.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    // Match theo ranh giới từ hoặc không dính liền chữ cái khác
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escapedModel}(?:$|[^a-zA-Z0-9])`, "i");

    if (regex.test(text)) {
      foundModels.add(model);
    }
  }

  return Array.from(foundModels);
}

/**
 * Tự động phân loại danh mục sản phẩm theo tên vật tư
 */
export function detectCategory(rawName: string): PartCategory {
  const name = rawName.toLowerCase();

  // 1. Phớt & Gioăng (Kiểm tra trước để tránh nhầm với động cơ)
  if (
    name.includes("phớt") ||
    name.includes("gioăng") ||
    name.includes("sin ") ||
    name.includes("o-ring") ||
    name.includes("oring") ||
    name.includes("gasket") ||
    name.includes("oil seal") ||
    name.includes("phớt chắn dầu") ||
    name.includes("vòng đệm")
  ) {
    return "Phớt & Gioăng";
  }

  // 2. Lọc gió
  if (
    name.includes("lọc gió") ||
    name.includes("ruột gió") ||
    name.includes("lọc khí") ||
    name.includes("air filter") ||
    /\b(af\d{3,5})\b/i.test(name)
  ) {
    return "Lọc gió";
  }

  // 3. Lọc thủy lực
  if (
    name.includes("thủy lực") ||
    name.includes("lọc hồi") ||
    name.includes("lọc hút") ||
    name.includes("hydraulic") ||
    name.includes("lọc số") ||
    name.includes("lọc điều khiển") ||
    /\b(hf\d{3,5})\b/i.test(name)
  ) {
    return "Lọc thủy lực";
  }

  // 4. Lọc nhớt / Lọc dầu / Nhiên liệu
  if (
    name.includes("lọc nhớt") ||
    name.includes("lọc dầu") ||
    name.includes("nhiên liệu") ||
    name.includes("tách nước") ||
    name.includes("lọc tinh") ||
    name.includes("lọc thô") ||
    name.includes("fuel filter") ||
    name.includes("oil filter") ||
    /\b(lf\d{3,5}|ff\d{3,5}|fs\d{3,5})\b/i.test(name)
  ) {
    return "Lọc nhớt/Lọc dầu";
  }

  // 5. Lốp & Gầm
  if (
    name.includes("lốp") ||
    name.includes("săm") ||
    name.includes("yếm") ||
    name.includes("vành") ||
    name.includes("xích") ||
    name.includes("lá xích") ||
    name.includes("ga-lê") ||
    name.includes("gale") ||
    name.includes("con lăn") ||
    name.includes("bánh sao") ||
    name.includes("răng gầu") ||
    name.includes("lưỡi ben") ||
    name.includes("lưỡi dao") ||
    name.includes("bạc ắc") ||
    name.includes("chốt xích")
  ) {
    return "Lốp & Gầm";
  }

  // 6. Động cơ & Điện
  if (
    name.includes("động cơ") ||
    name.includes("piston") ||
    name.includes("xéc măng") ||
    name.includes("tay biên") ||
    name.includes("trục khuỷu") ||
    name.includes("bạc biên") ||
    name.includes("bạc balie") ||
    name.includes("máy khởi động") ||
    name.includes("củ đề") ||
    name.includes("máy phát") ||
    name.includes("ắc quy") ||
    name.includes("cảm biến") ||
    name.includes("hộp đen") ||
    name.includes("ecu") ||
    name.includes("dây điện") ||
    name.includes("kim phun") ||
    name.includes("bơm cao áp") ||
    name.includes("tubo") ||
    name.includes("turbo") ||
    name.includes("bơm nước") ||
    name.includes("két nước") ||
    name.includes("dây curoa")
  ) {
    return "Động cơ & Điện";
  }

  return "Khác";
}

export interface ParsedMisaItem {
  partNumber: string;
  partNumberClean: string;
  crossRefNumbers: string[];
  category: PartCategory;
  compatibleModels: string[];
  brand: string;
}

/**
 * Hàm phân tích và làm sạch dữ liệu vật tư thô từ MISA kế toán.
 *
 * @param rawCode Mã hàng kế toán MISA (ví dụ: "MA311_LK_PT_LF667/P554004")
 * @param rawName Tên hàng hóa vật tư (ví dụ: "Lọc nhớt động cơ Weichai (1000424655) máy LG833NTG")
 */
export function parseMisaRawItem(rawCode: string, rawName: string): ParsedMisaItem {
  // 1. Tự động xóa tiền tố kế toán MISA
  const codeWithoutPrefix = stripMisaPrefix(rawCode);

  // 2. Tách mã chính và các mã thay thế phân tách bởi '/', '//', '+'
  const codeTokens = codeWithoutPrefix
    .split(/[\/\+]+/)
    .map((token) => stripMisaPrefix(token).trim())
    .filter((token) => token.length > 0);

  let partNumber = codeTokens[0] || codeWithoutPrefix || "CHUA_DAT_MA";
  const crossRefNumbersSet = new Set<string>();

  // Thêm các mã phụ trong chuỗi code vào danh sách mã tham chiếu (crossRef)
  for (let i = 1; i < codeTokens.length; i++) {
    if (codeTokens[i] && codeTokens[i].toUpperCase() !== partNumber.toUpperCase()) {
      crossRefNumbersSet.add(codeTokens[i]);
    }
  }

  // 3. Quét rawName lấy các mã trong ngoặc đơn: VD: (LF667 / P554004) hoặc (1000424655)
  const bracketMatches = rawName.matchAll(/\(([^)]+)\)/g);
  for (const match of bracketMatches) {
    const insideBracket = match[1].trim();

    // Tách các giá trị phân cách bởi '/', ',', ';', '+'
    const subCodes = insideBracket
      .split(/[\/;,+]+/)
      .map((item) => stripMisaPrefix(item).trim())
      .filter((item) => item.length > 0);

    for (const subCode of subCodes) {
      // Chỉ nhận nếu chứa ít nhất 1 chữ số hoặc ký tự mã phụ tùng hợp lệ, độ dài >= 3
      // và không phải là cụm từ tiếng Việt thuần túy mô tả (ví dụ không phải "loại xịn", "máy cũ")
      const hasDigitOrUpperCode = /[0-9]/.test(subCode) || /^[A-Z0-9_\-\.]{3,}$/.test(subCode);
      if (hasDigitOrUpperCode && subCode.toUpperCase() !== partNumber.toUpperCase()) {
        crossRefNumbersSet.add(subCode);
      }
    }
  }

  // 4. Quét dòng máy tương thích từ cả rawName và rawCode
  const combinedText = `${rawName} ${rawCode}`;
  const compatibleModels = extractCompatibleModels(combinedText);

  // 5. Tự động phân loại danh mục
  const category = detectCategory(rawName);

  // 6. Nhận diện thương hiệu
  const brand = detectBrand(combinedText);

  // 7. Tạo mã clean để tìm kiếm
  const partNumberClean = normalizeCode(partNumber);

  return {
    partNumber,
    partNumberClean,
    crossRefNumbers: Array.from(crossRefNumbersSet),
    category,
    compatibleModels,
    brand,
  };
}
