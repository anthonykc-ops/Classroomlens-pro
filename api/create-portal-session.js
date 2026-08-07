import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getAuthedUser } from "./_lib/getAuthedUser.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { data: billing } = await supabaseAdmin
      .from("billing_accounts")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    if (!billing?.stripe_customer_id) {
      return res.status(400).json({ error: "No billing account on file yet — choose a plan first." });
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
