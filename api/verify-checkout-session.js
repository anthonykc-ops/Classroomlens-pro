import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getAuthedUser } from "./_lib/getAuthedUser.js";

// Called from the /app?checkout=success&session_id={CHECKOUT_SESSION_ID}
// redirect to activate the plan immediately via the Stripe API, instead of
// the frontend waiting on the webhook to land first. The webhook still runs
// independently and writes the same result — this is just the fast path for
// the moment the user is actually looking at the screen.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await getAuthedUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // The session must belong to the user making this request — otherwise
    // anyone could pass an arbitrary session id (checkout session ids are
    // long-lived Stripe object ids, not one-time secrets) and activate a
    // plan on someone else's account.
    if (session.metadata?.supabase_user_id !== user.id) {
      return res.status(403).json({ error: "This checkout session does not belong to you" });
    }
    if (session.payment_status !== "paid" || session.status !== "complete") {
      return res.status(400).json({ error: "Payment not completed", status: session.status, paymentStatus: session.payment_status });
    }

    const plan = session.metadata?.plan;
    if (plan !== "monthly" && plan !== "annual") {
      return res.status(400).json({ error: "Unrecognized plan on this session" });
    }

    const { data, error } = await supabaseAdmin
      .from("billing_accounts")
      .update({
        plan,
        subscription_status: "active",
        stripe_subscription_id: session.subscription,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) throw error;

    return res.status(200).json({ ok: true, billing: data });
  } catch (e) {
    console.error("verify-checkout-session error", e);
    return res.status(500).json({ error: e.message || "Could not verify checkout session" });
  }
}
