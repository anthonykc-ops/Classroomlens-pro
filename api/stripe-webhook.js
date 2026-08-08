import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

// This project has no framework (plain Vite + standalone /api functions).
// Vercel's Web API convention for that case — a default-exported object
// with a `fetch` method, reading the body via `request.text()` — is what
// gives access to the exact raw bytes Stripe signed, with no parsing step
// in front of it and no re-serialization step that could produce different
// bytes than what Stripe actually sent.

// The primary activation path is now api/verify-checkout-session.js, called
// synchronously from the checkout=success redirect. This webhook remains
// the authoritative record of every billing event and the only way to hear
// about renewals, failed payments, and cancellations, which have no
// redirect to hook into.
//
// Vercel's free-plan log retention is too short to catch a failure after
// the fact, so outcomes are also written to webhook_debug_log (see
// supabase/schema.sql) — durable, queryable any time from the Supabase
// dashboard, no Vercel logs required.
async function logDebug(stage, fields) {
  try {
    await supabaseAdmin.from("webhook_debug_log").insert({ stage, ...fields });
  } catch (e) {
    console.error("webhook_debug_log insert failed:", e.message);
  }
}

// A Postgres error or a match-clause that hits zero rows (e.g. a
// stale/mismatched user_id) must not fail silently: no throw, no log,
// Stripe still sees 200 is exactly what makes "the webhook returned 200 but
// the DB didn't update" undiagnosable. This throws on a real error (so it
// surfaces via the outer catch below) and logs when the filter matched no
// row (which isn't a Postgres error, just a mismatch).
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
    await logDebug("billing_updated", {
      event_type: eventType, session_id: sessionId, user_id: userId, plan,
      detail: { row: data[0] },
    });
  }
  return data;
}

export default {
async fetch(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    // Trimmed defensively — a Vercel dashboard paste can pick up a trailing
    // newline/space, which constructEvent treats as part of the secret and
    // fails signature verification against Stripe's actual value.
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET?.trim());
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    await logDebug("signature_verification_failed", { detail: { error: err.message } });
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;

        if (!userId || (plan !== "monthly" && plan !== "annual")) {
          console.error("checkout.session.completed: missing/invalid supabase_user_id or plan in session metadata", {
            sessionId: session.id, metadata: session.metadata,
          });
          await logDebug("missing_metadata", {
            event_type: event.type, session_id: session.id,
            detail: { metadata: session.metadata },
          });
          break;
        }

        await updateBilling({
          match: { user_id: userId },
          patch: {
            plan,
            subscription_status: "active",
            stripe_subscription_id: session.subscription,
          },
          context: `checkout.session.completed (${plan})`,
          eventType: event.type, sessionId: session.id, userId, plan,
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create") {
          await updateBilling({
            match: { stripe_customer_id: invoice.customer },
            patch: { current_period_end: new Date(invoice.period_end * 1000).toISOString(), subscription_status: "active" },
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
    return Response.json({ received: true });
  } catch (e) {
    // Signature was valid, so always ack with 200 to stop Stripe retrying —
    // a bug in our own handling shouldn't turn into an infinite retry storm.
    console.error("Webhook handler error for event", event.type, e);
    return Response.json({ received: true, warning: "handler error logged" });
  }
},
};
