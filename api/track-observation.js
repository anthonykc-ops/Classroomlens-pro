import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getAuthedUser } from "./_lib/getAuthedUser.js";

// The authoritative gate — called before every observation analysis. The
// frontend also blocks all app access behind plan selection, but THIS is
// what actually decides yes/no, since client-side gating is not a real
// paywall — e.g. a canceled subscription must be caught here even if the
// frontend's cached billing state hasn't refreshed yet.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await getAuthedUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { data: billing, error } = await supabaseAdmin
      .from("billing_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (error || !billing) return res.status(500).json({ error: "No billing account found for this user" });

    // "trialing" (the 7-day free trial on both plans) gets full access, same
    // as "active" — the trial's whole point is unlimited use before the
    // first charge.
    const hasAccess = (billing.plan === "monthly" || billing.plan === "annual")
      && (billing.subscription_status === "active" || billing.subscription_status === "trialing");
    if (hasAccess) {
      await supabaseAdmin.from("billing_accounts")
        .update({ billing_period_observations: billing.billing_period_observations + 1, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      return res.status(200).json({ allowed: true, plan: billing.plan });
    }

    return res.status(402).json({ allowed: false, reason: "no_active_plan" });
  } catch (e) {
    console.error("track-observation error", e);
    return res.status(500).json({ error: e.message || "Usage tracking failed" });
  }
}
