import { useState } from "react";
import { Card, Btn, Icon } from "./ui.jsx";
import { startCheckout, startCardSetup } from "../lib/billingApi.js";

const PLANS = [
  {
    id: "payg", name: "Pay As You Go", price: "$19.99", period: "/ year", extra: "+ $1.00 per observation",
    desc: "Base fee covers your account; each analysis is billed monthly as you go.",
    features: ["All 5 evaluation frameworks", "AI analysis & growth plans", "IEP & PLC meeting tools", "Billed monthly for what you actually use"],
    highlight: false,
  },
  {
    id: "unlimited", name: "Unlimited", price: "$39.99", period: "/ year", extra: "unlimited observations",
    desc: "One flat fee, full access for 12 months — no per-observation charges.",
    features: ["Everything in Pay As You Go", "Unlimited observations, no metering", "School-wide admin dashboard", "Priority support"],
    highlight: true,
  },
];

export function PricingView({ mode = "intro", onDismiss, freeUsed = 0, freeLimit = 3 }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [err, setErr] = useState("");

  const choose = async (planId) => {
    setErr(""); setLoadingPlan(planId);
    try {
      await startCheckout(planId); // redirects to Stripe on success
    } catch (e) {
      setErr(e.message);
      setLoadingPlan(null);
    }
  };

  const addCard = async () => {
    setErr(""); setLoadingPlan("card_setup");
    try {
      await startCardSetup(); // redirects to Stripe on success
    } catch (e) {
      setErr(e.message);
      setLoadingPlan(null);
    }
  };

  const isPaywall = mode === "paywall";
  const isCardRequired = mode === "card-required";
  const dismissible = mode !== "paywall" && onDismiss;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24, overflowY: "auto" }}>
      <div style={{ maxWidth: 760, width: "100%", margin: "40px 0" }}>
        <Card style={{ boxShadow: "var(--shadow-lg)", padding: 32, position: "relative" }}>
          {dismissible && (
            <button onClick={onDismiss} title="Close"
              style={{ position: "absolute", top: 18, right: 18, background: "transparent", border: "none", color: "var(--text-5)", cursor: "pointer", fontSize: 18 }}>
              ✕
            </button>
          )}

          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, background: "var(--accent-soft)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--accent)" }}>
              <Icon name={isPaywall ? "iep" : "lens"} size={22} />
            </div>
            {isPaywall ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>You've used all {freeLimit} free observations</div>
                <p style={{ fontSize: 13, color: "var(--text-4)", maxWidth: 460, margin: "0 auto" }}>
                  Choose a plan to keep analyzing observations. Your {freeUsed} free observations and their analyses are still saved to your account.
                </p>
              </>
            ) : isCardRequired ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Add a card to keep exploring — free</div>
                <p style={{ fontSize: 13, color: "var(--text-4)", maxWidth: 460, margin: "0 auto" }}>
                  Your first observation was on us. Adding a card unlocks your remaining {freeLimit - freeUsed} free observation{freeLimit - freeUsed === 1 ? "" : "s"} —
                  nothing is charged unless you choose a plan afterward.
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Choose your plan</div>
                <p style={{ fontSize: 13, color: "var(--text-4)", maxWidth: 460, margin: "0 auto" }}>
                  Your first observation is free, no card needed. Adding a card after that keeps your remaining {freeLimit - 1} free observations unlocked.
                </p>
              </>
            )}
          </div>

          {isCardRequired && (
            <div style={{ background: "var(--accent-soft)", border: "1px solid #4f46e522", borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }}>
              <Btn size="lg" disabled={loadingPlan !== null} onClick={addCard} style={{ marginBottom: 10 }}>
                {loadingPlan === "card_setup" ? "Redirecting to Stripe…" : "💳 Add Card — $0 Charged Today"}
              </Btn>
              <p style={{ fontSize: 11, color: "var(--text-4)" }}>Or choose a plan below to skip the rest of the trial entirely.</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{
                border: `1.5px solid ${p.highlight ? "var(--accent)" : "var(--border-strong)"}`,
                borderRadius: 12, padding: 20, position: "relative",
                background: p.highlight ? "var(--accent-soft)" : "var(--surface)",
              }}>
                {p.highlight && (
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 999 }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: "var(--text-5)" }}>{p.period}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 10 }}>{p.extra}</div>
                <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 14, lineHeight: 1.5 }}>{p.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 11.5, color: "var(--text-2)" }}>
                      <span style={{ color: "var(--success)", flexShrink: 0, fontWeight: 800 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <Btn full variant={p.highlight ? "primary" : "outline"} disabled={loadingPlan !== null} onClick={() => choose(p.id)}>
                  {loadingPlan === p.id ? "Redirecting to checkout…" : `Choose ${p.name}`}
                </Btn>
              </div>
            ))}
          </div>

          {err && <div style={{ background: "var(--danger-soft)", border: "1px solid #dc262622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--danger)", marginBottom: 16 }}>{err}</div>}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-4)" }}>
              Need a <strong>District</strong> plan for multiple schools?{" "}
              <a href="mailto:anthonykc@gmail.com?subject=District%20Plan%20Inquiry" style={{ color: "var(--accent)", fontWeight: 600 }}>Contact us →</a>
            </div>
            {mode === "intro" && onDismiss && (
              <Btn variant="ghost" size="sm" onClick={onDismiss}>Continue with Free Trial</Btn>
            )}
            {isCardRequired && onDismiss && (
              <Btn variant="ghost" size="sm" onClick={onDismiss}>Not now</Btn>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
