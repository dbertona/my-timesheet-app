import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qfpswxjunoepznrpsltt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
