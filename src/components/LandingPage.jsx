import { useState } from "react";
import { Card, Chip, Label, Icon, RatingBar, ScoreRing } from "./ui.jsx";

const landingCss = `
  html { scroll-behavior: smooth; }
  .cl-land-glow-a { position: absolute; width: 560px; height: 560px; border-radius: 50%; top: -200px; right: -160px;
    background: radial-gradient(circle, rgba(129,140,248,0.30) 0%, rgba(129,140,248,0) 70%); }
  .cl-land-glow-b { position: absolute; width: 480px; height: 480px; border-radius: 50%; bottom: -220px; left: -140px;
    background: radial-gradient(circle, rgba(79,70,229,0.26) 0%, rgba(79,70,229,0) 70%); }
  .cl-land-examples { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .cl-land-preview { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 48px; align-items: center; }
  .cl-land-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .cl-land-pricing { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 980px) {
    .cl-land-examples { grid-template-columns: 1fr; }
    .cl-land-preview { grid-template-columns: 1fr; }
    .cl-land-features { grid-template-columns: repeat(2, 1fr); }
    .cl-land-pricing { grid-template-columns: 1fr; }
  }
  @media (max-width: 620px) {
    .cl-land-features { grid-template-columns: 1fr; }
  }
`;

function CTAButton({ href, children, variant = "primary", size = "lg", style = {}, onClick }) {
  const styles = {
    primary:       { background: "var(--accent)", color: "#fff", border: "1px solid transparent", boxShadow: "var(--shadow-md)" },
    outline:       { background: "var(--surface)", color: "var(--accent)", border: "1px solid var(--border-strong)" },
    onDark:        { background: "#fff", color: "var(--sidebar-bg)", border: "1px solid transparent", boxShadow: "var(--shadow-md)" },
    onDarkOutline: { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.32)" },
  };
  const sizes = { md: { padding: "10px 20px", fontSize: 13 }, lg: { padding: "14px 26px", fontSize: 15 } };
  return (
    <a href={href} onClick={onClick} style={{ ...styles[variant], ...sizes[size], borderRadius: 9, fontWeight: 700, textDecoration: "none",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", ...style }}>
      {children}
    </a>
  );
}

function LogoMark({ onDark }) {
  return (
    <a href="/landing" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="lens" size={17} />
      </div>
      <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em", color: onDark ? "#fff" : "var(--text)" }}>
        ClassroomLens <span style={{ color: onDark ? "#a5b4fc" : "var(--accent)" }}>Pro</span>
      </span>
    </a>
  );
}

const FEATURES = [
  { icon: "record", title: "Live Recording & Transcription", desc: "Record any lesson in-browser with real-time transcription — no extra hardware or software." },
  { icon: "analysis", title: "AI-Scored Evidence", desc: "Every rubric component mapped to direct quotes from the lesson, in your framework of choice." },
  { icon: "growth", title: "3-Tier Growth Plans", desc: "Tomorrow, two-week, and long-term coaching plans generated automatically from every observation." },
  { icon: "coaching", title: "Guided Coaching Conferences", desc: "AI-suggested pre- and post-observation questions to make every conversation count." },
  { icon: "dashboard", title: "School-Wide Dashboard", desc: "Principals see every teacher's trends in one place — not a spreadsheet nobody updates." },
  { icon: "report", title: "Reports, Done in Seconds", desc: "Formal evaluations, teacher letters, admin summaries, and PD memos — ready to sign." },
];

const DANIELSON_DOMAINS = [
  { dk: "Domain 1", label: "Planning & Preparation", color: "#3b82f6", avg: 3.2 },
  { dk: "Domain 2", label: "Classroom Environment", color: "#06b6d4", avg: 3.5 },
  { dk: "Domain 3", label: "Instruction", color: "#8b5cf6", avg: 2.8 },
  { dk: "Domain 4", label: "Professional Responsibilities", color: "#f59e0b", avg: 3.0 },
];
const DANIELSON_EVIDENCE = [
  { code: "3b", name: "Questioning & Discussion Techniques", rating: 3, color: "#8b5cf6", quote: "Turn and tell your partner — what pattern do you notice in these three equations?" },
  { code: "2b", name: "Culture for Learning", rating: 4, color: "#06b6d4", quote: "I love how you're pushing each other's thinking — that's exactly the mathematician mindset we want." },
];
const ratingColor = r => ({ 1: "#ef4444", 2: "#f97316", 3: "#22c55e", 4: "#3b82f6", 5: "#8b5cf6" }[r] || "#64748b");

const GROWTH_PLAN = [
  { label: "🎯 Tomorrow", color: "#dc2626", text: "Cold-call 2–3 more students during whole-group discussion to check for understanding before releasing to independent practice." },
  { label: "📅 2-Week Goal", color: "#d97706", text: "Build in a mid-lesson checkpoint — exit ticket or quick poll — for every unit to catch misconceptions earlier." },
  { label: "🚀 Long-Term", color: "#4f46e5", text: "Explore Kagan-style cooperative learning structures to increase productive struggle time during guided practice." },
];

const PLC_DECISIONS = [
  "Team will use the shared fractions pre-assessment data to regroup students for Tuesday's reteach block.",
  "Adopt a common exit-ticket format across all three 5th grade classrooms starting next week.",
];
const PLC_ACTIONS = [
  { item: "Build the shared reteach groups from Tuesday's data", owner: "J. Alvarez", timeline: "By Friday" },
  { item: "Draft the common exit-ticket template", owner: "M. Chen", timeline: "Next PLC" },
];
const PLC_NORMS = [
  { area: "Equity of Voice", flag: "strong" },
  { area: "Time Management", flag: "watch" },
  { area: "Focus on Data", flag: "strong" },
];
const PLC_FLAG_COLOR = { strong: "var(--success)", watch: "var(--warning)", concern: "var(--danger)" };

// Sidebar groups/items shown in the live preview mockup below — a direct copy
// of the real app's TAB_GROUPS/TABS structure (see App.jsx) so it reads as the
// actual navigation, not an approximation of it.
const PREVIEW_NAV_GROUPS = [
  { group: "Overview", items: [{ id: "dashboard", icon: "dashboard", label: "Dashboard" }] },
  { group: "Observation", items: [
    { id: "record", icon: "record", label: "Observe" },
    { id: "analysis", icon: "analysis", label: "Analysis" },
    { id: "growth", icon: "growth", label: "Growth Plan" },
    { id: "coaching", icon: "coaching", label: "Coaching" },
    { id: "report", icon: "report", label: "Reports" },
  ] },
  { group: "Tools", items: [
    { id: "iep", icon: "iep", label: "IEP Meeting Analysis" },
    { id: "plc", icon: "plc", label: "PLC Meeting Analyzer" },
    { id: "lessonplan", icon: "lessonplan", label: "Lesson Plan Analyzer" },
  ] },
  { group: "Library", items: [{ id: "sessions", icon: "sessions", label: "Sessions" }] },
  { group: "Account", items: [
    { id: "organization", icon: "team", label: "Organization" },
    { id: "settings", icon: "settings", label: "Settings" },
  ] },
];

function MockupSidebar({ active }) {
  return (
    <div style={{ width: 178, flexShrink: 0, background: "var(--sidebar-bg)", padding: "12px 8px", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px 14px" }}>
        <div style={{ width: 20, height: 20, background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="lens" size={11} />
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>ClassroomLens</span>
      </div>
      {PREVIEW_NAV_GROUPS.map(g => (
        <div key={g.group} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 7.5, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 7px", marginBottom: 4 }}>{g.group}</div>
          {g.items.map(item => {
            const isActive = item.id === active;
            return (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "5px 7px", borderRadius: 5, marginBottom: 1,
                background: isActive ? "var(--sidebar-bg-2)" : "transparent",
                borderLeft: `2px solid ${isActive ? "#818cf8" : "transparent"}`,
                color: isActive ? "#fff" : "var(--sidebar-text)",
              }}>
                <Icon name={item.icon} size={10.5} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Browser-window chrome (traffic-light dots + fake address bar) wrapping the
// mini sidebar + content pane, so each mockup reads as an actual app screenshot
// rather than a floating content card.
function BrowserFrame({ active, children }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
      <div style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", padding: "9px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 10.5, color: "var(--text-5)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 14px" }}>
            classroomlens.pro/app
          </span>
        </div>
      </div>
      <div style={{ display: "flex", minHeight: 440 }}>
        <MockupSidebar active={active} />
        <div style={{ flex: 1, minWidth: 0, background: "var(--bg)", padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function AnalysisMockupContent() {
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Analysis</div>
        <div style={{ fontSize: 10, color: "var(--text-4)" }}>AI-scored breakdown of the active observation</div>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
          <ScoreRing value={3.1} max={4} color="#3b82f6" size={40} />
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#3b82f6", letterSpacing: "0.05em" }}>DANIELSON FRAMEWORK</div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text)" }}>Ms. Rivera · 8th Grade Math</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {DANIELSON_DOMAINS.map(d => (
            <div key={d.dk} style={{ background: "var(--surface-2)", borderRadius: 6, padding: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: d.color }}>{d.dk}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: d.color, fontFamily: "'JetBrains Mono',monospace" }}>{d.avg.toFixed(1)}</span>
              </div>
              <RatingBar value={d.avg} max={4} color={d.color} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-4)", letterSpacing: "0.08em", marginBottom: 6 }}>EVIDENCE</div>
        <div style={{ background: "var(--surface-2)", borderRadius: 6, padding: 8, borderLeft: "3px solid #8b5cf644" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#8b5cf6" }}>3b <span style={{ color: "var(--text-3)", fontWeight: 600 }}>Questioning & Discussion</span></span>
            <Chip label="3" color="#8b5cf6" />
          </div>
          <div style={{ fontSize: 9.5, color: "var(--text-3)", background: "var(--surface)", borderRadius: 5, padding: "4px 8px", lineHeight: 1.5 }}>
            ❝ Turn and tell your partner — what pattern do you notice in these three equations?
          </div>
        </div>
      </div>
    </>
  );
}

function PLCMockupContent() {
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>PLC Meeting Analyzer</div>
        <div style={{ fontSize: 10, color: "var(--text-4)" }}>AI-assisted analysis of your team's meeting</div>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-4)", letterSpacing: "0.08em", marginBottom: 6 }}>MEETING NOTES</div>
        <div style={{ background: "var(--surface-2)", border: "1px dashed var(--border-strong)", borderRadius: 6, padding: 8, fontSize: 9.5, color: "var(--text-5)", fontStyle: "italic", marginBottom: 9 }}>
          "Team reviewed fractions pre-assessment data and discussed reteach groupings…"
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", borderRadius: 6, padding: "5px 11px", fontSize: 10, fontWeight: 700 }}>
          ⚡ Analyze Meeting
        </div>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-4)", letterSpacing: "0.08em", marginBottom: 6 }}>KEY DECISIONS</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 10, flexShrink: 0 }}>▸</span>
          <span style={{ fontSize: 10, color: "var(--text-2)", lineHeight: 1.5 }}>{PLC_DECISIONS[0]}</span>
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-4)", letterSpacing: "0.08em", marginBottom: 6 }}>ACTION ITEMS</div>
        <div style={{ background: "var(--surface-2)", borderRadius: 6, padding: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>{PLC_ACTIONS[0].item}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <Chip label={`Owner: ${PLC_ACTIONS[0].owner}`} color="var(--accent)" />
            <Chip label={PLC_ACTIONS[0].timeline} color="var(--text-4)" />
          </div>
        </div>
      </div>
    </>
  );
}

const DASHBOARD_STATS = [
  { label: "Total Observations", value: "142", color: "#4f46e5" },
  { label: "School Average", value: "3.4", color: "#16a34a" },
  { label: "Needs Support", value: "3", color: "#d97706" },
  { label: "Teachers Observed", value: "28", color: "#3b82f6" },
];
const DASHBOARD_ROWS = [
  { teacher: "M. Rivera", framework: "Danielson", rating: 3.1 },
  { teacher: "J. Alvarez", framework: "Marzano", rating: 3.6 },
  { teacher: "K. Chen", framework: "TPEP", rating: 2.8 },
  { teacher: "D. Nguyen", framework: "CEL 5D+", rating: 3.9 },
];
const dashboardRatingColor = r => (r >= 3.5 ? "var(--success)" : r >= 3 ? "#3b82f6" : "var(--warning)");

function DashboardMockupContent() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Dashboard</div>
          <div style={{ fontSize: 10, color: "var(--text-4)" }}>Your observation trends at a glance</div>
        </div>
        <Chip label="Monthly Plan" color="var(--success)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {DASHBOARD_STATS.map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 7.5, color: "var(--text-4)", fontWeight: 700, marginTop: 3, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-4)", letterSpacing: "0.08em", marginBottom: 8 }}>RECENT OBSERVATIONS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.6fr", fontSize: 8.5, fontWeight: 800, color: "var(--text-5)", letterSpacing: "0.05em", paddingBottom: 6, borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
          <span>TEACHER</span><span>FRAMEWORK</span><span style={{ textAlign: "right" }}>RATING</span>
        </div>
        {DASHBOARD_ROWS.map(r => (
          <div key={r.teacher} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.6fr", fontSize: 10, padding: "5px 0", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{r.teacher}</span>
            <span style={{ color: "var(--text-4)" }}>{r.framework}</span>
            <span style={{ textAlign: "right", fontWeight: 800, color: dashboardRatingColor(r.rating) }}>{r.rating.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function GrowthPlanMockupContent() {
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Growth Plan</div>
        <div style={{ fontSize: 10, color: "var(--text-4)" }}>Actionable next steps from the active observation</div>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: 12 }}>
        {GROWTH_PLAN.map(g => (
          <div key={g.label} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: g.color, marginBottom: 6 }}>{g.label}</div>
            <div style={{ display: "flex", gap: 7, background: "var(--surface-2)", borderRadius: 6, padding: "8px 10px" }}>
              <span style={{ color: g.color, fontWeight: 800, flexShrink: 0, fontSize: 10 }}>▸</span>
              <span style={{ fontSize: 10.5, color: "var(--text-2)", lineHeight: 1.55 }}>{g.text}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const PREVIEW_TABS = [
  { id: "dashboard", label: "Dashboard", content: <DashboardMockupContent /> },
  { id: "analysis", label: "Observation Analysis", content: <AnalysisMockupContent /> },
  { id: "growth", label: "Growth Plan", content: <GrowthPlanMockupContent /> },
  { id: "plc", label: "PLC Meeting", content: <PLCMockupContent /> },
];

const PRICING = [
  {
    name: "Monthly", price: "$9.99", period: "/ month", desc: "For teachers and independent coaches",
    features: ["All 5 evaluation frameworks", "AI analysis & growth plans", "IEP & PLC meeting tools", "Unlimited observations"],
    cta: "Get Started", variant: "outline", highlight: false,
  },
  {
    name: "Annual", price: "$59.99", period: "/ year — save 50%", desc: "For principals and instructional leaders",
    features: ["Everything in Monthly", "Unlimited observations", "School-wide admin dashboard", "Priority support"],
    cta: "Get Started", variant: "primary", highlight: true,
  },
  {
    name: "District", price: "Custom", period: "", desc: "For multi-school districts",
    features: ["Everything in Annual", "Multiple school sites", "District-wide reporting", "Dedicated onboarding", "Custom contract terms"],
    cta: "Customer Support", variant: "outline", highlight: false, href: "mailto:support@classroomlens.com?subject=District%20Plan%20Inquiry",
  },
];

export function LandingPage({ isLoggedIn }) {
  const appHref = "/app";
  const heroCta = isLoggedIn ? "Go to Dashboard" : "Get Started";
  const [previewTab, setPreviewTab] = useState("dashboard");
  const activePreview = PREVIEW_TABS.find(t => t.id === previewTab) || PREVIEW_TABS[0];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <style>{landingCss}</style>

      {/* Top nav */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <LogoMark />
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", gap: 20 }} className="cl-land-navlinks">
              <a href="#screenshots" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", textDecoration: "none" }}>Examples</a>
              <a href="#features" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", textDecoration: "none" }}>Features</a>
              <a href="#pricing" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", textDecoration: "none" }}>Pricing</a>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <CTAButton href={appHref} variant="outline" size="md">{isLoggedIn ? "Dashboard" : "Sign In"}</CTAButton>
              {!isLoggedIn && <CTAButton href={appHref} variant="primary" size="md">Get Started</CTAButton>}
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "var(--sidebar-bg)", position: "relative", overflow: "hidden" }}>
        <div className="cl-land-glow-a" />
        <div className="cl-land-glow-b" />
        <div style={{ position: "relative", maxWidth: 780, margin: "0 auto", padding: "84px 24px 96px", textAlign: "center" }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", color: "#818cf8", background: "rgba(129,140,248,0.14)", border: "1px solid rgba(129,140,248,0.28)", borderRadius: 999, padding: "6px 14px", marginBottom: 22 }}>
            AI-POWERED OBSERVATION PLATFORM
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#fff", marginBottom: 20 }}>
            Real-time AI feedback on your observations, lesson plans, IEP meetings, and PLC meetings — for teachers and administrators who want to grow.
          </h1>
          <p style={{ fontSize: 17, color: "var(--sidebar-text)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 34px" }}>
            Record any lesson and get evidence-mapped ratings, growth plans, and formal reports —
            automatically, mapped to the framework your district already uses.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
            <CTAButton href={appHref} variant="onDark">{heroCta} →</CTAButton>
            <CTAButton href="#screenshots" variant="onDarkOutline">See How It Works</CTAButton>
          </div>
          <p style={{ fontSize: 12, color: "var(--sidebar-text)" }}>See real sample output below · Simple flat-rate pricing</p>
        </div>
      </div>

      {/* Live interactive app preview — split screen, marketing copy left, real
          app mockup right. Switching tabs swaps the mockup content and the
          active sidebar highlight together, so it reads as one live app. */}
      <div id="screenshots" style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 24px 20px" }}>
        <div className="cl-land-preview">
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 12 }}>SEE IT IN ACTION</div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 14, lineHeight: 1.25 }}>
              The exact dashboard your team will use
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-4)", lineHeight: 1.75, marginBottom: 24 }}>
              Every screen on the right is built from the same layout, sidebar, and components live in
              the app — not a redesign for marketing, just the real thing. Click a tab to explore.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PREVIEW_TABS.map(t => (
                <button key={t.id} onClick={() => setPreviewTab(t.id)}
                  style={{
                    textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: previewTab === t.id ? "var(--accent-soft)" : "var(--surface)",
                    border: `1.5px solid ${previewTab === t.id ? "var(--accent)" : "var(--border-strong)"}`,
                    borderRadius: 10, padding: "13px 16px", cursor: "pointer", fontFamily: "inherit",
                    color: previewTab === t.id ? "var(--accent)" : "var(--text-2)",
                    fontSize: 13.5, fontWeight: 700, transition: "all .15s",
                  }}>
                  {t.label}
                  <span style={{ opacity: previewTab === t.id ? 1 : 0 }}>→</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <BrowserFrame active={activePreview.id}>{activePreview.content}</BrowserFrame>
          </div>
        </div>
      </div>

      {/* Live example infographics */}
      <div id="examples" style={{ maxWidth: 1140, margin: "0 auto", padding: "88px 24px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 12 }}>SAMPLE OUTPUT</div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 12 }}>Real output, not a mockup</h2>
          <p style={{ fontSize: 14, color: "var(--text-4)", lineHeight: 1.7 }}>
            A closer look at the actual output quality — illustrative samples built from the exact
            same components the live app renders, not fiction.
          </p>
        </div>

        <div className="cl-land-examples">
          {/* Danielson Evidence Map */}
          <Card style={{ borderTop: "3px solid #3b82f6" }}>
            <Chip label="Sample Output" color="var(--text-4)" />
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 12, marginBottom: 14 }}>
              <ScoreRing value={3.1} max={4} color="#3b82f6" size={54} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6", letterSpacing: "0.05em" }}>DANIELSON FRAMEWORK</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Ms. Rivera</div>
                <div style={{ fontSize: 11, color: "var(--text-5)" }}>8th Grade Math · Observer: J. Ortiz</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {DANIELSON_DOMAINS.map(d => (
                <div key={d.dk} style={{ background: "var(--surface-2)", borderRadius: 8, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: d.color }}>{d.dk}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: d.color, fontFamily: "'JetBrains Mono',monospace" }}>{d.avg.toFixed(1)}</span>
                  </div>
                  <RatingBar value={d.avg} max={4} color={d.color} />
                </div>
              ))}
            </div>
            <Label>Evidence</Label>
            {DANIELSON_EVIDENCE.map(e => (
              <div key={e.code} style={{ background: "var(--surface-2)", borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: `3px solid ${e.color}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: e.color }}>{e.code} <span style={{ color: "var(--text-3)", fontWeight: 600 }}>{e.name}</span></span>
                  <Chip label={`${e.rating}`} color={ratingColor(e.rating)} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", background: "var(--surface)", borderRadius: 5, padding: "5px 9px", lineHeight: 1.5 }}>❝ {e.quote}</div>
              </div>
            ))}
          </Card>

          {/* Growth Plan */}
          <Card style={{ borderTop: "3px solid #16a34a" }}>
            <Chip label="Sample Output" color="var(--text-4)" />
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginTop: 12, marginBottom: 2 }}>Growth Plan — Ms. Rivera</div>
            <div style={{ fontSize: 11, color: "var(--text-5)", marginBottom: 16 }}>Generated from today's observation · 8th Grade Math</div>
            {GROWTH_PLAN.map(g => (
              <div key={g.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: g.color, marginBottom: 6 }}>{g.label}</div>
                <div style={{ display: "flex", gap: 8, background: "var(--surface-2)", borderRadius: 7, padding: "9px 11px" }}>
                  <span style={{ color: g.color, flexShrink: 0, fontWeight: 800 }}>▸</span>
                  <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{g.text}</span>
                </div>
              </div>
            ))}
          </Card>

          {/* PLC Meeting Analysis */}
          <Card style={{ borderTop: "3px solid #4f46e5" }}>
            <Chip label="Sample Output" color="var(--text-4)" />
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginTop: 12, marginBottom: 2 }}>PLC Meeting — 5th Grade Math Team</div>
            <div style={{ fontSize: 11, color: "var(--text-5)", marginBottom: 14 }}>Facilitator: K. Nguyen</div>

            <Label>Key Decisions</Label>
            {PLC_DECISIONS.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                <span style={{ color: "var(--accent)", flexShrink: 0, fontWeight: 800, fontSize: 11 }}>▸</span>
                <span style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.55 }}>{d}</span>
              </div>
            ))}

            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <Label>Action Items</Label>
              {PLC_ACTIONS.map((a, i) => (
                <div key={i} style={{ background: "var(--surface-2)", borderRadius: 7, padding: 9, marginBottom: 6 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>{a.item}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Chip label={`Owner: ${a.owner}`} color="var(--accent)" />
                    <Chip label={a.timeline} color="var(--text-4)" />
                  </div>
                </div>
              ))}
            </div>

            <Label>Norms Adherence</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PLC_NORMS.map(n => (
                <Chip key={n.area} label={`${n.area} · ${n.flag}`} color={PLC_FLAG_COLOR[n.flag]} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Features grid */}
      <div id="features" style={{ maxWidth: 1140, margin: "0 auto", padding: "96px 24px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 44px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 12 }}>EVERYTHING YOU NEED</div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>Built for the whole observation cycle</h2>
        </div>
        <div className="cl-land-features">
          {FEATURES.map(f => (
            <Card key={f.title}>
              <div style={{ width: 36, height: 36, background: "var(--accent-soft)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", marginBottom: 14 }}>
                <Icon name={f.icon} size={18} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.65 }}>{f.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" style={{ maxWidth: 1140, margin: "0 auto", padding: "96px 24px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 44px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 12 }}>PRICING</div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 12 }}>Simple pricing, built to scale with you</h2>
          <p style={{ fontSize: 14, color: "var(--text-4)" }}>No metering, no per-observation fees — just two simple flat-rate plans.</p>
        </div>
        <div className="cl-land-pricing">
          {PRICING.map(p => (
            <Card key={p.name} style={p.highlight
              ? { border: "2px solid var(--accent)", boxShadow: "var(--shadow-lg)", position: "relative" }
              : {}}>
              {p.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", padding: "4px 12px", borderRadius: 999 }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>{p.price}</span>
                <span style={{ fontSize: 13, color: "var(--text-5)" }}>{p.period}</span>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-4)", marginBottom: 20 }}>{p.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "var(--text-2)" }}>
                    <span style={{ color: "var(--success)", flexShrink: 0, fontWeight: 800 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <CTAButton href={p.href || appHref} variant={p.variant} size="md" style={{ width: "100%" }}>{p.cta}</CTAButton>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA band */}
      <div style={{ background: "var(--sidebar-bg)", marginTop: 100, position: "relative", overflow: "hidden" }}>
        <div className="cl-land-glow-a" />
        <div style={{ position: "relative", maxWidth: 620, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", marginBottom: 14 }}>Ready to get started?</h2>
          <p style={{ fontSize: 14, color: "var(--sidebar-text)", marginBottom: 28 }}>Choose a plan and set up your first observation in under five minutes.</p>
          <CTAButton href={appHref} variant="onDark">{heroCta} →</CTAButton>
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "36px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <LogoMark />
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-5)" }}>© 2025 ClassroomLens Pro</span>
          <a href="mailto:support@classroomlens.com" style={{ fontSize: 12, color: "var(--accent)" }}>Customer Support</a>
          <a href={appHref} style={{ fontSize: 12, color: "var(--text-4)" }}>Sign In</a>
        </div>
      </div>
    </div>
  );
}
