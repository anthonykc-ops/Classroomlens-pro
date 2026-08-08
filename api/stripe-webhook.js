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

// TEMP DIAGNOSTIC — if req's stream already ended before this handler
// attached its 'data'/'end' listeners (e.g. something upstream already
// drained it despite `config.api.bodyParser = false`), buffer(req) never
// resolves or rejects: it just hangs until Vercel kills the invocation on
// its own timeout, producing zero logs and no error to catch. Racing it
// against a short timeout turns that silent hang into a diagnosed,
// logged failure instead.
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); },
    );
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

  // TEMP DIAGNOSTIC — captures the actual shape of `req` at runtime before
  // touching it as a stream. If Vercel (or something in front of this
  // function) already parsed the body into req.body despite
  // `config.api.bodyParser = false`, or if req isn't a Node stream with a
  // working `.on()` at all, this shows it directly instead of us inferring
  // it from buffer(req) hanging with no error.
  console.log("DIAGNOSTIC req shape:", {
    reqBodyAlreadyPopulated: req.body !== undefined,
    reqBodyType: typeof req.body,
    hasOnMethod: typeof req.on === "function",
    readable: req.readable,
    complete: req.complete,
    contentLength: req.headers["content-length"],
  });
  await logDebug("req_shape_check", {
    detail: {
      req_body_already_populated: req.body !== undefined,
      req_body_type: typeof req.body,
      has_on_method: typeof req.on === "function",
      readable: req.readable,
      complete: req.complete,
      content_length: req.headers["content-length"],
    },
  });

  // TEMP DIAGNOSTIC — reading the raw body and verifying the signature are
  // split into separate try/catches so a failure/timeout in one isn't
  // mislabeled as the other in webhook_debug_log. A timeout here (8s,
  // comfortably inside Vercel's function limit) turns a silent hang — the
  // previous symptom, with zero logs and no thrown error — into a logged,
  // diagnosable failure.
  let rawBody;
  try {
    rawBody = await withTimeout(buffer(req), 8000, "Reading raw request body");
  } catch (err) {
    console.error("Reading raw request body failed:", err.message);
    await logDebug("raw_body_read_failed", { detail: { error: err.message } });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // TEMP DIAGNOSTIC — proves the raw request actually reached this function
  // and what it looked like, independent of whether signature verification
  // passes. Stripe's webhook signature is
  // HMAC-SHA256(secret, timestamp + "." + raw_body_bytes) — a hash over
  // literal bytes, not parsed JSON — so it has no dependency on the
  // payload's API version/shape. A version mismatch on the webhook
  // destination cannot by itself cause constructEvent to reject a
  // correctly-signed request; this log rules out "the request never
  // arrived, or arrived empty/malformed" as a separate possibility. Body
  // isn't logged in full (may contain customer PII); length plus header
  // presence is enough to confirm real, non-empty content arrived.
  console.log("DIAGNOSTIC raw request pre-verification:", {
    bodyLength: rawBody.length,
    hasSignatureHeader: !!req.headers["stripe-signature"],
    signatureHeaderPreview: req.headers["stripe-signature"]?.slice(0, 20),
    contentType: req.headers["content-type"],
  });
  await logDebug("raw_body_received", {
    detail: {
      body_length: rawBody.length,
      has_signature_header: !!req.headers["stripe-signature"],
      content_type: req.headers["content-type"],
    },
  });

  let event;
  try {
    // Trimmed defensively — a Vercel dashboard paste can pick up a trailing
    // newline/space, which constructEvent treats as part of the secret and
    // fails signature verification against Stripe's actual value.
    event = stripe.webhooks.constructEvent(rawBody, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET?.trim());
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    // TEMP DIAGNOSTIC — a failure here means the switch below is never
    // reached at all. Previously only console.error'd, which Vercel's free
    // plan doesn't retain long enough to check after the fact — persisting
    // it means a signature-verification failure is distinguishable from
    // "reached the switch but didn't match" purely by looking at Supabase.
    await logDebug("signature_verification_failed", { detail: { error: err.message } });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // TEMP DIAGNOSTIC — records the literal event.type Stripe sent for every
  // event that passes signature verification, regardless of whether the
  // switch below has a matching case, and regardless of the API version the
  // webhook destination is pinned to: event.type/event.id/event.api_version
  // are top-level Event envelope fields, which Stripe has never changed
  // shape across API versions (only data.object's nested fields are
  // versioned) — so this log is unaffected by any basil/dahlia mismatch.
  // Logged to console first so it shows up in Vercel logs even if the
  // Supabase insert itself is what's failing.
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
    return res.status(200).json({ received: true });
  } catch (e) {
    // Signature was valid, so always ack with 200 to stop Stripe retrying —
    // a bug in our own handling shouldn't turn into an infinite retry storm.
    console.error("Webhook handler error for event", event.type, e);
    return res.status(200).json({ received: true, warning: "handler error logged" });
  }
}
