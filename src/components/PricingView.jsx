import { useState } from "react";
import { Card, Btn, Icon } from "./ui.jsx";
import { startCheckout } from "../lib/billingApi.js";

const PLANS = [
  {
    id: "monthly", name: "Monthly", price: "$4.99", period: "/ month", extra: "7-day free trial",
    desc: "Flat monthly rate. Cancel any time.",
    features: ["7-day free trial, no charge until it ends", "All 8 evaluation frameworks", "AI analysis & growth plans", "IEP & PLC meeting tools", "Unlimited observations"],
    highlight: false,
  },
  {
    id: "annual", name: "Annual", price: "$19.99", period: "/ year", extra: "7-day free trial · Save 67% vs. monthly",
    desc: "One payment, full access for 12 months.",
    features: ["7-day free trial, no charge until it ends", "Everything in Monthly", "Unlimited observations", "School-wide admin dashboard", "Priority support"],
    highlight: true,
  },
];

// mode "gate": mandatory, shown before any app access (no plan chosen yet) —
// not dismissible. mode "browse": voluntary, opened from Settings to view
// or change plans — dismissible.
export function PricingView({ mode = "gate", onDismiss }) {
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

  const dismissible = mode === "browse" && onDismiss;

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
              <Icon name="lens" size={22} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Choose your plan</div>
            <p style={{ fontSize: 13, color: "var(--text-4)", maxWidth: 460, margin: "0 auto" }}>
              7-day free trial — no credit card charge for 7 days. Cancel any time before then and you won't be billed.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{
                border: `1.5px solid ${p.highlight ? "var(--accent)" : "var(--border-strong)"}`,
                borderRadius: 12, padding: 20, position: "relative",
                background: p.highlight ? "var(--accent-soft)" : "var(--surface)",
              }}>
                {p.highlight && (
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 999 }}>
                    BEST VALUE
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: "var(--text-5)" }}>{p.period}</span>
                </div>
                {p.extra && <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 10 }}>{p.extra}</div>}
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
              <a href="mailto:support@classroomlens.com?subject=District%20Plan%20Inquiry" style={{ color: "var(--accent)", fontWeight: 600 }}>Customer Support →</a>
            </div>
            {dismissible && (
              <Btn variant="ghost" size="sm" onClick={onDismiss}>Close</Btn>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
