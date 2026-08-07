import { useState, useEffect } from "react";

export function Icon({ name, size = 18 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "dashboard": return <svg {...c}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>;
    case "record": return <svg {...c}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>;
    case "analysis": return <svg {...c}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round"/></svg>;
    case "growth": return <svg {...c}><polyline points="3,17 9,11 13,15 21,6"/><polyline points="15,6 21,6 21,12"/></svg>;
    case "coaching": return <svg {...c}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;
    case "report": return <svg {...c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
    case "sessions": return <svg {...c}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>;
    case "settings": return <svg {...c}><line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="1.6" fill="currentColor" stroke="none"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="1.6" fill="currentColor" stroke="none"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="1.6" fill="currentColor" stroke="none"/></svg>;
    case "logout": return <svg {...c}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case "lens": return <svg {...c} stroke="#fff"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4" fill="#fff" stroke="none"/></svg>;
    case "chevron": return <svg {...c}><polyline points="9 6 15 12 9 18"/></svg>;
    case "team": return <svg {...c}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.4"/><path d="M15.5 14.2c2.5.4 4.5 2.6 4.5 5.3"/></svg>;
    case "building": return <svg {...c}><rect x="4" y="3" width="16" height="18" rx="1.5"/><line x1="9" y1="7.5" x2="9" y2="7.5"/><line x1="15" y1="7.5" x2="15" y2="7.5"/><path d="M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1"/><path d="M10 21v-4h4v4"/></svg>;
    case "iep": return <svg {...c}><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M12 16.2c-2.1-1.5-3.4-2.7-3.4-4.2a1.9 1.9 0 0 1 3.4-1.2 1.9 1.9 0 0 1 3.4 1.2c0 1.5-1.3 2.7-3.4 4.2z"/></svg>;
    case "lessonplan": return <svg {...c}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4"/><polyline points="8.5 13 11 15.5 16 10"/></svg>;
    case "plc": return <svg {...c}><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h7A1.5 1.5 0 0 1 14 6.5v4A1.5 1.5 0 0 1 12.5 12H9l-2.5 2.5V12H5.5A1.5 1.5 0 0 1 4 10.5z"/><path d="M20 11.5v3.5a1.5 1.5 0 0 1-1.5 1.5H17v2.3L14.7 16.5H12.5A1.5 1.5 0 0 1 11 15v-1.2"/></svg>;
    default: return null;
  }
}

export function Chip({ label, color = "#64748b", size = "sm" }) {
  return (
    <span style={{
      background: color + "14", color, border: `1px solid ${color}33`,
      borderRadius: 5, padding: size === "sm" ? "2px 8px" : "4px 11px",
      fontSize: size === "sm" ? 10 : 12, fontWeight: 700, letterSpacing: "0.05em",
      textTransform: "uppercase", whiteSpace: "nowrap", display: "inline-block",
    }}>{label}</span>
  );
}

export function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: "var(--surface)", border: `1px solid ${accent ? accent + "40" : "var(--border)"}`,
      borderLeft: accent ? `3px solid ${accent}` : undefined,
      borderRadius: 12, padding: 20, boxShadow: "var(--shadow-sm)", ...style,
    }}>{children}</div>
  );
}

export function Label({ children, color = "var(--text-4)" }) {
  return <div style={{ fontSize: 10, color, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, full, style = {} }) {
  const styles = {
    primary: { background: disabled ? "var(--surface-3)" : "var(--accent)", color: disabled ? "var(--text-5)" : "#fff", border: "1px solid transparent", boxShadow: disabled ? "none" : "var(--shadow-sm)" },
    ghost:   { background: "var(--surface)", color: "var(--text-3)", border: "1px solid var(--border-strong)" },
    success: { background: "var(--success-soft)", color: "var(--success)", border: "1px solid #16a34a33" },
    danger:  { background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid #dc262633" },
    outline: { background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid #4f46e533" },
  };
  const sizes = { sm: { padding: "5px 13px", fontSize: 11 }, md: { padding: "9px 18px", fontSize: 13 }, lg: { padding: "13px 28px", fontSize: 14 } };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles[variant], ...sizes[size], borderRadius: 8, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", letterSpacing: "0.01em", width: full ? "100%" : undefined,
        transition: "opacity .15s, transform .1s, background .15s", ...style }}>
      {children}
    </button>
  );
}

export function TextInput({ label, value, onChange, type = "text", placeholder, style = {}, readOnly }) {
  return (
    <div style={style}>
      {label && <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 5, fontWeight: 600 }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly}
        style={{ background: readOnly ? "var(--surface-2)" : "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 7, padding: "9px 12px",
          color: readOnly ? "var(--text-5)" : "var(--text)", fontSize: 13, width: "100%", outline: "none" }} />
    </div>
  );
}

export function Spinner({ size = 18 }) {
  return <div className="spin" style={{ width: size, height: size, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />;
}

export function ScoreRing({ value, max = 4, color, size = 68 }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const pct = value ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ - (pct/100)*circ} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "'JetBrains Mono',monospace" }}>{value?.toFixed(1) || "—"}</span>
      </div>
    </div>
  );
}

export function Waveform({ active, level = 0.5 }) {
  const [bars, setBars] = useState(Array(30).fill(4));
  useEffect(() => {
    if (!active) { setBars(Array(30).fill(4)); return; }
    const id = setInterval(() => setBars(prev => prev.map(() => active ? Math.random() * level * 36 + 4 : 4)), 90);
    return () => clearInterval(id);
  }, [active, level]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 44, padding: "0 8px" }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: 3, height: h, background: active ? `hsl(${238 + i*2},72%,${48+i*0.6}%)` : "var(--border-strong)", borderRadius: 2, transition: "height .09s ease" }} />
      ))}
    </div>
  );
}

export function RatingBar({ value, max = 4, color = "var(--accent)" }) {
  return (
    <div style={{ background: "var(--surface-3)", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div style={{ width: `${Math.max((value||0)/max*100,0)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1.2s ease" }} />
    </div>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.35 }}>{icon}</div>
      <p style={{ color: "var(--text-5)", fontSize: 14 }}>{text}</p>
    </div>
  );
}
