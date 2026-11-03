-- ========================================================
-- SCHEMA SUPABASE: HỆ THỐNG TRA CỨU & QUẢN LÝ KHO PHỤ TÙNG LONKING
-- Chạy script này trong Supabase Dashboard -> SQL Editor
-- ========================================================

-- 1. Bảng Kho Hàng (warehouses)
CREATE TABLE IF NOT EXISTS public.warehouses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    include_in_web_stock BOOLEAN DEFAULT true,
    address TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Phụ Tùng (parts)
CREATE TABLE IF NOT EXISTS public.parts (
    id TEXT PRIMARY KEY,
    misa_raw_code TEXT NOT NULL,
    part_number TEXT NOT NULL,
    part_number_clean TEXT NOT NULL,
    cross_ref_numbers JSONB DEFAULT '[]'::jsonb,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    compatible_models JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    warehouse_stocks JSONB DEFAULT '{}'::jsonb,
    total_display_stock NUMERIC DEFAULT 0,
    min_stock_alert NUMERIC DEFAULT 5,
    is_visible BOOLEAN DEFAULT true,
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index tăng tốc tra cứu mã phụ tùng OEM
CREATE INDEX IF NOT EXISTS idx_parts_part_number_clean ON public.parts(part_number_clean);
CREATE INDEX IF NOT EXISTS idx_parts_category ON public.parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_brand ON public.parts(brand);
CREATE INDEX IF NOT EXISTS idx_parts_is_visible ON public.parts(is_visible);

-- 3. Bảng Thuộc Tính Kỹ Thuật Tùy Biến (attributes)
CREATE TABLE IF NOT EXISTS public.attributes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    data_type TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng Nhật Ký Biến Động Kho (inventory_logs)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id TEXT PRIMARY KEY,
    part_id TEXT NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
    part_number TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    warehouse_name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity_change NUMERIC NOT NULL,
    previous_qty NUMERIC NOT NULL,
    new_qty NUMERIC NOT NULL,
    performed_by TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_part_id ON public.inventory_logs(part_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_timestamp ON public.inventory_logs(timestamp DESC);

-- 5. Bảng Nhật Ký Đồng Bộ MISA (misa_sync_logs)
CREATE TABLE IF NOT EXISTS public.misa_sync_logs (
    id TEXT PRIMARY KEY,
    sync_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    file_name TEXT NOT NULL,
    total_rows INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    skipped_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    status TEXT NOT NULL,
    details JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_misa_sync_logs_sync_time ON public.misa_sync_logs(sync_time DESC);

-- ========================================================
-- CẤU HÌNH BẢO MẬT ROW LEVEL SECURITY (RLS)
-- Cho phép đọc/ghi công khai hoặc qua anon key (SaaS Storefront & Admin)
-- ========================================================
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.misa_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies cho phép anon truy cập tra cứu và quản trị
CREATE POLICY "Allow public read warehouses" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Allow public write warehouses" ON public.warehouses FOR ALL USING (true);

CREATE POLICY "Allow public read parts" ON public.parts FOR SELECT USING (true);
CREATE POLICY "Allow public write parts" ON public.parts FOR ALL USING (true);

CREATE POLICY "Allow public read attributes" ON public.attributes FOR SELECT USING (true);
CREATE POLICY "Allow public write attributes" ON public.attributes FOR ALL USING (true);

CREATE POLICY "Allow public read inventory_logs" ON public.inventory_logs FOR SELECT USING (true);
CREATE POLICY "Allow public write inventory_logs" ON public.inventory_logs FOR ALL USING (true);

CREATE POLICY "Allow public read misa_sync_logs" ON public.misa_sync_logs FOR SELECT USING (true);
CREATE POLICY "Allow public write misa_sync_logs" ON public.misa_sync_logs FOR ALL USING (true);

