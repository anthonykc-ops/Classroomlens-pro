import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;}
  body{background:#010409;color:#e6edf3;font-family:'Outfit',system-ui,sans-serif;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:#0d1117;}
  ::-webkit-scrollbar-thumb{background:#30363d;border-radius:10px;}
  input,textarea,select,button{font-family:inherit;}
  textarea{resize:vertical;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes glow{0%,100%{box-shadow:0 0 12px #3b82f644}50%{box-shadow:0 0 24px #3b82f688}}
  .fade-up{animation:fadeUp .35s ease forwards;}
  .spin{animation:spin 1s linear infinite;}
  .rec-pulse{animation:pulse 1.4s ease infinite;}
`;

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION FRAMEWORKS
// ─────────────────────────────────────────────────────────────────────────────
const FRAMEWORKS = {
  danielson: {
    name: "Danielson Framework for Teaching",
    shortName: "Danielson",
    version: "2022",
    color: "#3b82f6",
    usedIn: "Most US districts",
    domains: {
      "Domain 1": {
        label: "Planning & Preparation", color: "#3b82f6",
        components: {
          "1a": "Knowledge of Content & Pedagogy",
          "1b": "Knowledge of Students",
          "1c": "Setting Instructional Outcomes",
          "1d": "Knowledge of Resources",
          "1e": "Designing Coherent Instruction",
          "1f": "Designing Student Assessments",
        },
      },
      "Domain 2": {
        label: "Classroom Environment", color: "#06b6d4",
        components: {
          "2a": "Environment of Respect & Rapport",
          "2b": "Culture for Learning",
          "2c": "Managing Classroom Procedures",
          "2d": "Managing Student Behavior",
          "2e": "Organizing Physical Space",
        },
      },
      "Domain 3": {
        label: "Instruction", color: "#8b5cf6",
        components: {
          "3a": "Communicating with Students",
          "3b": "Questioning & Discussion Techniques",
          "3c": "Engaging Students in Learning",
          "3d": "Using Assessment in Instruction",
          "3e": "Flexibility & Responsiveness",
        },
      },
      "Domain 4": {
        label: "Professional Responsibilities", color: "#f59e0b",
        components: {
          "4a": "Reflecting on Teaching",
          "4b": "Maintaining Accurate Records",
          "4c": "Communicating with Families",
          "4d": "Participating in Professional Community",
          "4e": "Growing & Developing Professionally",
          "4f": "Showing Professionalism",
        },
      },
    },
    ratingScale: { 1: "Unsatisfactory", 2: "Basic", 3: "Proficient", 4: "Distinguished" },
  },

  marzano: {
    name: "Marzano Teacher Evaluation Model",
    shortName: "Marzano",
    version: "2.0",
    color: "#10b981",
    usedIn: "FL, PA, OH, WA and others",
    domains: {
      "Domain 1": {
        label: "Classroom Strategies & Behaviors", color: "#10b981",
        components: {
          "1.1": "Providing Scales & Rubrics",
          "1.2": "Tracking Student Progress",
          "1.3": "Celebrating Success",
          "1.4": "Establishing Rules & Procedures",
          "1.5": "Organizing Physical Layout",
          "1.6": "Demonstrating Withitness",
          "1.7": "Acknowledging Adherence to Rules",
          "1.8": "Understanding Student Needs",
          "1.9": "Chunking Content into Digestible Bites",
          "1.10": "Processing New Information",
          "1.11": "Recording & Representing Knowledge",
          "1.12": "Reflecting on Learning",
          "1.13": "Assigning Purposeful Homework",
          "1.14": "Examining Similarities & Differences",
          "1.15": "Examining Errors in Reasoning",
          "1.16": "Practicing Skills, Strategies & Processes",
          "1.17": "Revising Knowledge",
          "1.18": "Organizing Students to Interact",
          "1.19": "Providing Feedback on Work",
          "1.20": "Presenting Unusual or Intriguing Information",
          "1.21": "Friendly Controversy",
          "1.22": "Student-Led Knowledge Sharing",
          "1.23": "Demonstrating Intensity & Enthusiasm",
          "1.24": "Building Relationships with Students",
          "1.25": "Communicating High Expectations",
          "1.26": "Developing Student Background Knowledge",
        },
      },
      "Domain 2": {
        label: "Planning & Preparing", color: "#34d399",
        components: {
          "2.1": "Planning for Effective Scaffolding",
          "2.2": "Planning for Use of Available Resources",
          "2.3": "Planning for Diverse Student Needs",
        },
      },
      "Domain 3": {
        label: "Reflecting on Teaching", color: "#6ee7b7",
        components: {
          "3.1": "Identifying Areas of Pedagogical Strength",
          "3.2": "Identifying Areas for Improvement",
          "3.3": "Developing a Written Growth Plan",
          "3.4": "Monitoring Progress on Growth Plan",
        },
      },
      "Domain 4": {
        label: "Collegiality & Professionalism", color: "#a7f3d0",
        components: {
          "4.1": "Promoting Positive Interactions with Colleagues",
          "4.2": "Promoting Exchange of Ideas & Strategies",
          "4.3": "Promoting District & School Initiatives",
        },
      },
    },
    ratingScale: { 1: "Not Using", 2: "Beginning", 3: "Developing", 4: "Applying", 5: "Innovating" },
  },

  cel5d: {
    name: "CEL 5D+ Teacher Evaluation Rubric",
    shortName: "CEL 5D+",
    version: "3.0",
    color: "#f59e0b",
    usedIn: "WA State, Seattle, Tacoma",
    domains: {
      "Purpose": {
        label: "Purpose", color: "#f59e0b",
        components: {
          "P1": "Learning Target(s)",
          "P2": "Connections to Prior & Future Learning",
          "P3": "Relevance / Rationale",
        },
      },
      "Student Engagement": {
        label: "Student Engagement", color: "#fbbf24",
        components: {
          "SE1": "Intellectual Engagement",
          "SE2": "Discussion & Discourse",
          "SE3": "Student Agency & Voice",
          "SE4": "Rigor & Relevance",
        },
      },
      "Curriculum & Pedagogy": {
        label: "Curriculum & Pedagogy", color: "#fcd34d",
        components: {
          "CP1": "Alignment of Learning Activities",
          "CP2": "Instructional Strategies",
          "CP3": "Use of Formative Assessment",
          "CP4": "Culturally Responsive Teaching",
        },
      },
      "Assessment for Learning": {
        label: "Assessment for Student Learning", color: "#fde68a",
        components: {
          "ASL1": "Use of Data to Inform Instruction",
          "ASL2": "Feedback to Students",
          "ASL3": "Student Self-Assessment",
        },
      },
      "Classroom Environment": {
        label: "Classroom Environment & Culture", color: "#b45309",
        components: {
          "CEC1": "Safe & Supportive Environment",
          "CEC2": "Classroom Management",
          "CEC3": "High Expectations for All",
        },
      },
    },
    ratingScale: { 1: "Unsatisfactory", 2: "Basic", 3: "Proficient", 4: "Distinguished" },
  },

  tntp: {
    name: "TNTP Core Teaching Rubric",
    shortName: "TNTP Core",
    version: "2.0",
    color: "#ef4444",
    usedIn: "Charter networks, urban districts",
    domains: {
      "Essential Practices": {
        label: "Essential Practices", color: "#ef4444",
        components: {
          "EP1": "Essential Content",
          "EP2": "Academic Ownership",
          "EP3": "Demonstration of Learning",
        },
      },
      "Strong Instruction": {
        label: "Strong Instruction", color: "#f87171",
        components: {
          "SI1": "Instructional Rigor",
          "SI2": "Checks for Understanding",
          "SI3": "Culture of Learning",
          "SI4": "Student Engagement",
        },
      },
    },
    ratingScale: { 1: "Does Not Meet", 2: "Partially Meets", 3: "Meets", 4: "Exceeds" },
  },

  tpep: {
    name: "WA State TPEP (2023 Revision)",
    shortName: "TPEP",
    version: "2023",
    color: "#6366f1",
    usedIn: "All Washington State districts",
    domains: {
      "Criterion 1": {
        label: "Centering Student & Family Identities", color: "#6366f1",
        components: {
          "C1.1": "Demonstrating Knowledge of Students",
          "C1.2": "Cultural Responsiveness in Practice",
          "C1.3": "Family & Community Engagement",
        },
      },
      "Criterion 2": {
        label: "Providing Access & Opportunity", color: "#818cf8",
        components: {
          "C2.1": "Instructional Design for Access",
          "C2.2": "Language Supports for All Learners",
          "C2.3": "Differentiated Instruction",
        },
      },
      "Criterion 3": {
        label: "Planning with Learning Targets", color: "#a5b4fc",
        components: {
          "C3.1": "Setting Clear Learning Targets",
          "C3.2": "Alignment of Instruction to Targets",
          "C3.3": "Formative Assessment Use",
        },
      },
      "Criterion 4": {
        label: "Facilitating Meaningful Learning", color: "#c7d2fe",
        components: {
          "C4.1": "Questioning & Academic Discourse",
          "C4.2": "Student Agency in Learning",
          "C4.3": "Flexibility & Responsiveness",
        },
      },
      "Criterion 5": {
        label: "Fostering Collaborative Learning", color: "#6366f1",
        components: {
          "C5.1": "Collaborative Learning Structures",
          "C5.2": "Peer-to-Peer Learning",
          "C5.3": "Student-Led Discourse",
        },
      },
      "Criterion 6": {
        label: "Cultivating a Healthy Environment", color: "#4f46e5",
        components: {
          "C6.1": "Safe & Inclusive Classroom",
          "C6.2": "Positive Student Relationships",
          "C6.3": "Proactive Behavioral Supports",
        },
      },
    },
    ratingScale: { 1: "Unsatisfactory", 2: "Basic", 3: "Proficient", 4: "Distinguished" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const fmtTime = s => `${Math.floor(s/60).toString().padStart(2,"0")}:${Math.floor(s%60).toString().padStart(2,"0")}`;
const ratingColors = { 1:"#ef4444", 2:"#f97316", 3:"#22c55e", 4:"#3b82f6", 5:"#8b5cf6" };
const ratingColor = (r) => ratingColors[r] || "#475569";

const STORAGE_KEY = "classroomlens_sessions_v2";
const APIKEY_STORAGE = "classroomlens_apikey";

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveSessions(sessions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
async function callClaude(apiKey, system, userMsg, maxTokens = 3000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return (data.content || []).map(c => c.text || "").join("");
}

async function analyzeObservation(apiKey, transcript, frameworkKey) {
  const fw = FRAMEWORKS[frameworkKey];
  const allComponents = Object.entries(fw.domains)
    .flatMap(([, d]) => Object.entries(d.components).map(([ck, cn]) => `${ck}: ${cn}`))
    .join("\n");
  const ratingLabels = Object.entries(fw.ratingScale).map(([k,v]) => `${k}=${v}`).join(", ");

  const system = `You are an expert instructional coach and observer certified in the ${fw.name}.
Analyze classroom transcripts deeply and return ONLY valid JSON — no preamble, no markdown fences, no extra text.

Rating scale for this framework: ${ratingLabels}

Required JSON structure (include ALL keys even if empty):
{
  "summary": "2–3 sentence observation narrative",
  "overallRating": <number matching rating scale>,
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "growthAreas": ["specific growth area 1", "specific growth area 2"],
  "evidence": {
    "<component_key>": {
      "rating": <number>,
      "evidence": ["direct quote or close paraphrase from transcript"],
      "feedback": "specific, actionable coaching feedback in 1-2 sentences"
    }
  },
  "studentInterventions": [
    {
      "studentRef": "Student A or description",
      "observation": "specific observed behavior",
      "intervention": "concrete intervention recommendation",
      "urgency": "low|medium|high",
      "strategy": "specific instructional strategy to try"
    }
  ],
  "growthPlan": {
    "immediate": ["concrete action for next class"],
    "shortTerm": ["2-week practice goal"],
    "longTerm": ["professional development direction"]
  },
  "scriptedExamples": {
    "whatWorked": "language from transcript that was effective",
    "whatToTry": "specific scripted language to practice next time"
  },
  "preConferenceQuestions": [
    "question 1 for pre-observation planning conversation",
    "question 2",
    "question 3"
  ],
  "postConferenceQuestions": [
    "reflective question 1 for post-observation debrief",
    "question 2",
    "question 3"
  ]
}

Only include evidence for components directly observable in the transcript. Use 2 (or equivalent) as default when behavior is present but limited.`;

  const text = await callClaude(apiKey, system,
    `FRAMEWORK COMPONENTS:\n${allComponents}\n\nTRANSCRIPT:\n${transcript}\n\nAnalyze this lesson thoroughly.`,
    3500
  );
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function generateCoachingReply(apiKey, session, messages, confType) {
  const fw = FRAMEWORKS[session.framework];
  const { analysis, meta } = session;
  const history = messages.map(m => `${m.role === "user" ? "Teacher" : "Coach"}: ${m.content}`).join("\n");

  const system = `You are an expert instructional coach facilitating a ${confType}-observation conference.
Teacher: ${meta.teacher || "Teacher"} | Framework: ${fw.name} | School: ${meta.school || ""}
Observation summary: ${analysis.summary}
Strengths: ${analysis.strengths?.join("; ")}
Growth areas: ${analysis.growthAreas?.join("; ")}
Overall rating: ${analysis.overallRating}/${Object.keys(fw.ratingScale).length}

Your role: Be warm, Socratic, evidence-based. Ask one follow-up question per response.
Keep responses to 3–5 sentences. Do not lecture. Draw out the teacher's thinking.`;

  return callClaude(apiKey, system, `Conversation so far:\n${history}\n\nCoach:`, 600);
}

async function generateReport(apiKey, session, reportType) {
  const fw = FRAMEWORKS[session.framework];
  const { analysis, meta } = session;
  const types = {
    formal: "a formal written summative evaluation report for an HR or personnel file. Use third person. Be objective and specific.",
    teacher: "a warm, direct feedback letter addressed to the teacher using 'you/your'. Growth-focused and encouraging while honest.",
    admin: "a concise executive summary for a principal or curriculum director. Avoid jargon. Focus on student impact and teacher development needs.",
    growth: "a professional development action plan memo formatted for a coaching file. Include specific next steps and timeline.",
  };
  const system = `You are an expert instructional coach writing ${types[reportType]}
Write 4–5 professional paragraphs. Do not use headers or bullet points — flowing prose only.
Use educator language. Be specific about what was observed.`;

  return callClaude(apiKey, system,
    `Teacher: ${meta.teacher || "Teacher"} | Grade: ${meta.grade} | Subject: ${meta.subject} | Date: ${meta.date}
Framework: ${fw.name} | Observer: ${meta.observer || "Observer"} | School: ${meta.school || ""}
Overall Rating: ${analysis.overallRating}/${Object.keys(fw.ratingScale).length} (${fw.ratingScale[Math.round(analysis.overallRating)]})
Summary: ${analysis.summary}
Strengths: ${analysis.strengths?.join("; ")}
Growth Areas: ${analysis.growthAreas?.join("; ")}
Immediate Actions: ${analysis.growthPlan?.immediate?.join("; ")}
Scripted example that worked: ${analysis.scriptedExamples?.whatWorked}`,
    1200
  );
}

async function generateCoachingTip(apiKey, compKey, compName, rating, evidence, fw) {
  const ratingLabel = fw.ratingScale[rating] || "Basic";
  return callClaude(apiKey, "",
    `You are an instructional coach. Write a warm, specific 3-sentence coaching tip for a teacher rated "${ratingLabel}" on ${fw.name} component ${compKey}: "${compName}".
Evidence from lesson: ${(evidence || []).join("; ")}
Be direct, encouraging, and give one concrete next step. No bullet points — write as if speaking directly to them.`,
    400
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function Chip({ label, color = "#475569", size = "sm" }) {
  return (
    <span style={{
      background: color + "1a", color, border: `1px solid ${color}33`,
      borderRadius: 4, padding: size === "sm" ? "2px 8px" : "4px 11px",
      fontSize: size === "sm" ? 10 : 12, fontWeight: 700, letterSpacing: "0.05em",
      textTransform: "uppercase", whiteSpace: "nowrap", display: "inline-block",
    }}>{label}</span>
  );
}

function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: "#0d1117", border: `1px solid ${accent ? accent + "44" : "#21262d"}`,
      borderLeft: accent ? `3px solid ${accent}` : undefined,
      borderRadius: 12, padding: 20, ...style,
    }}>{children}</div>
  );
}

function Label({ children, color = "#475569" }) {
  return <div style={{ fontSize: 10, color, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, full, style = {} }) {
  const styles = {
    primary: { background: disabled ? "#161b22" : "linear-gradient(135deg,#1d4ed8,#7c3aed)", color: disabled ? "#334155" : "#fff", border: "none" },
    ghost:   { background: "transparent", color: "#64748b", border: "1px solid #30363d" },
    success: { background: "transparent", color: "#22c55e", border: "1px solid #22c55e44" },
    danger:  { background: "transparent", color: "#ef4444", border: "1px solid #ef444444" },
    outline: { background: "transparent", color: "#93c5fd", border: "1px solid #3b82f644" },
  };
  const sizes = { sm: { padding: "5px 13px", fontSize: 11 }, md: { padding: "9px 18px", fontSize: 13 }, lg: { padding: "13px 28px", fontSize: 14 } };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles[variant], ...sizes[size], borderRadius: 8, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", letterSpacing: "0.02em", width: full ? "100%" : undefined,
        transition: "opacity .15s, transform .1s", ...style }}>
      {children}
    </button>
  );
}

