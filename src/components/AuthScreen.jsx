import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { supabaseConfigured } from "../lib/supabaseClient";
import { Card, Label, Btn, Spinner, Icon } from "./ui.jsx";

const authCss = `
  .cl-auth-split { display: flex; min-height: 100vh; }
  .cl-auth-marketing { flex: 1 1 52%; position: relative; overflow: hidden; }
  .cl-auth-form-col { flex: 1 1 48%; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .cl-auth-glow-a { position: absolute; width: 520px; height: 520px; border-radius: 50%; top: -160px; right: -160px;
    background: radial-gradient(circle, rgba(129,140,248,0.28) 0%, rgba(129,140,248,0) 70%); }
  .cl-auth-glow-b { position: absolute; width: 460px; height: 460px; border-radius: 50%; bottom: -180px; left: -120px;
    background: radial-gradient(circle, rgba(79,70,229,0.25) 0%, rgba(79,70,229,0) 70%); }
  .cl-auth-features { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 980px) {
    .cl-auth-marketing { display: none; }
    .cl-auth-form-col { flex: 1 1 100%; }
  }
`;

const FEATURES = [
  { icon: "analysis", title: "AI-Scored Evidence", desc: "Every rubric component mapped to direct quotes from the lesson — automatically." },
  { icon: "growth", title: "Actionable Growth Plans", desc: "Tomorrow, two-week, and long-term coaching plans generated instantly." },
  { icon: "dashboard", title: "School-Wide Insights", desc: "Principals see every teacher's trends in one dashboard, not a spreadsheet." },
  { icon: "report", title: "Formal Reports, Done", desc: "Four report types ready to sign — formal eval, teacher letter, admin summary, PD memo." },
];

