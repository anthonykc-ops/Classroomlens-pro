import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getAuthedUser } from "./_lib/getAuthedUser.js";

const FREE_LIMIT = 3;

// The authoritative gate — called before every observation analysis. The
// frontend also checks its cached billing state to avoid flashing the
// Analyze button on and off, but THIS is what actually decides yes/no,
// since a button being disabled in React is not a real paywall.
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

    if (billing.plan === "unlimited" && billing.subscription_status === "active") {
      await supabaseAdmin.from("billing_accounts")
        .update({ billing_period_observations: billing.billing_period_observations + 1, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      return res.status(200).json({ allowed: true, plan: "unlimited" });
    }

    if (billing.plan === "payg" && billing.subscription_status === "active") {
      if (billing.stripe_metered_item_id) {
        await stripe.subscriptionItems.createUsageRecord(billing.stripe_metered_item_id, {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: "increment",
        });
      }
      await supabaseAdmin.from("billing_accounts")
        .update({ billing_period_observations: billing.billing_period_observations + 1, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      return res.status(200).json({ allowed: true, plan: "payg", observationsThisPeriod: billing.billing_period_observations + 1 });
    }

    // Trial — no active paid subscription yet.
    if (billing.free_observations_used >= FREE_LIMIT) {
      return res.status(402).json({ allowed: false, reason: "trial_exhausted", freeUsed: billing.free_observations_used, freeLimit: FREE_LIMIT });
    }
    // Observation #1 is always free, no card. From #2 on, a card on file is
    // required (not charged) before the trial continues — the actual abuse
    // deterrent; observations 2-3 stay free once that card is added.
    if (billing.free_observations_used >= 1 && !billing.has_payment_method) {
      return res.status(402).json({ allowed: false, reason: "card_required", freeUsed: billing.free_observations_used, freeLimit: FREE_LIMIT });
    }
    const nextCount = billing.free_observations_used + 1;
    await supabaseAdmin.from("billing_accounts")
      .update({ free_observations_used: nextCount, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    return res.status(200).json({ allowed: true, plan: "trial", freeUsed: nextCount, freeLimit: FREE_LIMIT });
  } catch (e) {
    console.error("track-observation error", e);
    return res.status(500).json({ error: e.message || "Usage tracking failed" });
  }
}
