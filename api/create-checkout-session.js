import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getAuthedUser } from "./_lib/getAuthedUser.js";

// Only the Pay-As-You-Go BASE fee and the Unlimited plan are sold through
// Checkout. PAYG's metered usage subscription has nothing due today, so it's
// created directly via the API from the webhook once the base fee succeeds —
// see stripe-webhook.js. (Stripe subscriptions can't mix billing intervals,
// so PAYG is two subscriptions under one customer, not one.)
const PRICE_IDS = {
  payg: process.env.STRIPE_PRICE_PAYG_BASE,
  unlimited: process.env.STRIPE_PRICE_UNLIMITED,
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { plan } = req.body || {};
  const isCardSetup = plan === "card_setup";
  if (!isCardSetup && !PRICE_IDS[plan]) return res.status(400).json({ error: "Invalid plan" });

  try {
    const { data: billing } = await supabaseAdmin
      .from("billing_accounts")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = billing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin.from("billing_accounts")
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    // "card_setup" collects a payment method with nothing charged today — this
    // is what unlocks observations 2-3 of the free trial. Choosing an actual
    // plan (payg/unlimited) always goes through normal subscription Checkout.
    const session = isCardSetup
      ? await stripe.checkout.sessions.create({
          mode: "setup",
          customer: customerId,
          success_url: `${origin}/app?checkout=card-added`,
          cancel_url: `${origin}/app?checkout=cancelled`,
          metadata: { supabase_user_id: user.id, plan: "card_setup" },
        })
      : await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
          success_url: `${origin}/app?checkout=success`,
          cancel_url: `${origin}/app?checkout=cancelled`,
          metadata: { supabase_user_id: user.id, plan },
          subscription_data: { metadata: { supabase_user_id: user.id, plan } },
        });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("create-checkout-session error", e);
    return res.status(500).json({ error: e.message || "Checkout failed" });
  }
}
