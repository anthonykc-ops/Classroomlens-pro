import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getAuthedUser } from "./_lib/getAuthedUser.js";

// Two simple flat-rate plans, both sold directly through Checkout — no more
// PAYG base+metered split subscription, no more $0 card-setup session.
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await getAuthedUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { plan } = req.body || {};
    if (!PRICE_IDS[plan]) return res.status(400).json({ error: "Invalid plan" });

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

    // {CHECKOUT_SESSION_ID} lets the success redirect verify payment directly
    // via the Stripe API (see api/verify-checkout-session.js) instead of
    // waiting on the webhook for the user-facing activation moment. The
    // webhook still runs too, as the authoritative record and to handle
    // renewals/cancellations, which have no redirect to hook into.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${origin}/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
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
