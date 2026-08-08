import Stripe from "stripe";

// Built lazily so a missing STRIPE_SECRET_KEY throws inside a handler's
// try/catch (a real JSON error) instead of crashing the whole serverless
// function at cold start with an opaque platform 500.
let _client = null;
function getClient() {
  if (!_client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Server misconfigured: STRIPE_SECRET_KEY must be set.");
    }
    _client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" });
  }
  return _client;
}

export const stripe = new Proxy({}, {
  get(_target, prop) {
    return getClient()[prop];
  },
});
