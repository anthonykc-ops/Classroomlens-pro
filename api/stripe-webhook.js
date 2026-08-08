import { stripe } from "./_lib/stripeClient.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

// Vercel's own guide for accessing a raw request body (needed here for
// Stripe signature verification) uses the Web API handler style below
// (`export async function POST(request)` + `request.text()`), not the
// classic `(req, res)` + `config.api.bodyParser = false` pattern. Diagnostics
// confirmed why: with the classic style, Vercel's compatibility layer
// eagerly parses the body into `req.body` before the handler runs, so
// `req.on('data'/'end')` never fires — the raw stream is already drained.
// `request.text()` reads the literal raw bytes directly, with no parsing
// step in front of it to race against, and no re-serialization step that
// could produce bytes different from what Stripe actually signed.

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

// This project has no framework (plain Vite + standalone /api functions),
// and Vercel's own quickstart documents a different Web API convention for
// that case than for Next.js: a default-exported object with a `fetch`
// method, not a named `export async function POST(request)` (that's the
// Next.js App Router route.js convention specifically). Using the wrong one
// here is the likely reason the previous rewrite's deployment never took
// over from the prior build.
export default {
async fetch(request) {
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

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  // TEMP DIAGNOSTIC — proves the raw request actually reached this function
  // and what it looked like, independent of whether signature verification
  // passes. Body isn't logged in full (may contain customer PII); length
  // plus header presence is enough to confirm real, non-empty content arrived.
  console.log("DIAGNOSTIC raw request pre-verification:", {
    bodyLength: rawBody.length,
    hasSignatureHeader: !!signature,
    contentType: request.headers.get("content-type"),
  });
  await logDebug("raw_body_received", {
    detail: {
      body_length: rawBody.length,
      has_signature_header: !!signature,
      content_type: request.headers.get("content-type"),
    },
  });

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

  // TEMP DIAGNOSTIC — records the literal event.type Stripe sent for every
  // event that passes signature verification, regardless of whether the
  // switch below has a matching case.
  console.log("DIAGNOSTIC event received:", { type: event.type, id: event.id, api_version: event.api_version });
  await logDebug("event_received", {
    event_type: event.type,
    detail: { event_id: event.id, event_api_version: event.api_version },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;

        // TEMP DIAGNOSTIC — remove once billing_accounts matching is confirmed
        // working. Logs the raw metadata Stripe sent, the user_id we derive
        // from it, and whether a billing_accounts row for that user_id exists
        // *before* we ever attempt the update — so a "no row matched" failure
        // in updateBilling can be told apart from "row exists but the update
        // itself is wrong" or "user_id was never on the session at all".
        console.log("DIAGNOSTIC checkout.session.completed metadata:", {
          sessionId: session.id, metadata: session.metadata, derivedUserId: userId, derivedPlan: plan,
        });
        let precheckRow = null;
        let precheckError = null;
        if (userId) {
          const { data, error } = await supabaseAdmin
            .from("billing_accounts")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
          precheckRow = data;
          precheckError = error;
          console.log("DIAGNOSTIC billing_accounts precheck:", {
            userId, found: !!data, row: data, error: error?.message,
          });
        }
        await logDebug("checkout_session_diagnostic", {
          event_type: event.type, session_id: session.id, user_id: userId, plan,
          detail: {
            metadata: session.metadata,
            precheck_found: !!precheckRow,
            precheck_row: precheckRow,
            precheck_error: precheckError?.message,
          },
        });

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
    return Response.json({ received: true });
  } catch (e) {
    // Signature was valid, so always ack with 200 to stop Stripe retrying —
    // a bug in our own handling shouldn't turn into an infinite retry storm.
    console.error("Webhook handler error for event", event.type, e);
    return Response.json({ received: true, warning: "handler error logged" });
  }
},
};
