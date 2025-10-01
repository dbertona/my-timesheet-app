import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  /* eslint-disable no-console */
  console.warn(
    "Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local"
  );
}

export const supabaseClient = createClient(String(supabaseUrl || ""), String(supabaseAnonKey || ""));
