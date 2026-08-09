import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getAuthedUser } from "./_lib/getAuthedUser.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await getAuthedUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { data: billing } = await supabaseAdmin
      .from("billing_accounts")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    if (!billing?.stripe_customer_id) {
      return res.status(400).json({ error: "No billing account on file yet — choose a plan first." });
    }

    // Test-mode and live-mode customers are separate object spaces in Stripe —
    // a stripe_customer_id saved while STRIPE_SECRET_KEY was a test key (or
    // whose customer was later deleted) doesn't exist against a live key.
    // Unlike checkout, there's no sensible customer to create here (the
    // portal manages an existing subscription, and a freshly-created
    // customer has none) — so this just clears the stale id and asks the
    // user to choose a plan again, instead of crashing with a raw
    // "No such customer" 500.
    try {
      await stripe.customers.retrieve(billing.stripe_customer_id);
    } catch (err) {
      if (err.code === "resource_missing") {
        console.error(`stripe_customer_id ${billing.stripe_customer_id} not found (likely a stale test-mode id) — clearing it`, err.message);
        await supabaseAdmin.from("billing_accounts")
          .update({ stripe_customer_id: null, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        return res.status(400).json({ error: "Your billing record needs to be reset — please choose a plan again." });
      }
      throw err;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${origin}/app`,
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("create-portal-session error", e);
    return res.status(500).json({ error: e.message || "Could not open billing portal" });
  }
}
