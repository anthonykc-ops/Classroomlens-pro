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

// Vercel's free-plan log retention is too short to catch a failure after
// the fact, so every outcome also gets written to the webhook_debug_log
// table (see supabase/schema.sql) — durable, queryable any time from the
// Supabase dashboard, no Vercel logs required. This insert is itself the
// most direct test of whether SUPABASE_SERVICE_ROLE_KEY can actually write:
// if literally no debug rows ever appear, the key (or its table grants)
// isn't working, independent of anything billing-specific.
async function logDebug(stage, fields) {
  try {
    await supabaseAdmin.from("webhook_debug_log").insert({ stage, ...fields });
  } catch (e) {
    console.error("webhook_debug_log insert failed — service role key may not be able to write:", e.message);
  }
}

// Every billing_accounts write in this file was previously a fire-and-forget
// .update() — a Postgres error or a match-clause that hit zero rows (e.g. a
// stale/mismatched user_id) failed completely silently: no throw, no log,
// Stripe still sees 200. That's exactly the class of bug that makes "the
// webhook returned 200 but the DB didn't update" undiagnosable. This throws
// on a real error (so it surfaces via the outer catch below) and logs when
// the filter matched no row (which isn't a Postgres error, just a mismatch) —
// both to the console and to webhook_debug_log.
async function updateBilling({ match, patch, context, eventType, sessionId, userId, plan }) {
  const { data, error } = await supabaseAdmin
    .from("billing_accounts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .match(match)
    .select();

  if (error) {
    await logDebug("billing_update_failed", {
      event_type: eventType, session_id: sessionId, user_id: userId, plan,
      detail: { match, error: error.message },
    });
    throw new Error(`${context}: billing_accounts update failed — ${error.message}`);
  }
  if (!data?.length) {
    console.error(`${context}: no billing_accounts row matched`, match);
    await logDebug("billing_update_failed", {
      event_type: eventType, session_id: sessionId, user_id: userId, plan,
      detail: { match, error: "no row matched" },
    });
  } else {
    // detail.row is the actual post-update billing_accounts row — the
    // direct confirmation that the update ran and what it wrote.
    await logDebug("billing_updated", {
      event_type: eventType, session_id: sessionId, user_id: userId, plan,
      detail: { row: data[0] },
    });
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // TEMP DIAGNOSTIC — remove once webhook_debug_log is confirmed writable.
  // Runs before Stripe signature verification so it isolates the Supabase
  // connection/service-role-key from anything Stripe-related: if this insert
  // fails or never appears in webhook_debug_log, the problem is
  // SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL / table grants, not the webhook logic.
  try {
    const { error } = await supabaseAdmin.from("webhook_debug_log").insert({
      stage: "connectivity_test",
      detail: { at: new Date().toISOString() },
    });
    if (error) {
      console.error("DIAGNOSTIC: webhook_debug_log insert failed:", error.message, error);
    } else {
      console.log("DIAGNOSTIC: webhook_debug_log insert succeeded");
    }
  } catch (e) {
    console.error("DIAGNOSTIC: webhook_debug_log insert threw:", e.message, e);
  }

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
          await logDebug("missing_metadata", {
            event_type: event.type, session_id: session.id,
            detail: { metadata: session.metadata },
          });
          break;
        }

        if (plan === "unlimited") {
          await updateBilling({
            match: { user_id: userId },
            patch: {
              plan: "unlimited",
              subscription_status: "active",
              stripe_unlimited_subscription_id: session.subscription,
            },
            context: "checkout.session.completed (unlimited)",
            eventType: event.type, sessionId: session.id, userId, plan,
          });
        } else if (plan === "payg") {
          // Base fee is paid via Checkout. The metered subscription has $0
          // due today, so it's created directly here using the payment
          // method Checkout just saved on the customer — no second checkout page.
          const metered = await stripe.subscriptions.create({
            customer: session.customer,
            items: [{ price: process.env.STRIPE_PRICE_PAYG_METERED }],
            metadata: { supabase_user_id: userId, plan: "payg-metered" },
          });
          await updateBilling({
            match: { user_id: userId },
            patch: {
              plan: "payg",
              subscription_status: "active",
              stripe_base_subscription_id: session.subscription,
              stripe_metered_subscription_id: metered.id,
              stripe_metered_item_id: metered.items.data[0]?.id,
              billing_period_observations: 0,
            },
            context: "checkout.session.completed (payg)",
            eventType: event.type, sessionId: session.id, userId, plan,
          });
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
          await updateBilling({
            match: { user_id: userId },
            patch: { has_payment_method: true },
            context: "checkout.session.completed (card_setup)",
            eventType: event.type, sessionId: session.id, userId, plan,
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create") {
          await updateBilling({
            match: { stripe_customer_id: invoice.customer },
            patch: { current_period_end: new Date(invoice.period_end * 1000).toISOString() },
            context: "invoice.paid",
            eventType: event.type, sessionId: invoice.id,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await updateBilling({
          match: { stripe_customer_id: invoice.customer },
          patch: { subscription_status: "past_due" },
          context: "invoice.payment_failed",
          eventType: event.type, sessionId: invoice.id,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await updateBilling({
          match: { stripe_customer_id: sub.customer },
          patch: { subscription_status: "canceled" },
          context: "customer.subscription.deleted",
          eventType: event.type, sessionId: sub.id,
        });
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
