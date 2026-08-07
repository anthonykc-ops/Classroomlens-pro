import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side use only — bypasses RLS entirely.
// Never import this file from client code.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
