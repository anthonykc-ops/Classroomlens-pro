import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

// Stripe requires the raw, unparsed request body to verify the webhook
// signature — Vercel's default JSON body parsing would corrupt that.
export const config = { api: { bodyParser: false } };

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", chunk => chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let event;
  try {
    const rawBody = await buffer(req);
    // Trimmed defensively — a Vercel dashboard paste can pick up a trailing
    // newline/space, which constructEvent treats as part of the secret and
    // fails signature verification against Stripe's actual value.
    event = stripe.webhooks.constructEvent(rawBody, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET?.trim());
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        if (!userId || !plan) break;

        if (plan === "unlimited") {
          await supabaseAdmin.from("billing_accounts").update({
            plan: "unlimited",
            subscription_status: "active",
            stripe_unlimited_subscription_id: session.subscription,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        } else if (plan === "payg") {
          // Base fee is paid via Checkout. The metered subscription has $0
          // due today, so it's created directly here using the payment
          // method Checkout just saved on the customer — no second checkout page.
          const metered = await stripe.subscriptions.create({
            customer: session.customer,
            items: [{ price: process.env.STRIPE_PRICE_PAYG_METERED }],
            metadata: { supabase_user_id: userId, plan: "payg-metered" },
          });
          await supabaseAdmin.from("billing_accounts").update({
            plan: "payg",
            subscription_status: "active",
            stripe_base_subscription_id: session.subscription,
            stripe_metered_subscription_id: metered.id,
            stripe_metered_item_id: metered.items.data[0]?.id,
            billing_period_observations: 0,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        } else if (plan === "card_setup") {
          // Unlocks observations 2-3 of the free trial — nothing charged.
          // Make it the default payment method too, so if this user later
          // upgrades to a real plan, that Checkout doesn't ask for a card again.
          if (session.setup_intent) {
            const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent);
            if (setupIntent.payment_method) {
              await stripe.customers.update(session.customer, {
                invoice_settings: { default_payment_method: setupIntent.payment_method },
              });
            }
          }
          await supabaseAdmin.from("billing_accounts")
            .update({ has_payment_method: true, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create") {
          await supabaseAdmin.from("billing_accounts")
            .update({ current_period_end: new Date(invoice.period_end * 1000).toISOString(), updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", invoice.customer);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await supabaseAdmin.from("billing_accounts")
          .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", invoice.customer);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabaseAdmin.from("billing_accounts")
          .update({ subscription_status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", sub.customer);
        break;
      }

      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    // Signature was valid, so always ack with 200 to stop Stripe retrying —
    // a bug in our own handling shouldn't turn into an infinite retry storm.
    console.error("Webhook handler error for event", event.type, e);
    return res.status(200).json({ received: true, warning: "handler error logged" });
  }
}
