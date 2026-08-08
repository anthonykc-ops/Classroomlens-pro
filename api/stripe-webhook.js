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

// Every billing_accounts write in this file was previously a fire-and-forget
// .update() — a Postgres error or a match-clause that hit zero rows (e.g. a
// stale/mismatched user_id) failed completely silently: no throw, no log,
// Stripe still sees 200. That's exactly the class of bug that makes "the
// webhook returned 200 but the DB didn't update" undiagnosable. This throws
// on a real error (so it surfaces via the outer catch below) and logs when
// the filter matched no row (which isn't a Postgres error, just a mismatch).
async function updateBilling(match, patch, context) {
  const { data, error } = await supabaseAdmin
    .from("billing_accounts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .match(match)
    .select();
  if (error) throw new Error(`${context}: billing_accounts update failed — ${error.message}`);
  if (!data?.length) console.error(`${context}: no billing_accounts row matched`, match);
  return data;
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
        if (!userId || !plan) {
          console.error("checkout.session.completed: missing supabase_user_id/plan in session metadata", {
            sessionId: session.id, metadata: session.metadata,
          });
          break;
        }

        if (plan === "unlimited") {
          await updateBilling({ user_id: userId }, {
            plan: "unlimited",
            subscription_status: "active",
            stripe_unlimited_subscription_id: session.subscription,
          }, "checkout.session.completed (unlimited)");
        } else if (plan === "payg") {
          // Base fee is paid via Checkout. The metered subscription has $0
          // due today, so it's created directly here using the payment
          // method Checkout just saved on the customer — no second checkout page.
          const metered = await stripe.subscriptions.create({
            customer: session.customer,
            items: [{ price: process.env.STRIPE_PRICE_PAYG_METERED }],
            metadata: { supabase_user_id: userId, plan: "payg-metered" },
          });
          await updateBilling({ user_id: userId }, {
            plan: "payg",
            subscription_status: "active",
            stripe_base_subscription_id: session.subscription,
            stripe_metered_subscription_id: metered.id,
            stripe_metered_item_id: metered.items.data[0]?.id,
            billing_period_observations: 0,
          }, "checkout.session.completed (payg)");
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
          await updateBilling({ user_id: userId }, { has_payment_method: true }, "checkout.session.completed (card_setup)");
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create") {
          await updateBilling({ stripe_customer_id: invoice.customer }, {
            current_period_end: new Date(invoice.period_end * 1000).toISOString(),
          }, "invoice.paid");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await updateBilling({ stripe_customer_id: invoice.customer }, { subscription_status: "past_due" }, "invoice.payment_failed");
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await updateBilling({ stripe_customer_id: sub.customer }, { subscription_status: "canceled" }, "customer.subscription.deleted");
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
