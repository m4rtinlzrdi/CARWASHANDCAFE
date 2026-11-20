import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://jvtmymhhnuvmobqyxfcy.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_kFES3AEwIsKc_KwG42bdxg_76KyWXWO";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
