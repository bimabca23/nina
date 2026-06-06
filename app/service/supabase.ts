import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase Warning]: Variabel lingkungan URL atau Anon Key belum dikonfigurasi di file .env",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
