import { supabaseAdmin } from "./supabaseAdmin.js";

// Trusts the Supabase-issued JWT the client sends, not any user id it claims
// in the request body — that's what stops one account from tampering with
// another account's billing state.
export async function getAuthedUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
