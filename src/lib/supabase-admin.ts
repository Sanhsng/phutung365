import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Ưu tiên dùng SUPABASE_SERVICE_ROLE_KEY (Secret keys) cho Server Backend
// Nếu chưa có, fallback về NEXT_PUBLIC_SUPABASE_ANON_KEY (Publishable key)
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isServerSupabaseReady = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseServiceKey &&
    supabaseUrl.startsWith("https://")
  );
};

export const supabaseAdmin = isServerSupabaseReady()
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

