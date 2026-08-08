import { supabase } from "./supabaseClient";

// Shared by billingApi.js and claudeApi.js — every authenticated /api route
// takes a POST with a Supabase bearer token.
export async function authedFetch(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in.");
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
