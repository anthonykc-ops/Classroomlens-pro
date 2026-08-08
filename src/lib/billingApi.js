import { supabase } from "./supabaseClient";
import { authedFetch } from "./apiClient.js";

// Read-only — RLS only allows a user to see their own row.
export async function getBillingAccount(userId) {
  const { data, error } = await supabase
    .from("billing_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function startCheckout(plan) {
  const { ok, data } = await authedFetch("/api/create-checkout-session", { plan });
  if (!ok || !data.url) throw new Error(data.error || "Could not start checkout.");
  window.location.href = data.url;
}

// Called from the /app?checkout=success redirect to activate the plan
// immediately via the Stripe API, instead of waiting on the webhook to land
// first (see api/verify-checkout-session.js).
export async function verifyCheckoutSession(sessionId) {
  const { ok, data } = await authedFetch("/api/verify-checkout-session", { sessionId });
  if (!ok) throw new Error(data.error || "Could not verify checkout session.");
  return data.billing;
}

export async function openBillingPortal() {
  const { ok, data } = await authedFetch("/api/create-portal-session", {});
  if (!ok || !data.url) throw new Error(data.error || "Could not open billing portal.");
  window.location.href = data.url;
}

// The authoritative usage gate — call before every AI analysis. Resolves the
// structured result on both success and a 402 response, so the caller can
// branch on `allowed`/`reason` instead of catching an exception for the
// expected/common case; only genuine errors (network, 401, 500) throw.
// reason is "no_active_plan" when allowed is false (no free trial anymore —
// the frontend also blocks all app access behind plan selection, but this
// is the real server-side check, e.g. for a subscription canceled mid-session).
export async function checkObservationAllowance() {
  const { ok, status, data } = await authedFetch("/api/track-observation", {});
  if (status === 402) return data;
  if (!ok) throw new Error(data.error || `Request failed (${status})`);
  return data; // { allowed: true, plan, ... }
}
