import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { supabaseConfigured } from "../lib/supabaseClient";
import { Card, Label, Btn, Spinner, Icon } from "./ui.jsx";

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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "var(--shadow-md)" }}><Icon name="lens" size={26} /></div>
          <h1 style={{ fontSize: 25, fontWeight: 800, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.01em" }}>ClassroomLens <span style={{ color: "var(--accent)" }}>Pro</span></h1>
          <p style={{ fontSize: 14, color: "var(--text-4)" }}>AI-Powered Classroom Observation Platform</p>
        </div>

        <Card style={{ boxShadow: "var(--shadow-lg)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <Btn variant={mode === "signin" ? "primary" : "ghost"} size="sm" onClick={() => { setMode("signin"); setErr(""); setMsg(""); }}>Sign In</Btn>
            <Btn variant={mode === "signup" ? "primary" : "ghost"} size="sm" onClick={() => { setMode("signup"); setErr(""); setMsg(""); }}>Create Account</Btn>
          </div>

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
                : mode === "signin" ? "Sign In →" : mode === "signup" ? "Create Account →" : "Send Reset Email →"}
            </Btn>
          </form>
        </Card>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 11, color: "var(--text-5)" }}>
            Need help? Email <a href="mailto:anthonykc@gmail.com" style={{ color: "var(--accent)" }}>anthonykc@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
