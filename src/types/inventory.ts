export type WarehouseName =
  | "Kho phụ tùng Miền Nam"
  | "Kho phụ tùng Miền Bắc"
  | "Kho Biên Hòa"
  | "Kho bảo hành MN"
  | "Kho bảo hành MB"
  | "Kho PT tặng theo xe MN"
  | "Kho PT tặng theo xe MB"
  | (string & {});

export interface Warehouse {
  id: string;
  name: WarehouseName;
  includeInWebStock: boolean;
  address?: string;
  description?: string;
}

export interface WarehouseStockDetail {
  openQty: number; // Tồn đầu kỳ
  inQty: number;   // Nhập trong kỳ
  outQty: number;  // Xuất trong kỳ
  stockQty: number; // Tồn cuối kỳ thực tế (có thể âm)
}

export type PartCategory =
  | "Lọc nhớt/Lọc dầu"
  | "Lọc gió"
  | "Lọc thủy lực"
  | "Phớt & Gioăng"
  | "Lốp & Gầm"
  | "Động cơ & Điện"
  | "Khác"
  | (string & {});

export interface Part {
  id: string;
  misaRawCode: string; // Mã gốc kế toán MISA (ví dụ: MA311_LK_PT_LF667/P554004)
  partNumber: string; // Mã phụ tùng chính đã làm sạch tiền tố và chuẩn hóa hiển thị
  partNumberClean: string; // Chuỗi chữ và số viết liền in hoa (A-Z, 0-9) để tìm kiếm 1 phần mã
  crossRefNumbers: string[]; // Các mã tương đương, mã thay thế, mã trong ngoặc
  name: string; // Tên vật tư hàng hóa
  unit: string; // Đơn vị tính (Cái, Bộ, Bình, Quả, Sợi, ...)
  category: PartCategory; // Danh mục phân loại
  brand: string; // Thương hiệu / Nhà sản xuất (Fleetguard, Donaldson, Lonking, Weichai, ...)
  compatibleModels: string[]; // Danh sách model máy tương thích (LG833NTG, ZL50NC, CDM6225, ...)
  images: string[]; // Danh sách URL ảnh phụ tùng
  warehouseStocks: Record<string, WarehouseStockDetail>; // Chi tiết tồn kho theo Warehouse id
  totalDisplayStock: number; // Tổng tồn hiển thị cho khách/bán hàng (kho web; nếu tổng âm quy về 0)
  minStockAlert: number; // Định mức tồn kho tối thiểu để kích hoạt cảnh báo
  isVisible: boolean; // Trạng thái hiển thị (false đối với mã phụ tùng nội bộ, mã QAĐP tạm ẩn)
  customAttributes: Record<string, string | number>; // Thuộc tính mở rộng động (kích thước, ren, dung tích, ...)
}

export interface AttributeDefinition {
  id: string;
  name: string; // Tên hiển thị thuộc tính (ví dụ: Đường kính ren, Chiều cao, Điện áp)
  key: string; // Khóa định danh thuộc tính (viết thường gạch dưới, ví dụ: thread_size, height_mm)
  dataType: "text" | "number" | "select";
  options: string[]; // Tùy chọn nếu dataType là 'select'
  isPublic: boolean; // Có hiển thị công khai trên giao diện web tra cứu phụ tùng hay không
}

export interface InventoryLog {
  id: string;
  partId: string;
  partNumber: string;
  warehouseId: string;
  warehouseName: string;
  type: "in" | "out" | "adjust" | "sync" | "edit";
  quantityChange: number;
  previousQty: number;
  newQty: number;
  timestamp: string; // ISO format string
  performedBy: string;
  notes?: string;
}

export interface MisaSyncLog {
  id: string;
  syncTime: string; // ISO format string
  fileName: string;
  totalRows: number;
  successRows: number;
  skippedRows: number;
  errorRows: number;
  status: "success" | "partial" | "failed";
  details?: string[];
}
