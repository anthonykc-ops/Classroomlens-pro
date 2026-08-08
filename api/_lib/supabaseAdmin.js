import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side use only — bypasses RLS entirely.
// Never import this file from client code.
//
// Built lazily (on first use, not at import time) so a missing/bad
// SUPABASE_SERVICE_ROLE_KEY throws inside a handler's try/catch and comes
// back as a real JSON error, instead of crashing the whole serverless
// function at cold start with an opaque platform 500.
let _client = null;
function getClient() {
  if (!_client) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Server misconfigured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    }
    _client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return _client;
}

export const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return getClient()[prop];
  },
});