function TextInput({ label, value, onChange, type = "text", placeholder, style = {}, readOnly }) {
  return (
    <div style={style}>
      {label && <div style={{ fontSize: 11, color: "#475569", marginBottom: 5, fontWeight: 600 }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly}
        style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 7, padding: "9px 12px",
          color: readOnly ? "#475569" : "#e6edf3", fontSize: 13, width: "100%", outline: "none" }} />
    </div>
  );
}

function Spinner({ size = 18 }) {
  return <div className="spin" style={{ width: size, height: size, border: "2px solid #21262d", borderTopColor: "#3b82f6", borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />;
}

function ScoreRing({ value, max = 4, color, size = 68 }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const pct = value ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#21262d" strokeWidth={6} />
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

function Waveform({ active, level = 0.5 }) {
  const [bars, setBars] = useState(Array(30).fill(4));
  useEffect(() => {
    if (!active) { setBars(Array(30).fill(4)); return; }
    const id = setInterval(() => setBars(prev => prev.map(() => active ? Math.random() * level * 36 + 4 : 4)), 90);
    return () => clearInterval(id);
  }, [active, level]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 44, padding: "0 8px" }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: 3, height: h, background: active ? `hsl(${214 + i*3},76%,${55+i}%)` : "#21262d", borderRadius: 2, transition: "height .09s ease" }} />
      ))}
    </div>
  );
}