function MarketingPanel() {
  return (
    <div className="cl-auth-marketing" style={{ background: "var(--sidebar-bg)", color: "#fff", padding: "44px 48px" }}>
      <div className="cl-auth-glow-a" />
      <div className="cl-auth-glow-b" />

      <div style={{ position: "relative", maxWidth: 460, margin: "0 auto", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 88px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="lens" size={18} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em" }}>ClassroomLens <span style={{ color: "#818cf8" }}>Pro</span></div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", color: "#818cf8", marginBottom: 16 }}>AI-POWERED OBSERVATION PLATFORM</div>
        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 18 }}>
          Stop filling out <span style={{ color: "#a5b4fc" }}>rubrics by hand.</span>
        </h1>
        <p style={{ fontSize: 15, color: "var(--sidebar-text)", lineHeight: 1.75, marginBottom: 40, maxWidth: 420 }}>
          Record any lesson and get evidence-mapped ratings, growth plans, and formal reports —
          automatically, in minutes instead of hours.
        </p>

        <div className="cl-auth-features" style={{ marginBottom: 40 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: "var(--sidebar-bg-2)", border: "1px solid var(--sidebar-border)", borderRadius: 12, padding: 16 }}>
              <div style={{ width: 30, height: 30, background: "rgba(129,140,248,0.16)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a5b4fc", marginBottom: 12 }}>
                <Icon name={f.icon} size={15} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "var(--sidebar-text)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--sidebar-bg-2)", border: "1px solid var(--sidebar-border)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.7, fontStyle: "italic", marginBottom: 12 }}>
            "ClassroomLens cut my post-observation write-up time from 45 minutes to under 10."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(129,140,248,0.2)", color: "#c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>K</div>
            <div style={{ fontSize: 11, color: "var(--sidebar-text)" }}>Instructional Coach · sample testimonial</div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--sidebar-text)", marginBottom: "auto" }}>
          Trusted by instructional coaches and administrators in districts nationwide.
        </p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(129,140,248,0.14)", border: "1px solid rgba(129,140,248,0.28)", borderRadius: 999, padding: "8px 16px", marginTop: 32, alignSelf: "flex-start" }}>
          <span style={{ fontSize: 14 }}>✦</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e0e7ff" }}>Free 14-day trial — no credit card required</span>
        </div>
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <Card>
          <Label color="var(--warning)">Supabase Not Configured</Label>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.8 }}>
            This app needs a Supabase project to handle logins. Add these to your <code style={{ color: "var(--accent)" }}>.env</code> file, then restart <code style={{ color: "var(--accent)" }}>npm run dev</code>:
          </p>
          <pre style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginTop: 14, fontSize: 12, color: "var(--success)", overflowX: "auto" }}>
{`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
          </pre>
          <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 14 }}>
            Find these under Settings → API in your Supabase project dashboard.
          </p>
        </Card>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  if (!supabaseConfigured) return <NotConfigured />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!email.trim() || (mode !== "reset" && !password)) {
      setErr("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else if (mode === "signup") {
        await signUp(email.trim(), password, fullName.trim());
        setMsg("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      } else if (mode === "reset") {
        await resetPassword(email.trim());
        setMsg("Password reset email sent. Check your inbox.");
      }
    } catch (e2) {
      setErr(e2.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const heading = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  const subheading = mode === "signin"
    ? "Sign in to pick up right where you left off."
    : mode === "signup"
      ? "Start your free trial — no credit card required."
      : "We'll email you a link to reset it.";

  return (
    <div className="cl-auth-split">
      <style>{authCss}</style>

      <MarketingPanel />

      <div className="cl-auth-form-col">
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 28 }}>
            <a href="/landing" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "var(--shadow-md)" }}>
                <Icon name="lens" size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", letterSpacing: "-0.01em" }}>ClassroomLens <span style={{ color: "var(--accent)" }}>Pro</span></div>
                <div style={{ fontSize: 10, color: "var(--text-5)", letterSpacing: "0.08em" }}>OBSERVATION PLATFORM</div>
              </div>
            </a>
            <a href="/landing" style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>← See examples</a>
          </div>

          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 23, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 6 }}>{heading}</h2>
            <p style={{ fontSize: 13, color: "var(--text-4)" }}>{subheading}</p>
          </div>

          <Card style={{ boxShadow: "var(--shadow-lg)" }}>
            {mode !== "reset" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <Btn variant={mode === "signin" ? "primary" : "ghost"} size="sm" style={{ flex: 1 }} onClick={() => { setMode("signin"); setErr(""); setMsg(""); }}>Sign In</Btn>
                <Btn variant={mode === "signup" ? "primary" : "ghost"} size="sm" style={{ flex: 1 }} onClick={() => { setMode("signup"); setErr(""); setMsg(""); }}>Create Account</Btn>
              </div>
            )}

            <form onSubmit={submit}>
              {mode === "signup" && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 5, fontWeight: 600 }}>FULL NAME</div>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith"
                    style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 7, padding: "11px 14px", color: "var(--text)", fontSize: 13, width: "100%", outline: "none" }} />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 5, fontWeight: 600 }}>EMAIL</div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 7, padding: "11px 14px", color: "var(--text)", fontSize: 13, width: "100%", outline: "none" }} />
              </div>

              {mode !== "reset" && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 5, fontWeight: 600 }}>PASSWORD</div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 7, padding: "11px 14px", color: "var(--text)", fontSize: 13, width: "100%", outline: "none" }} />
                </div>
              )}

              {mode === "signin" && (
                <div style={{ textAlign: "right", marginBottom: 14 }}>
                  <span onClick={() => { setMode("reset"); setErr(""); setMsg(""); }} style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
                </div>
              )}
              {mode === "reset" && (
                <div style={{ textAlign: "right", marginBottom: 14 }}>
                  <span onClick={() => { setMode("signin"); setErr(""); setMsg(""); }} style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>Back to sign in</span>
                </div>
              )}

              {err && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 10 }}>{err}</p>}
              {msg && <p style={{ fontSize: 12, color: "var(--success)", marginBottom: 10 }}>{msg}</p>}

              <Btn full size="lg" disabled={loading} style={{ marginTop: 4 }}>
                {loading
                  ? <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}><Spinner />Please wait…</span>
                  : mode === "signin" ? "Sign In →" : mode === "signup" ? "Start Free Trial →" : "Send Reset Email →"}
              </Btn>

              {mode === "signup" && (
                <p style={{ fontSize: 11, color: "var(--text-5)", textAlign: "center", marginTop: 12 }}>
                  🔒 No credit card required · Cancel anytime
                </p>
              )}
            </form>
          </Card>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <p style={{ fontSize: 11, color: "var(--text-5)" }}>
              Need help? Email <a href="mailto:anthonykc@gmail.com" style={{ color: "var(--accent)" }}>anthonykc@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
