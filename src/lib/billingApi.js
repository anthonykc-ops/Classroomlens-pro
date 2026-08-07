import { supabase } from "./supabaseClient";

async function authedFetch(path, body) {
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

// Not security-sensitive — just prevents the pricing intro from nagging on every
// login — so it lives in localStorage rather than needing a write endpoint against
// a table the client otherwise has zero write access to.
const PRICING_SEEN_KEY = "classroomlens_pricing_intro_seen";
export function hasSeenPricingIntro() {
  return localStorage.getItem(PRICING_SEEN_KEY) === "1";
}
export function markPricingIntroSeen() {
  localStorage.setItem(PRICING_SEEN_KEY, "1");
}

export async function startCheckout(plan) {
  const { ok, data } = await authedFetch("/api/create-checkout-session", { plan });
  if (!ok || !data.url) throw new Error(data.error || "Could not start checkout.");
  window.location.href = data.url;
}

// $0 today — just saves a card so the free trial can continue past observation #1.
export async function startCardSetup() {
  return startCheckout("card_setup");
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
// reason is "card_required" (observation 2-3, no card on file yet) or
// "trial_exhausted" (all 3 free observations used) when allowed is false.
export async function checkObservationAllowance() {
  const { ok, status, data } = await authedFetch("/api/track-observation", {});
  if (status === 402) return data;
  if (!ok) throw new Error(data.error || `Request failed (${status})`);
  return data; // { allowed: true, plan, ... }
}