function RatingBar({ value, max = 4, color = "#3b82f6" }) {
  return (
    <div style={{ background: "#21262d", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div style={{ width: `${Math.max((value||0)/max*100,0)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1.2s ease" }} />
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.4 }}>{icon}</div>
      <p style={{ color: "#334155", fontSize: 14 }}>{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// API KEY SETUP SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [err, setErr] = useState("");
  const [envKey] = useState(() => import.meta.env?.VITE_ANTHROPIC_API_KEY || "");

  useEffect(() => {
    if (envKey && envKey !== "sk-ant-your-key-goes-here") {
      onSave(envKey);
    }
  }, [envKey, onSave]);

  const test = async () => {
    if (!key.trim()) { setErr("Please enter your API key."); return; }
    setTesting(true); setErr("");
    try {
      await callClaude(key.trim(), "", "Say OK", 10);
      localStorage.setItem(APIKEY_STORAGE, key.trim());
      onSave(key.trim());
    } catch (e) {
      setErr("Invalid key or connection error: " + e.message);
    }
    setTesting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#010409", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>🎓</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e6edf3", marginBottom: 6 }}>ClassroomLens <span style={{ color: "#3b82f6" }}>Pro</span></h1>
          <p style={{ fontSize: 14, color: "#475569" }}>AI-Powered Classroom Observation Platform</p>
        </div>

        <Card>
          <Label>Connect Your AI Brain</Label>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.8, marginBottom: 20 }}>
            ClassroomLens uses the Anthropic Claude API to analyze lessons and generate coaching feedback.
            Your key is stored locally on your device and never sent anywhere except Anthropic's servers.
          </p>

          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8 }}>HOW TO GET YOUR API KEY</div>
            {[
              ["1", "Go to", "console.anthropic.com", "https://console.anthropic.com"],
              ["2", "Create an account (free)", "", ""],
              ["3", "Click API Keys → Create Key", "", ""],
              ["4", "Copy the key (starts with sk-ant-...)", "", ""],
              ["5", "Paste it below and click Connect", "", ""],
            ].map(([n, text, link, href]) => (
              <div key={n} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 12, color: "#94a3b8", alignItems: "center" }}>
                <span style={{ background: "#3b82f622", color: "#3b82f6", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{n}</span>
                <span>{text} {link && <a href={href} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>{link}</a>}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 5, fontWeight: 600 }}>ANTHROPIC API KEY</div>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              onKeyDown={e => e.key === "Enter" && test()}
              style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 7, padding: "11px 14px", color: "#e6edf3", fontSize: 13, width: "100%", outline: "none", letterSpacing: "0.04em" }}
            />
          </div>

          {err && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{err}</p>}

          <Btn onClick={test} disabled={testing} full size="lg" style={{ marginTop: 4 }}>
            {testing ? <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}><Spinner />Testing connection…</span> : "Connect API Key →"}
          </Btn>

          <p style={{ fontSize: 10, color: "#21262d", marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
            Cost: roughly $0.02–0.10 per analysis. Your key never leaves your browser except to reach Anthropic.
          </p>
        </Card>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 11, color: "#21262d" }}>
            Need help? Email <a href="mailto:anthonykc@gmail.com" style={{ color: "#3b82f6" }}>anthonykc@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD / OBSERVE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function RecordView({ apiKey, onAnalyze }) {
  const [meta, setMeta] = useState({ teacher: "", grade: "", subject: "", date: new Date().toISOString().split("T")[0], observer: "", school: "" });
  const [framework, setFramework] = useState("danielson");
  const [mode, setMode] = useState("manual");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const analyzerRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);

  const setMf = (k, v) => setMeta(p => ({ ...p, [k]: v }));
  const fw = FRAMEWORKS[framework];

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    recognitionRef.current?.stop();
  }, []);

  const startRecording = async () => {
    setTranscript(""); setRecTime(0); setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyzerNode = ctx.createAnalyser();
      analyzerNode.fftSize = 256;
      src.connect(analyzerNode);
      analyzerRef.current = analyzerNode;
      const tick = () => {
        const buf = new Uint8Array(analyzerNode.frequencyBinCount);
        analyzerNode.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setAudioLevel(avg / 128);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = true; r.interimResults = true; r.lang = "en-US";
      let final = "";
      r.onresult = e => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
          else interim = e.results[i][0].transcript;
        }
        setTranscript(final + interim);
      };
      r.onerror = e => { if (e.error !== "aborted") setErr("Mic error: " + e.error); };
      r.start();
      recognitionRef.current = r;
    } else {
      setErr("Live transcription requires Chrome or Edge. Use Paste mode.");
    }
    setIsRecording(true); setIsPaused(false);
  };

  const stopRecording = () => {
    setIsRecording(false); setIsPaused(false);
    cancelAnimationFrame(animRef.current);
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setAudioLevel(0);
  };

  const togglePause = () => {
    if (isPaused) recognitionRef.current?.start();
    else recognitionRef.current?.stop();
    setIsPaused(p => !p);
  };

  const handleAnalyze = async () => {
    const text = transcript.trim();
    if (!text) { setErr("Please record or paste a transcript first."); return; }
    if (text.split(" ").length < 20) { setErr("Transcript too short. Please provide at least a few minutes of conversation."); return; }
    setErr(""); setLoading(true);
    try {
      const result = await analyzeObservation(apiKey, text, framework);
      onAnalyze({ id: Date.now(), meta: { ...meta }, framework, transcript: text, analysis: result, timestamp: new Date().toLocaleString() });
    } catch (e) {
      setErr("Analysis failed: " + e.message + ". Check your API key in Settings.");
    }
    setLoading(false);
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Observation meta */}
      <Card>
        <Label>Observation Details</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <TextInput label="Teacher Name" value={meta.teacher} onChange={v => setMf("teacher", v)} />
          <TextInput label="Observer" value={meta.observer} onChange={v => setMf("observer", v)} />
          <TextInput label="School / Site" value={meta.school} onChange={v => setMf("school", v)} />
          <TextInput label="Grade Level" value={meta.grade} onChange={v => setMf("grade", v)} />
          <TextInput label="Subject" value={meta.subject} onChange={v => setMf("subject", v)} />
          <TextInput label="Date" type="date" value={meta.date} onChange={v => setMf("date", v)} />
        </div>
      </Card>

      {/* Framework selector */}
      <Card>
        <Label>Evaluation Framework</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 12 }}>
          {Object.entries(FRAMEWORKS).map(([key, f]) => (
            <div key={key} onClick={() => setFramework(key)}
              style={{ background: framework===key ? f.color+"1a" : "#161b22", border: `2px solid ${framework===key ? f.color : "#21262d"}`,
                borderRadius: 9, padding: "11px 10px", cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: framework===key ? f.color : "#475569" }}>{f.shortName}</div>
              <div style={{ fontSize: 9, color: "#334155", marginTop: 3 }}>v{f.version}</div>
              <div style={{ fontSize: 9, color: "#21262d", marginTop: 5, lineHeight: 1.4 }}>{f.usedIn}</div>
            </div>
          ))}
        </div>
        <div style={{ background: fw.color + "0d", border: `1px solid ${fw.color}22`, borderRadius: 7, padding: "9px 14px", fontSize: 12, color: fw.color }}>
          <strong>{fw.name}</strong> <span style={{ color: "#475569", marginLeft: 8 }}>Rating scale: {Object.entries(fw.ratingScale).map(([k,v]) => `${k}–${v}`).join("  ·  ")}</span>
        </div>
      </Card>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant={mode==="manual"?"primary":"ghost"} size="sm" onClick={() => setMode("manual")}>✏️ Paste Transcript</Btn>
        <Btn variant={mode==="live"?"primary":"ghost"} size="sm" onClick={() => setMode("live")}>🎙 Live Recording</Btn>
      </div>

      {mode === "live" ? (
        <Card>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0 4px" }}>
            <Waveform active={isRecording && !isPaused} level={audioLevel} />
            {isRecording && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="rec-pulse" style={{ width: 9, height: 9, background: "#ef4444", borderRadius: "50%" }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: "#ef4444", fontWeight: 600 }}>{fmtTime(recTime)}</span>
                {isPaused && <Chip label="Paused" color="#f97316" />}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              {!isRecording
                ? <Btn size="lg" onClick={startRecording}>⏺ Start Recording</Btn>
                : <>
                    <Btn variant="ghost" onClick={togglePause}>{isPaused ? "▶ Resume" : "⏸ Pause"}</Btn>
                    <Btn variant="danger" onClick={stopRecording}>⏹ Stop & Save</Btn>
                  </>}
            </div>
          </div>
          {transcript && (
            <div style={{ marginTop: 14, background: "#0a0d12", borderRadius: 8, padding: 14, maxHeight: 220, overflowY: "auto" }}>
              <Label>Live Transcript</Label>
              <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{transcript}</p>
            </div>
          )}
          {!transcript && !isRecording && (
            <p style={{ fontSize: 12, color: "#334155", textAlign: "center", marginTop: 8 }}>Press Start to begin recording. Transcript will appear live.</p>
          )}
        </Card>
      ) : (
        <Card>
          <Label>Transcript</Label>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={14}
            placeholder={`Paste your classroom transcript here.\n\nBest results when you:\n  • Label speakers:  Teacher:  Student A:  Student B:\n  • Include timestamps if available  [0:00]\n  • Include student questions and responses\n  • Note transitions, activities, or pacing shifts\n\nExample:\nTeacher: Today we're diving into systems of equations. Before we start — who can tell me what we figured out last week about slope?\nStudent A: That slope is like the steepness of the line?\nTeacher: Exactly right. And how does that connect to what we're doing today?`}
            style={{ width: "100%", background: "#0a0d12", border: "1px solid #21262d", borderRadius: 9, padding: 14, color: "#e6edf3", fontSize: 13, lineHeight: 1.85, outline: "none" }} />
          <div style={{ fontSize: 11, color: "#334155", marginTop: 6, textAlign: "right" }}>
            {transcript.split(" ").filter(Boolean).length} words
          </div>
        </Card>
      )}

      {err && <div style={{ background: "#7f1d1d22", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#fca5a5" }}>{err}</div>}

      <Btn onClick={handleAnalyze} disabled={loading} full size="lg">
        {loading
          ? <span style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}><Spinner />Analyzing with {fw.shortName}…</span>
          : `⚡ Analyze Lesson — ${fw.shortName} Framework`}
      </Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYSIS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function AnalysisView({ session, apiKey }) {
  const [tips, setTips] = useState({});
  const [loadingTip, setLoadingTip] = useState({});
  const [openTip, setOpenTip] = useState(null);
  if (!session) return <EmptyState icon="⚡" text="Run an observation to see AI analysis here." />;

  const { analysis, framework: fwKey, meta } = session;
  const fw = FRAMEWORKS[fwKey];

  const getTip = async (ck, cn, rating, evidence) => {
    if (openTip === ck) { setOpenTip(null); return; }
    setOpenTip(ck);
    if (tips[ck]) return;
    setLoadingTip(p => ({ ...p, [ck]: true }));
    try {
      const tip = await generateCoachingTip(apiKey, ck, cn, rating, evidence, fw);
      setTips(p => ({ ...p, [ck]: tip }));
    } catch {}
    setLoadingTip(p => ({ ...p, [ck]: false }));
  };

  const domainAvgs = Object.entries(fw.domains).map(([dk, d]) => {
    const rated = Object.keys(d.components).map(c => analysis.evidence?.[c]?.rating).filter(Boolean);
    const avg = rated.length ? rated.reduce((a,b)=>a+b,0)/rated.length : null;
    return { dk, d, avg };
  });

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header card */}
      <Card style={{ borderTop: `3px solid ${fw.color}` }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <ScoreRing value={analysis.overallRating} max={Object.keys(fw.ratingScale).length} color={fw.color} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <Chip label={fw.shortName} color={fw.color} size="md" />
              {meta.subject && <Chip label={meta.subject} color="#475569" size="md" />}
              {meta.grade && <Chip label={`Gr ${meta.grade}`} color="#475569" size="md" />}
              {analysis.overallRating && <Chip label={fw.ratingScale[Math.round(analysis.overallRating)]} color={ratingColor(Math.round(analysis.overallRating))} size="md" />}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e6edf3" }}>{meta.teacher || "Observation"}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{meta.school}{meta.school && " · "}{meta.date} · Observer: {meta.observer || "—"}</div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75, marginTop: 12 }}>{analysis.summary}</p>
          </div>
        </div>
      </Card>

      {/* Domain scores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        {domainAvgs.map(({ dk, d, avg }) => (
          <Card key={dk}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: d.color, fontWeight: 800, letterSpacing: "0.1em" }}>{dk}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{d.label}</div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: avg ? d.color : "#21262d", fontFamily: "'JetBrains Mono',monospace" }}>{avg?.toFixed(1) || "—"}</span>
            </div>
            <RatingBar value={avg || 0} max={Object.keys(fw.ratingScale).length} color={d.color} />
          </Card>
        ))}
      </div>

      {/* Strengths / Growth */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card accent="#22c55e">
          <Label color="#22c55e">✓ Strengths</Label>
          {analysis.strengths?.map((s,i) => (
            <div key={i} style={{ fontSize: 12, color: "#86efac", lineHeight: 1.7, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #22c55e33" }}>{s}</div>
          ))}
        </Card>
        <Card accent="#f97316">
          <Label color="#f97316">↑ Growth Areas</Label>
          {analysis.growthAreas?.map((s,i) => (
            <div key={i} style={{ fontSize: 12, color: "#fdba74", lineHeight: 1.7, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #f9731633" }}>{s}</div>
          ))}
        </Card>
      </div>

      {/* Scripted examples */}
      {analysis.scriptedExamples && (
        <Card>
          <Label>Scripted Language</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#0a0d12", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 6 }}>WHAT WORKED</div>
              <p style={{ fontSize: 12, color: "#86efac", fontStyle: "italic", lineHeight: 1.8 }}>"{analysis.scriptedExamples.whatWorked}"</p>
            </div>
            <div style={{ background: "#0a0d12", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, marginBottom: 6 }}>TRY NEXT TIME</div>
              <p style={{ fontSize: 12, color: "#93c5fd", fontStyle: "italic", lineHeight: 1.8 }}>"{analysis.scriptedExamples.whatToTry}"</p>
            </div>
          </div>
        </Card>
      )}

      {/* Evidence by component */}
      <Card>
        <Label>Evidence by Component</Label>
        {Object.entries(fw.domains).map(([dk, d]) => {
          const evidenceComps = Object.entries(d.components).filter(([ck]) => analysis.evidence?.[ck]);
          if (!evidenceComps.length) return null;
          return (
            <div key={dk} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: d.color, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${d.color}22` }}>
                {dk} — {d.label}
              </div>
              {evidenceComps.map(([ck, cn]) => {
                const ev = analysis.evidence[ck];
                const rc = ratingColor(ev.rating);
                return (
                  <div key={ck} style={{ marginBottom: 10, background: "#0a0d12", borderRadius: 9, padding: 12, borderLeft: `3px solid ${d.color}44` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                      <div>
                        <span style={{ fontSize: 10, color: d.color, fontWeight: 800 }}>{ck} </span>
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{cn}</span>
                      </div>
                      {ev.rating && <Chip label={`${ev.rating} – ${fw.ratingScale[ev.rating]}`} color={rc} />}
                    </div>
                    {ev.evidence?.slice(0,2).map((e,i) => (
                      <div key={i} style={{ fontSize: 11, color: "#64748b", background: "#161b22", borderRadius: 5, padding: "5px 10px", marginBottom: 4, lineHeight: 1.6 }}>❝ {e}</div>
                    ))}
                    {ev.feedback && <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.65, marginTop: 7 }}>{ev.feedback}</p>}
                    <div style={{ marginTop: 8 }}>
                      <Btn size="sm" variant="ghost" onClick={() => getTip(ck, cn, ev.rating, ev.evidence)}>
                        {openTip === ck ? "▲ Hide Tip" : "✦ Coaching Tip"}
                      </Btn>
                      {openTip === ck && (
                        <div style={{ marginTop: 8, background: d.color+"0d", border: `1px solid ${d.color}22`, borderRadius: 8, padding: 12 }}>
                          {loadingTip[ck]
                            ? <span style={{ display:"flex",alignItems:"center",gap:8,color:"#475569",fontSize:12 }}><Spinner size={14}/>Generating tip…</span>
                            : <p style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.75 }}>{tips[ck]}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </Card>

      {/* Student interventions */}
      {analysis.studentInterventions?.length > 0 && (
        <Card>
          <Label>Student Intervention Recommendations</Label>
          {analysis.studentInterventions.map((item, i) => {
            const uc = { high:"#ef4444", medium:"#f97316", low:"#22c55e" }[item.urgency] || "#64748b";
            return (
              <div key={i} style={{ background: "#0a0d12", borderRadius: 9, padding: 13, marginBottom: 10, borderLeft: `3px solid ${uc}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#e6edf3" }}>{item.studentRef}</span>
                  <Chip label={`${item.urgency} priority`} color={uc} />
                </div>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, lineHeight: 1.6 }}><strong style={{ color:"#475569" }}>Observed:</strong> {item.observation}</p>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, lineHeight: 1.6 }}><strong style={{ color:"#22c55e" }}>Intervention:</strong> {item.intervention}</p>
                {item.strategy && <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}><strong style={{ color:"#3b82f6" }}>Strategy:</strong> {item.strategy}</p>}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GROWTH PLAN VIEW
// ─────────────────────────────────────────────────────────────────────────────
function GrowthPlanView({ session }) {
  if (!session?.analysis?.growthPlan) return <EmptyState icon="🌱" text="Complete an observation to generate a growth plan." />;
  const { analysis, meta } = session;

  const copy = () => {
    const lines = [
      `PROFESSIONAL GROWTH PLAN`,
      `Teacher: ${meta.teacher || "—"} | Date: ${meta.date} | Observer: ${meta.observer || "—"}`,
      `School: ${meta.school || "—"} | Subject: ${meta.subject} Gr ${meta.grade}`, "",
      `OBSERVATION SUMMARY`, analysis.summary, "",
      `STRENGTHS`, ...(analysis.strengths || []).map(s => "• " + s), "",
      `GROWTH AREAS`, ...(analysis.growthAreas || []).map(s => "• " + s), "",
      `IMMEDIATE ACTIONS (Next Class)`, ...(analysis.growthPlan.immediate || []).map(s => "• " + s), "",
      `SHORT-TERM GOALS (2 Weeks)`, ...(analysis.growthPlan.shortTerm || []).map(s => "• " + s), "",
      `LONG-TERM PROFESSIONAL GROWTH`, ...(analysis.growthPlan.longTerm || []).map(s => "• " + s), "",
      `SCRIPTED LANGUAGE TO PRACTICE`,
      `What worked: "${analysis.scriptedExamples?.whatWorked}"`,
      `Try next: "${analysis.scriptedExamples?.whatToTry}"`, "",
      `Generated by ClassroomLens Pro | anthonykc@gmail.com`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    alert("Growth plan copied to clipboard!");
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ borderTop: "3px solid #22c55e" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#e6edf3" }}>Growth Plan — {meta.teacher || "Teacher"}</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{meta.date} · {meta.school}</div>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75, marginTop: 12 }}>{analysis.summary}</p>
      </Card>

      {[
        { key: "immediate", label: "🎯 Tomorrow — Take Action Now", color: "#ef4444", desc: "Implement in your very next class" },
        { key: "shortTerm",  label: "📅 2-Week Practice Goals", color: "#f97316", desc: "Consistent focus over the next two weeks" },
        { key: "longTerm",   label: "🚀 Long-Term Development", color: "#3b82f6", desc: "Professional growth trajectory" },
      ].map(s => (
        <Card key={s.key} accent={s.color}>
          <div style={{ fontSize: 14, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.label}</div>
          <div style={{ fontSize: 10, color: "#334155", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.desc}</div>
          {(analysis.growthPlan[s.key] || []).map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, background: "#0a0d12", borderRadius: 7, padding: "10px 12px", marginBottom: 8 }}>
              <span style={{ color: s.color, flexShrink: 0, fontWeight: 800 }}>▸</span>
              <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65 }}>{item}</span>
            </div>
          ))}
        </Card>
      ))}

      {analysis.scriptedExamples && (
        <Card>
          <Label>Scripted Language to Practice</Label>
          <div style={{ background: "#0a0d12", borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>Replace current phrasing with:</p>
            <p style={{ fontSize: 13, color: "#93c5fd", fontStyle: "italic", lineHeight: 1.8 }}>"{analysis.scriptedExamples.whatToTry}"</p>
          </div>
        </Card>
      )}

      <Btn variant="ghost" full onClick={copy}>📋 Copy Full Growth Plan to Clipboard</Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COACHING CONFERENCE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function CoachingView({ session, apiKey }) {
  const [confType, setConfType] = useState("pre");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);
  useEffect(() => { setMessages([]); }, [confType]);

  if (!session) return <EmptyState icon="💬" text="Complete an observation to open coaching conference tools." />;
  const { analysis } = session;
  const questions = confType === "pre" ? analysis.preConferenceQuestions : analysis.postConferenceQuestions;

  const send = async (msg) => {
    if (!msg.trim() || loading) return;
    const updated = [...messages, { role: "user", content: msg }];
    setMessages(updated); setInput(""); setLoading(true);
    try {
      const reply = await generateCoachingReply(apiKey, session, updated, confType);
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(p => [...p, { role: "assistant", content: "Error: " + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#e6edf3" }}>Coaching Conference</div>
            <div style={{ fontSize: 12, color: "#475569" }}>{session.meta.teacher} · {FRAMEWORKS[session.framework]?.shortName}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant={confType==="pre"?"primary":"ghost"} size="sm" onClick={() => setConfType("pre")}>Pre-Observation</Btn>
            <Btn variant={confType==="post"?"primary":"ghost"} size="sm" onClick={() => setConfType("post")}>Post-Observation</Btn>
          </div>
        </div>
      </Card>

      {questions?.length > 0 && (
        <Card>
          <Label>AI-Generated {confType === "pre" ? "Pre" : "Post"}-Conference Questions</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions.map((q, i) => (
              <div key={i} onClick={() => send(q)}
                style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 12, color: "#94a3b8", lineHeight: 1.6, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#3b82f6"; e.currentTarget.style.color="#e6edf3"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#21262d"; e.currentTarget.style.color="#94a3b8"; }}>
                💬 {q}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ display: "flex", flexDirection: "column" }}>
        <Label>Conference Conversation</Label>
        <div ref={chatRef} style={{ minHeight: 200, maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {messages.length === 0 && <p style={{ fontSize: 12, color: "#334155", fontStyle: "italic" }}>Click a question above or type to begin the conference…</p>}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{ maxWidth: "80%", background: m.role==="user"?"#1d4ed815":"#161b22", border: `1px solid ${m.role==="user"?"#3b82f622":"#21262d"}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: "#334155", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>{m.role==="user"?"TEACHER":"COACH"}</div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75 }}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading && <div style={{ display:"flex",gap:8,alignItems:"center" }}><Spinner size={14}/><span style={{ fontSize:12,color:"#475569" }}>Coach is responding…</span></div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send(input)}
            placeholder="Type a teacher response or question…"
            style={{ flex:1, background:"#161b22", border:"1px solid #30363d", borderRadius:8, padding:"10px 14px", color:"#e6edf3", fontSize:13, outline:"none", fontFamily:"inherit" }} />
          <Btn onClick={() => send(input)} disabled={loading||!input.trim()}>Send</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ReportView({ session, apiKey }) {
  const [reportType, setReportType] = useState("formal");
  const [reportText, setReportText] = useState("");
  const [generating, setGenerating] = useState(false);

  if (!session) return <EmptyState icon="📄" text="Complete an observation to generate reports." />;
  const { meta, framework: fwKey } = session;
  const fw = FRAMEWORKS[fwKey];

  const generate = async () => {
    setGenerating(true); setReportText("");
    try {
      const text = await generateReport(apiKey, session, reportType);
      setReportText(text);
    } catch (e) { setReportText("Error generating report: " + e.message); }
    setGenerating(false);
  };

  const copy = () => {
    const full = [
      "CLASSROOM OBSERVATION REPORT",
      `Teacher: ${meta.teacher || "—"}  |  Observer: ${meta.observer || "—"}`,
      `Date: ${meta.date}  |  School: ${meta.school || "—"}`,
      `Grade/Subject: ${meta.grade} · ${meta.subject}  |  Framework: ${fw.name}`, "",
      reportText, "",
      `Observer Signature: ________________________  Date: ________`,
      `Teacher Signature: ________________________   Date: ________`,
      "", "Generated by ClassroomLens Pro | anthonykc@gmail.com",
    ].join("\n");
    navigator.clipboard?.writeText(full);
    alert("Report copied to clipboard!");
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <Label>Report Type</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            ["formal","📋 Formal Summative Evaluation","For HR file or official personnel record"],
            ["teacher","💌 Teacher Feedback Letter","Warm, direct, growth-focused — addressed to teacher"],
            ["admin","📊 Admin / Principal Summary","Jargon-free summary focused on student impact"],
            ["growth","🌱 PD Action Plan Memo","Professional development documentation for coaching file"],
          ].map(([k, label, desc]) => (
            <div key={k} onClick={() => setReportType(k)}
              style={{ background: reportType===k?"#1d4ed811":"#161b22", border: `2px solid ${reportType===k?"#3b82f6":"#21262d"}`, borderRadius: 9, padding: 12, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: reportType===k?"#93c5fd":"#94a3b8" }}>{label}</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 3 }}>{desc}</div>
            </div>
          ))}
        </div>
        <Btn onClick={generate} disabled={generating} full size="lg">
          {generating ? <span style={{ display:"flex",alignItems:"center",gap:10,justifyContent:"center" }}><Spinner />Generating…</span> : "📄 Generate Report"}
        </Btn>
      </Card>

      {reportText && (
        <Card style={{ borderTop: "3px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <Label>Generated Report</Label>
            <Btn size="sm" variant="outline" onClick={copy}>📋 Copy Full Report</Btn>
          </div>
          <div style={{ background: "#0a0d12", borderRadius: 8, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#e6edf3", marginBottom: 10 }}>Classroom Observation Report</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {[["Teacher",meta.teacher],["Observer",meta.observer],["Date",meta.date],["School",meta.school],["Grade / Subject",`${meta.grade} · ${meta.subject}`],["Framework",fw.name]].map(([l,v]) => (
                <div key={l} style={{ fontSize: 11, color: "#475569" }}><strong style={{ color:"#64748b" }}>{l}:</strong> {v || "—"}</div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{reportText}</p>
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #21262d", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, color: "#334155" }}>Observer Signature: ________________________  Date: ________</div>
            <div style={{ fontSize: 10, color: "#334155" }}>Teacher Signature: ________________________   Date: ________</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: "#1e293b", textAlign: "center" }}>Generated by ClassroomLens Pro · anthonykc@gmail.com</div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard({ sessions }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? sessions : sessions.filter(s => s.framework === filter);
  const avgOverall = filtered.length ? (filtered.reduce((a,s) => a + (s.analysis?.overallRating||0), 0) / filtered.length).toFixed(2) : "—";
  const needsSupport = sessions.filter(s => s.analysis?.overallRating && s.analysis.overallRating < 2.5);
  const teachers = [...new Set(sessions.map(s => s.meta.teacher).filter(Boolean))];

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { label: "Total Observations", value: sessions.length, color: "#3b82f6", icon: "📋" },
          { label: "School Average", value: avgOverall, color: "#22c55e", icon: "⭐" },
          { label: "Needs Support", value: needsSupport.length, color: "#ef4444", icon: "🚨" },
          { label: "Teachers Observed", value: teachers.length, color: "#f59e0b", icon: "👩‍🏫" },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Framework breakdown */}
      <Card>
        <Label>Observations by Framework</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
          {Object.entries(FRAMEWORKS).map(([fk, f]) => {
            const count = sessions.filter(s => s.framework === fk).length;
            const rated = sessions.filter(s => s.framework === fk && s.analysis?.overallRating);
            const avg = rated.length ? (rated.reduce((a,s) => a+s.analysis.overallRating,0)/rated.length).toFixed(1) : "—";
            return (
              <div key={fk} style={{ background: "#0a0d12", borderRadius: 8, padding: 12, borderTop: `3px solid ${f.color}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: f.color }}>{f.shortName}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#e6edf3", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{count}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>obs · avg {avg}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Needs support */}
      {needsSupport.length > 0 && (
        <Card accent="#ef4444">
          <Label color="#ef4444">🚨 Teachers Needing Support (Rating Below 2.5)</Label>
          {needsSupport.map(s => {
            const fw = FRAMEWORKS[s.framework];
            return (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0d12", borderRadius: 7, padding: "10px 12px", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#e6edf3" }}>{s.meta.teacher}</span>
                  <span style={{ color: "#475569", fontSize: 11, marginLeft: 8 }}>{s.meta.subject} · Gr {s.meta.grade}</span>
                  <span style={{ color: "#334155", fontSize: 10, marginLeft: 8 }}>{s.meta.date}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Chip label={fw?.shortName} color={fw?.color} />
                  <span style={{ fontWeight: 800, color: "#ef4444", fontFamily: "'JetBrains Mono',monospace" }}>{s.analysis.overallRating?.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* All observations table */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <Label>All Observations</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["all","All"], ...Object.entries(FRAMEWORKS).map(([k,f]) => [k, f.shortName])].map(([v,l]) => (
              <Btn key={v} variant={filter===v?"primary":"ghost"} size="sm" onClick={() => setFilter(v)}>{l}</Btn>
            ))}
          </div>
        </div>
        {filtered.length === 0
          ? <p style={{ fontSize: 12, color: "#334155", textAlign: "center", padding: 30 }}>No observations yet. Complete your first observation to see data here.</p>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #21262d" }}>
                    {["Teacher","Subject","Grade","Date","Framework","Rating","Overall","Observer"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#475569", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const fw = FRAMEWORKS[s.framework];
                    const r = s.analysis?.overallRating;
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid #0d1117", transition: "background .1s" }}
                        onMouseEnter={e => e.currentTarget.style.background="#0a0d12"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"9px 10px",color:"#e6edf3",fontWeight:600 }}>{s.meta.teacher || "—"}</td>
                        <td style={{ padding:"9px 10px",color:"#64748b" }}>{s.meta.subject || "—"}</td>
                        <td style={{ padding:"9px 10px",color:"#64748b" }}>{s.meta.grade || "—"}</td>
                        <td style={{ padding:"9px 10px",color:"#64748b" }}>{s.meta.date}</td>
                        <td style={{ padding:"9px 10px" }}><Chip label={fw?.shortName} color={fw?.color} /></td>
                        <td style={{ padding:"9px 10px" }}>{r ? <Chip label={fw?.ratingScale[Math.round(r)]} color={ratingColor(Math.round(r))} /> : "—"}</td>
                        <td style={{ padding:"9px 10px",fontWeight:800,color:r?ratingColor(Math.round(r)):"#334155",fontFamily:"'JetBrains Mono',monospace" }}>{r?.toFixed(1) || "—"}</td>
                        <td style={{ padding:"9px 10px",color:"#64748b" }}>{s.meta.observer || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS LIST
// ─────────────────────────────────────────────────────────────────────────────
function SessionsList({ sessions, onSelect, onDelete }) {
  if (sessions.length === 0) return <EmptyState icon="📁" text="No saved sessions yet. Complete your first observation." />;
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: "#334155", marginBottom: 4 }}>{sessions.length} saved session{sessions.length!==1?"s":""} · stored locally on this device</div>
      {sessions.map(s => {
        const fw = FRAMEWORKS[s.framework];
        return (
          <div key={s.id} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: 16, transition: "border-color .15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor=fw.color}
            onMouseLeave={e => e.currentTarget.style.borderColor="#21262d"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
              <div style={{ cursor: "pointer", flex: 1 }} onClick={() => onSelect(s)}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#e6edf3" }}>{s.meta.teacher || "Unknown Teacher"}</span>
                  <Chip label={fw.shortName} color={fw.color} />
                  {s.analysis?.overallRating && <Chip label={`${s.analysis.overallRating.toFixed(1)} — ${fw.ratingScale[Math.round(s.analysis.overallRating)]}`} color={ratingColor(Math.round(s.analysis.overallRating))} />}
                </div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>{s.meta.subject} · Gr {s.meta.grade} · {s.meta.school}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Btn size="sm" variant="outline" onClick={() => onSelect(s)}>View</Btn>
                <Btn size="sm" variant="danger" onClick={() => { if(confirm("Delete this session?")) onDelete(s.id); }}>✕</Btn>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.55 }}>{s.analysis?.summary?.slice(0,120)}…</p>
            <div style={{ fontSize: 10, color: "#21262d", marginTop: 8 }}>{s.timestamp}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function SettingsView({ apiKey, onChangeKey, onClearSessions, sessionCount }) {
  const [newKey, setNewKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState("");

  const saveKey = async () => {
    if (!newKey.trim()) return;
    setTesting(true); setMsg("");
    try {
      await callClaude(newKey.trim(), "", "Say OK", 10);
      localStorage.setItem(APIKEY_STORAGE, newKey.trim());
      onChangeKey(newKey.trim());
      setMsg("✓ API key updated and connected!");
      setNewKey("");
    } catch(e) { setMsg("✗ Error: " + e.message); }
    setTesting(false);
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <Label>API Key</Label>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
          Current key: <span style={{ fontFamily:"'JetBrains Mono',monospace",color:"#475569" }}>{apiKey ? apiKey.slice(0,18)+"…" : "Not set"}</span>
        </div>
        <TextInput label="New API Key" value={newKey} onChange={setNewKey} placeholder="sk-ant-api03-..." />
        {msg && <p style={{ fontSize:12, color: msg.startsWith("✓")?"#22c55e":"#ef4444", marginTop:8 }}>{msg}</p>}
        <Btn onClick={saveKey} disabled={testing||!newKey.trim()} style={{ marginTop:10 }}>
          {testing ? <span style={{ display:"flex",gap:8,alignItems:"center" }}><Spinner size={14}/>Testing…</span> : "Update API Key"}
        </Btn>
        <p style={{ fontSize:11,color:"#21262d",marginTop:10 }}>Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color:"#3b82f6" }}>console.anthropic.com</a></p>
      </Card>

      <Card>
        <Label>Data & Sessions</Label>
        <p style={{ fontSize:12,color:"#64748b",marginBottom:14 }}>{sessionCount} sessions stored locally on this device using localStorage.</p>
        <div style={{ display:"flex",gap:10 }}>
          <Btn variant="danger" onClick={() => { if(confirm(`Delete all ${sessionCount} sessions? This cannot be undone.`)) { onClearSessions(); } }}>
            🗑 Clear All Sessions
          </Btn>
        </div>
      </Card>

      <Card>
        <Label>About ClassroomLens Pro</Label>
        <div style={{ fontSize:12,color:"#64748b",lineHeight:1.8 }}>
          <p>Version 1.0.0 · Built for instructional coaches, administrators, and teachers.</p>
          <p style={{ marginTop:8 }}>Supports: Danielson (2022), Marzano 2.0, CEL 5D+, TNTP Core, TPEP (2023)</p>
          <p style={{ marginTop:8 }}>Support & licensing: <a href="mailto:anthonykc@gmail.com" style={{ color:"#3b82f6" }}>anthonykc@gmail.com</a></p>
          <p style={{ marginTop:8,color:"#334155" }}>© 2025 ClassroomLens Pro · All rights reserved</p>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"record",   icon:"⏺",  label:"Observe"  },
  { id:"analysis", icon:"⚡",  label:"Analysis" },
  { id:"growth",   icon:"🌱",  label:"Growth"   },
  { id:"coaching", icon:"💬",  label:"Coaching" },
  { id:"report",   icon:"📄",  label:"Reports"  },
  { id:"admin",    icon:"🏫",  label:"Admin"    },
  { id:"sessions", icon:"📁",  label:"Sessions" },
  { id:"settings", icon:"⚙️",  label:"Settings" },
];

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    const env = import.meta.env?.VITE_ANTHROPIC_API_KEY;
    if (env && env !== "sk-ant-your-key-goes-here") return env;
    return localStorage.getItem(APIKEY_STORAGE) || "";
  });
  const [tab, setTab] = useState("record");
  const [sessions, setSessions] = useState(() => loadSessions());
  const [activeSession, setActiveSession] = useState(null);

  // Persist sessions
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  const handleAnalyze = useCallback((session) => {
    setSessions(prev => { const updated = [session, ...prev]; return updated; });
    setActiveSession(session);
    setTab("analysis");
  }, []);

  const deleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession?.id === id) setActiveSession(null);
  };

  const clearSessions = () => { setSessions([]); setActiveSession(null); };

  if (!apiKey) return (
    <>
      <style>{css}</style>
      <ApiKeySetup onSave={setApiKey} />
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#010409" }}>
      <style>{css}</style>

      {/* Top bar */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", borderRadius: 7, display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>🎓</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#e6edf3", letterSpacing: "-0.02em" }}>ClassroomLens <span style={{ color:"#3b82f6" }}>Pro</span></div>
            <div style={{ fontSize: 9, color: "#21262d", letterSpacing: "0.1em" }}>AI OBSERVATION PLATFORM</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {activeSession && (
            <div style={{ fontSize: 11, color: "#475569", background: "#161b22", border: "1px solid #21262d", borderRadius: 6, padding: "3px 10px" }}>
              Active: <strong style={{ color:"#94a3b8" }}>{activeSession.meta.teacher || "Session"}</strong>
            </div>
          )}
          <Chip label={`${sessions.length} saved`} color="#334155" />
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #21262d", display: "flex", padding: "0 20px", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "transparent", border: "none", borderBottom: `2px solid ${tab===t.id?"#3b82f6":"transparent"}`,
              color: tab===t.id?"#e6edf3":"#475569", padding: "10px 15px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              whiteSpace: "nowrap", fontFamily: "inherit", transition: "all .15s", borderRadius: "6px 6px 0 0" }}>
            <span style={{ marginRight: 5 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 80px" }}>
        {tab === "record"   && <RecordView apiKey={apiKey} onAnalyze={handleAnalyze} />}
        {tab === "analysis" && <AnalysisView session={activeSession} apiKey={apiKey} />}
        {tab === "growth"   && <GrowthPlanView session={activeSession} />}
        {tab === "coaching" && <CoachingView session={activeSession} apiKey={apiKey} />}
        {tab === "report"   && <ReportView session={activeSession} apiKey={apiKey} />}
        {tab === "admin"    && <AdminDashboard sessions={sessions} />}
        {tab === "sessions" && <SessionsList sessions={sessions} onSelect={s => { setActiveSession(s); setTab("analysis"); }} onDelete={deleteSession} />}
        {tab === "settings" && <SettingsView apiKey={apiKey} onChangeKey={setApiKey} onClearSessions={clearSessions} sessionCount={sessions.length} />}
      </div>
    </div>
  );
}
