import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./lib/auth.jsx";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { LandingPage } from "./components/LandingPage.jsx";
import { PricingView } from "./components/PricingView.jsx";
import { Chip, Card, Label, Btn, TextInput, Spinner, ScoreRing, Waveform, RatingBar, EmptyState, Icon } from "./components/ui.jsx";
import * as sessionsApi from "./lib/sessionsApi.js";
import * as orgApi from "./lib/orgApi.js";
import { getBillingAccount, checkObservationAllowance, verifyCheckoutSession, openBillingPortal } from "./lib/billingApi.js";
import { callClaude } from "./lib/claudeApi.js";

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  :root{
    --bg:#f8fafc; --surface:#ffffff; --surface-2:#f1f5f9; --surface-3:#e2e8f0;
    --border:#e2e8f0; --border-strong:#cbd5e1;
    --text:#0f172a; --text-2:#334155; --text-3:#475569; --text-4:#64748b; --text-5:#94a3b8; --text-faint:#cbd5e1;
    --accent:#4f46e5; --accent-hover:#4338ca; --accent-soft:#eef2ff;
    --success:#16a34a; --success-soft:#f0fdf4;
    --warning:#d97706; --warning-soft:#fffbeb;
    --danger:#dc2626; --danger-soft:#fef2f2;
    --sidebar-bg:#0f172a; --sidebar-bg-2:#1e293b; --sidebar-text:#94a3b8; --sidebar-border:#1e293b;
    --shadow-sm:0 1px 2px rgba(15,23,42,.05);
    --shadow-md:0 1px 3px rgba(15,23,42,.08),0 1px 2px rgba(15,23,42,.04);
    --shadow-lg:0 8px 24px rgba(15,23,42,.10),0 2px 6px rgba(15,23,42,.06);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;}
  body{background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  ::-webkit-scrollbar{width:8px;height:8px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:10px;}
  input,textarea,select,button{font-family:inherit;}
  textarea{resize:vertical;}
  input:focus,textarea:focus,select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-soft);}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
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

  ttess: {
    name: "Texas Teacher Evaluation and Support System (T-TESS)",
    shortName: "T-TESS",
    version: "2016",
    color: "#0d9488",
    usedIn: "All Texas school districts",
    domains: {
      "Domain 1": {
        label: "Planning", color: "#0d9488",
        components: {
          "1.1": "Standards and Alignment",
          "1.2": "Data and Assessment",
          "1.3": "Knowledge of Students",
          "1.4": "Activities",
        },
      },
      "Domain 2": {
        label: "Instruction", color: "#14b8a6",
        components: {
          "2.1": "Achieving Expectations",
          "2.2": "Content Knowledge and Expertise",
          "2.3": "Communication",
          "2.4": "Differentiation",
          "2.5": "Monitor and Adjust",
        },
      },
      "Domain 3": {
        label: "Learning Environment", color: "#2dd4bf",
        components: {
          "3.1": "Classroom Environment, Routines & Procedures",
          "3.2": "Managing Student Behavior",
          "3.3": "Classroom Culture",
        },
      },
      "Domain 4": {
        label: "Professional Practices & Responsibilities", color: "#5eead4",
        components: {
          "4.1": "Professional Demeanor and Ethics",
          "4.2": "Goal Setting",
          "4.3": "Professional Development",
          "4.4": "School Community Involvement",
        },
      },
    },
    ratingScale: { 1: "Improvement Needed", 2: "Developing", 3: "Proficient", 4: "Accomplished", 5: "Distinguished" },
  },

  team: {
    name: "Tennessee Educator Acceleration Model (TEAM)",
    shortName: "TEAM",
    version: "General Educator Rubric",
    color: "#db2777",
    usedIn: "Tennessee districts",
    domains: {
      "Planning": {
        label: "Planning", color: "#db2777",
        components: {
          "P1": "Instructional Plans",
          "P2": "Student Work",
          "P3": "Assessment",
        },
      },
      "Environment": {
        label: "Environment", color: "#ec4899",
        components: {
          "E1": "Expectations",
          "E2": "Managing Student Behavior",
          "E3": "Environment",
          "E4": "Respectful Culture",
        },
      },
      "Instruction": {
        label: "Instruction", color: "#f472b6",
        components: {
          "I1": "Standards and Objectives",
          "I2": "Motivating Students",
          "I3": "Presenting Instructional Content",
          "I4": "Lesson Structure and Pacing",
          "I5": "Activities and Materials",
          "I6": "Questioning",
          "I7": "Academic Feedback",
          "I8": "Grouping Students",
          "I9": "Teacher Content Knowledge",
          "I10": "Teacher Knowledge of Students",
          "I11": "Thinking",
          "I12": "Problem Solving",
        },
      },
    },
    ratingScale: { 1: "Significantly Below Expectations", 2: "Below Expectations", 3: "At Expectations", 4: "Above Expectations", 5: "Significantly Above Expectations" },
  },

  tkes: {
    name: "Georgia Teacher Keys Effectiveness System (TKES)",
    shortName: "TKES",
    version: "Performance Standards",
    color: "#7c3aed",
    usedIn: "All Georgia school districts",
    domains: {
      "Planning": {
        label: "Planning", color: "#7c3aed",
        components: {
          "PS1": "Professional Knowledge",
          "PS2": "Instructional Planning",
        },
      },
      "Instructional Delivery": {
        label: "Instructional Delivery", color: "#8b5cf6",
        components: {
          "PS3": "Instructional Strategies",
          "PS4": "Differentiated Instruction",
        },
      },
      "Assessment": {
        label: "Assessment of and for Learning", color: "#a78bfa",
        components: {
          "PS5": "Assessment Strategies",
          "PS6": "Assessment Uses",
        },
      },
      "Learning Environment": {
        label: "Learning Environment", color: "#c4b5fd",
        components: {
          "PS7": "Positive Learning Environment",
          "PS8": "Academically Challenging Environment",
        },
      },
      "Professionalism & Communication": {
        label: "Professionalism & Communication", color: "#a855f7",
        components: {
          "PS9": "Professionalism",
          "PS10": "Communication",
        },
      },
    },
    ratingScale: { 1: "Ineffective", 2: "Needs Development", 3: "Proficient", 4: "Exemplary" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const fmtTime = s => `${Math.floor(s/60).toString().padStart(2,"0")}:${Math.floor(s%60).toString().padStart(2,"0")}`;
const ratingColors = { 1:"#ef4444", 2:"#f97316", 3:"#22c55e", 4:"#3b82f6", 5:"#8b5cf6" };
const ratingColor = (r) => ratingColors[r] || "#475569";

// Sessions used to live in localStorage under this key before cloud sync (phase 2).
// Kept around only so SettingsView can offer a one-time import into the user's account.
const LEGACY_STORAGE_KEY = "classroomlens_sessions_v2";

function loadLegacySessions() {
  try { return JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]"); } catch { return []; }
}
function clearLegacySessions() {
  try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeObservation(transcript, frameworkKey) {
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

  const text = await callClaude(system,
    `FRAMEWORK COMPONENTS:\n${allComponents}\n\nTRANSCRIPT:\n${transcript}\n\nAnalyze this lesson thoroughly.`,
    3500
  );
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function generateCoachingReply(session, messages, confType) {
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

  return callClaude(system, `Conversation so far:\n${history}\n\nCoach:`, 600);
}

async function generateReport(session, reportType) {
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

  return callClaude(system,
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

async function generateCoachingTip(compKey, compName, rating, evidence, fw) {
  const ratingLabel = fw.ratingScale[rating] || "Basic";
  return callClaude("",
    `You are an instructional coach. Write a warm, specific 3-sentence coaching tip for a teacher rated "${ratingLabel}" on ${fw.name} component ${compKey}: "${compName}".
Evidence from lesson: ${(evidence || []).join("; ")}
Be direct, encouraging, and give one concrete next step. No bullet points — write as if speaking directly to them.`,
    400
  );
}

async function analyzeIEPMeeting(notesText, meta) {
  const system = `You are an expert special education case manager and IDEA compliance specialist reviewing notes from an IEP meeting.
Analyze the notes thoroughly and return ONLY valid JSON — no preamble, no markdown fences, no extra text.

Required JSON structure (include ALL keys even if empty arrays):
{
  "summary": "2-3 sentence neutral summary of what was discussed and decided in this meeting",
  "studentStrengths": ["specific strength grounded in the notes"],
  "studentNeeds": ["specific need or area of concern grounded in the notes"],
  "goalAlignment": [
    { "goal": "goal name or area, e.g. Reading Fluency", "status": "on-track|needs-revision|new|unclear", "note": "1-2 sentence rationale tied to the notes" }
  ],
  "accommodationRecommendations": [
    { "accommodation": "specific, concrete accommodation or modification", "rationale": "why this helps, tied to the student's documented needs" }
  ],
  "parentCommunication": ["specific, warm suggestion for how to communicate this meeting's outcomes to the family"],
  "complianceNotes": [
    { "area": "e.g. Present Levels (PLAAFP), Least Restrictive Environment, Timelines, Parental Consent, Prior Written Notice", "note": "specific observation about IDEA/FAPE compliance based on what is or isn't documented in the notes", "flag": "ok|watch|missing" }
  ]
}

Ground every item in the actual notes provided — do not invent details. If the notes don't give enough information for a section, return fewer items rather than fabricating them. Compliance notes should flag gaps in documentation (e.g. missing present levels, unclear consent, no measurable goal criteria) as much as confirm what's present. This analysis supports the case manager's own judgment — it does not replace legal or clinical review.`;

  const metaLine = [
    meta?.meetingType && `Meeting type: ${meta.meetingType}`,
    meta?.grade && `Grade: ${meta.grade}`,
    meta?.date && `Date: ${meta.date}`,
  ].filter(Boolean).join(" | ");

  const text = await callClaude(system, `${metaLine ? metaLine + "\n\n" : ""}IEP MEETING NOTES:\n${notesText}\n\nAnalyze these notes thoroughly.`, 3000);
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function analyzePLCMeeting(notesText, meta) {
  const system = `You are an expert instructional coach and PLC (Professional Learning Community) facilitator reviewing notes or a transcript from a PLC team meeting.
Analyze the content thoroughly and return ONLY valid JSON — no preamble, no markdown fences, no extra text.

Required JSON structure (include ALL keys even if empty arrays):
{
  "summary": "2-3 sentence neutral summary of what this PLC meeting covered",
  "keyDecisions": ["specific decision the team made, grounded in the notes"],
  "actionItems": [
    { "item": "specific, concrete action item", "owner": "who owns it, or 'Unassigned' if unclear", "timeline": "when it's due, or 'Not specified' if unclear" }
  ],
  "collaborativeInquiryEvidence": ["specific example of the team using data, evidence, or shared inquiry to drive the discussion (as opposed to opinion or anecdote)"],
  "teacherLearningGoals": ["professional learning goal or growth area identified for the team or individual teachers"],
  "studentLearningNeeds": ["specific student learning need or gap surfaced during the discussion"],
  "followUpRecommendations": ["concrete recommendation for what the next PLC meeting should address or follow up on"],
  "goalAlignment": { "status": "aligned|partial|unclear", "note": "1-2 sentences on how this meeting connects to school/district improvement goals, based on what's in the notes" },
  "normsObservations": [
    { "area": "e.g. Equity of Voice, Time Management, Focus on Data, Active Listening, Solution-Oriented Talk", "note": "specific observation grounded in the notes", "flag": "strong|watch|concern" }
  ]
}

Ground every item in the actual notes/transcript provided — do not invent details. If the notes don't give enough information for a section, return fewer items rather than fabricating them. This analysis supports the facilitator's own reflection — it does not replace their judgment.`;

  const metaLine = [
    meta?.topic && `Meeting topic/focus: ${meta.topic}`,
    meta?.team && `Team: ${meta.team}`,
    meta?.facilitator && `Facilitator: ${meta.facilitator}`,
    meta?.date && `Date: ${meta.date}`,
  ].filter(Boolean).join(" | ");

  const text = await callClaude(system, `${metaLine ? metaLine + "\n\n" : ""}PLC MEETING NOTES:\n${notesText}\n\nAnalyze this meeting thoroughly.`, 3200);
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function analyzeLessonPlan(planText, frameworkKey) {
  const fw = FRAMEWORKS[frameworkKey];
  const allComponents = Object.entries(fw.domains)
    .flatMap(([, d]) => Object.entries(d.components).map(([ck, cn]) => `${ck}: ${cn}`))
    .join("\n");

  const system = `You are an expert instructional coach reviewing a WRITTEN LESSON PLAN (not a live observation) against the ${fw.name}.
Analyze the plan thoroughly and return ONLY valid JSON — no preamble, no markdown fences, no extra text.

Required JSON structure (include ALL keys):
{
  "summary": "2-3 sentence overview of the lesson plan and its overall readiness",
  "dimensions": {
    "standardsAlignment": { "rating": <1-4>, "notes": "how well the plan aligns to stated or implied standards/objectives" },
    "instructionalDesign": { "rating": <1-4>, "notes": "quality of the lesson's structure, sequencing, and pedagogical soundness" },
    "differentiation": { "rating": <1-4>, "notes": "how well the plan addresses diverse learners", "opportunities": ["specific missed differentiation opportunity"] },
    "assessmentStrategy": { "rating": <1-4>, "notes": "quality and alignment of formative/summative assessment in the plan" }
  },
  "suggestions": ["specific, concrete suggestion to improve this lesson plan before teaching it"],
  "evidence": {
    "<component_key>": {
      "rating": <number matching this framework's rating scale>,
      "evidence": ["direct quote or close paraphrase from the plan"],
      "feedback": "specific, actionable feedback in 1-2 sentences"
    }
  }
}

Rating scale for the "dimensions" block is always 1=Needs Work, 2=Developing, 3=Solid, 4=Strong, regardless of framework.
Rating scale for "evidence" entries uses this framework's own scale: ${Object.entries(fw.ratingScale).map(([k,v]) => `${k}=${v}`).join(", ")}.

This is a WRITTEN PLAN, not a classroom observation — only include "evidence" entries for framework components that can reasonably be judged from a written plan (e.g. planning, outcomes, assessment design, coherence of instruction). Skip components that require observing live delivery, classroom environment, or in-the-moment student behavior — a plan cannot demonstrate those.

FRAMEWORK COMPONENTS:
${allComponents}`;

  const text = await callClaude(system, `LESSON PLAN:\n${planText}\n\nAnalyze this lesson plan thoroughly.`, 3500);
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD / OBSERVE VIEW
// ─────────────────────────────────────────────────────────────────────────────
const SPEAKER_TAGS = ["Teacher", "Student A", "Student B", "Whole Class"];
const NOTE_CATEGORIES = ["Context", "What I Noticed", "Questions to Ask", "Student Behaviors"];
const QUICK_NOTES = [
  { label: "Transition", category: "What I Noticed" },
  { label: "Off-task behavior", category: "Student Behaviors" },
  { label: "Strong questioning", category: "What I Noticed" },
  { label: "Student confusion", category: "Student Behaviors" },
];
const TIMESTAMP_MARKER_SECONDS = 120;

function mergeTranscriptAndNotes(entries, notes) {
  const items = [
    ...entries.map(e => ({ time: e.time, kind: "t", speaker: e.speaker, text: e.text })),
    ...notes.map(n => ({ time: n.time, kind: "n", category: n.category, text: n.text })),
  ].sort((a, b) => a.time - b.time);
  const lines = [];
  let lastMarker = -1;
  for (const item of items) {
    const marker = Math.floor(item.time / TIMESTAMP_MARKER_SECONDS);
    if (marker > lastMarker) {
      lines.push(`— ${fmtTime(marker * TIMESTAMP_MARKER_SECONDS)} —`);
      lastMarker = marker;
    }
    lines.push(item.kind === "t"
      ? `[${fmtTime(item.time)}] ${item.speaker}: ${item.text}`
      : `[${fmtTime(item.time)}] OBSERVER NOTE (${item.category}): ${item.text}`);
  }
  return lines.join("\n");
}

function RecordView({ onAnalyze, onUsageChecked }) {
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

  // Split-screen live capture: transcript segments and observer notes are logged
  // separately with timestamps, then interleaved chronologically when recording stops.
  const [speakerTag, setSpeakerTag] = useState(SPEAKER_TAGS[0]);
  const [transcriptEntries, setTranscriptEntries] = useState([]);
  const [interimText, setInterimText] = useState("");
  const [notesEntries, setNotesEntries] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [activeCategory, setActiveCategory] = useState(NOTE_CATEGORIES[1]);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const analyzerRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const recTimeRef = useRef(0);
  const speakerTagRef = useRef(speakerTag);
  const transcriptScrollRef = useRef(null);
  const notesScrollRef = useRef(null);

  const setMf = (k, v) => setMeta(p => ({ ...p, [k]: v }));
  const fw = FRAMEWORKS[framework];

  useEffect(() => { recTimeRef.current = recTime; }, [recTime]);
  useEffect(() => { speakerTagRef.current = speakerTag; }, [speakerTag]);

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

  useEffect(() => {
    if (transcriptScrollRef.current) transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
  }, [transcriptEntries, interimText]);

  useEffect(() => {
    if (notesScrollRef.current) notesScrollRef.current.scrollTop = notesScrollRef.current.scrollHeight;
  }, [notesEntries]);

  const addNote = (text, category) => {
    const t = text.trim();
    if (!t) return;
    setNotesEntries(prev => [...prev, { time: recTimeRef.current, category, text: t }]);
  };

  const startRecording = async () => {
    setTranscript(""); setTranscriptEntries([]); setNotesEntries([]); setInterimText(""); setNoteDraft("");
    setRecTime(0); setErr("");
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
      r.onresult = e => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const chunk = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            if (chunk.trim()) {
              setTranscriptEntries(prev => [...prev, { time: recTimeRef.current, speaker: speakerTagRef.current, text: chunk.trim() }]);
            }
          } else {
            interim = chunk;
          }
        }
        setInterimText(interim);
      };
      r.onerror = e => { if (e.error !== "aborted") setErr("Mic error: " + e.error); };
      r.start();
      recognitionRef.current = r;
    } else {
      setErr("Live transcription requires Chrome or Edge. You can still add observer notes below, or switch to Paste mode.");
    }
    setIsRecording(true); setIsPaused(false);
  };

  const stopRecording = () => {
    setIsRecording(false); setIsPaused(false);
    cancelAnimationFrame(animRef.current);
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setAudioLevel(0);
    setInterimText("");
    const merged = mergeTranscriptAndNotes(transcriptEntries, notesEntries);
    if (merged) setTranscript(merged);
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

    // Authoritative billing gate — runs before the Claude call (which now bills
    // against our own shared key) so a lapsed subscription never even fires it.
    let allowance;
    try {
      allowance = await checkObservationAllowance();
      onUsageChecked?.(allowance);
    } catch (e) {
      setErr("Couldn't verify your plan: " + e.message);
      setLoading(false);
      return;
    }
    if (!allowance.allowed) {
      setLoading(false);
      return; // parent shows the paywall via onUsageChecked
    }

    let result;
    try {
      result = await analyzeObservation(text, framework);
    } catch (e) {
      setErr("Analysis failed: " + e.message);
      setLoading(false);
      return;
    }
    try {
      await onAnalyze({ meta: { ...meta }, framework, transcript: text, analysis: result });
    } catch (e) {
      setErr("Analysis succeeded but saving to your account failed: " + e.message);
    }
    setLoading(false);
  };

  const StepLabel = ({ n, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>{children}</span>
    </div>
  );

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Observation meta */}
      <Card>
        <StepLabel n={1}>Observation Details</StepLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
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
        <StepLabel n={2}>Evaluation Framework</StepLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
          {Object.entries(FRAMEWORKS).map(([key, f]) => (
            <div key={key} onClick={() => setFramework(key)}
              style={{ background: framework===key ? f.color+"12" : "var(--surface)", border: `1.5px solid ${framework===key ? f.color : "var(--border-strong)"}`,
                borderRadius: 9, padding: "12px 10px", cursor: "pointer", textAlign: "center", transition: "all .15s", boxShadow: framework===key ? "var(--shadow-sm)" : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: framework===key ? f.color : "var(--text-3)" }}>{f.shortName}</div>
              <div style={{ fontSize: 9, color: "var(--text-5)", marginTop: 3 }}>v{f.version}</div>
              <div style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 5, lineHeight: 1.4 }}>{f.usedIn}</div>
            </div>
          ))}
        </div>
        <div style={{ background: fw.color + "0d", border: `1px solid ${fw.color}22`, borderRadius: 7, padding: "9px 14px", fontSize: 12, color: fw.color }}>
          <strong>{fw.name}</strong> <span style={{ color: "var(--text-4)", marginLeft: 8 }}>Rating scale: {Object.entries(fw.ratingScale).map(([k,v]) => `${k}–${v}`).join("  ·  ")}</span>
        </div>
      </Card>

      {/* Transcript */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <StepLabel n={3}>Lesson Transcript</StepLabel>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant={mode==="manual"?"primary":"ghost"} size="sm" onClick={() => setMode("manual")}>✏️ Paste Transcript</Btn>
            <Btn variant={mode==="live"?"primary":"ghost"} size="sm" onClick={() => setMode("live")}>🎙 Live Recording</Btn>
          </div>
        </div>

        {mode === "live" ? (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0 4px", background: "var(--surface-2)", borderRadius: 10 }}>
              <Waveform active={isRecording && !isPaused} level={audioLevel} />
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="rec-pulse" style={{ width: 9, height: 9, background: "var(--danger)", borderRadius: "50%" }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: "var(--danger)", fontWeight: 600 }}>{fmtTime(recTime)}</span>
                  {isPaused && <Chip label="Paused" color="var(--warning)" />}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
                {!isRecording
                  ? <Btn size="lg" onClick={startRecording}>⏺ Start Recording</Btn>
                  : <>
                      <Btn variant="ghost" onClick={togglePause}>{isPaused ? "▶ Resume" : "⏸ Pause"}</Btn>
                      <Btn variant="danger" onClick={stopRecording}>⏹ Stop & Save</Btn>
                    </>}
              </div>
            </div>
            {isRecording ? (
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Left: live transcript panel */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <Label>Live Transcript</Label>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {SPEAKER_TAGS.map(tag => (
                        <button key={tag} onClick={() => setSpeakerTag(tag)}
                          style={{ background: speakerTag===tag ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${speakerTag===tag ? "var(--accent)" : "var(--border-strong)"}`,
                            color: speakerTag===tag ? "var(--accent)" : "var(--text-4)", borderRadius: 5, padding: "3px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div ref={transcriptScrollRef} style={{ flex: 1, minHeight: 260, maxHeight: 340, overflowY: "auto", background: "var(--surface-2)", borderRadius: 8, padding: 12 }}>
                    {transcriptEntries.length === 0 && !interimText && (
                      <p style={{ fontSize: 12, color: "var(--text-5)", fontStyle: "italic" }}>Listening… transcript will appear here as the lesson is recorded.</p>
                    )}
                    {transcriptEntries.map((e, i) => {
                      const marker = Math.floor(e.time / TIMESTAMP_MARKER_SECONDS);
                      const prevMarker = i > 0 ? Math.floor(transcriptEntries[i-1].time / TIMESTAMP_MARKER_SECONDS) : -1;
                      return (
                        <div key={i}>
                          {marker > prevMarker && (
                            <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-faint)", fontWeight: 700, letterSpacing: "0.08em", margin: "10px 0" }}>— {fmtTime(marker * TIMESTAMP_MARKER_SECONDS)} —</div>
                          )}
                          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 8 }}>
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--text-faint)", marginRight: 6 }}>{fmtTime(e.time)}</span>
                            <strong style={{ color: "var(--text)" }}>{e.speaker}:</strong> {e.text}
                          </div>
                        </div>
                      );
                    })}
                    {interimText && (
                      <div style={{ fontSize: 12, color: "var(--text-5)", fontStyle: "italic", lineHeight: 1.7 }}>{speakerTag}: {interimText}…</div>
                    )}
                  </div>
                </div>

                {/* Right: observer notes panel */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--warning)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column" }}>
                  <Label>Observer Notes</Label>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                    {NOTE_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setActiveCategory(cat)}
                        style={{ background: activeCategory===cat ? "var(--warning-soft)" : "var(--surface-2)", border: `1px solid ${activeCategory===cat ? "var(--warning)" : "var(--border-strong)"}`,
                          color: activeCategory===cat ? "var(--warning)" : "var(--text-4)", borderRadius: 5, padding: "3px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                    {QUICK_NOTES.map(qn => (
                      <button key={qn.label} onClick={() => addNote(qn.label, qn.category)}
                        style={{ background: "var(--surface-2)", border: "1px dashed var(--border-strong)", color: "var(--text-3)", borderRadius: 6, padding: "4px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        + {qn.label}
                      </button>
                    ))}
                  </div>
                  <div ref={notesScrollRef} style={{ flex: 1, minHeight: 180, maxHeight: 250, overflowY: "auto", background: "var(--surface-2)", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    {notesEntries.length === 0 && (
                      <p style={{ fontSize: 12, color: "var(--text-5)", fontStyle: "italic" }}>Notes you add will appear here, timestamped to when you added them.</p>
                    )}
                    {notesEntries.map((n, i) => (
                      <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < notesEntries.length-1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--text-faint)" }}>{fmtTime(n.time)}</span>
                          <Chip label={n.category} color="var(--warning)" />
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{n.text}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { addNote(noteDraft, activeCategory); setNoteDraft(""); } }}
                      placeholder={`Add a note (${activeCategory})…`}
                      style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 7, padding: "8px 11px", color: "var(--text)", fontSize: 12, outline: "none" }} />
                    <Btn size="sm" onClick={() => { addNote(noteDraft, activeCategory); setNoteDraft(""); }}>Add</Btn>
                  </div>
                </div>
              </div>
            ) : transcript ? (
              <div style={{ marginTop: 14 }}>
                <Label>Combined Transcript + Observer Notes</Label>
                <p style={{ fontSize: 11, color: "var(--text-5)", marginBottom: 8 }}>Transcript and your notes, interleaved chronologically. Review and edit before analyzing.</p>
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={14}
                  style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9, padding: 14, color: "var(--text)", fontSize: 13, lineHeight: 1.85, outline: "none" }} />
                <div style={{ fontSize: 11, color: "var(--text-5)", marginTop: 6, textAlign: "right" }}>{transcript.split(" ").filter(Boolean).length} words</div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "var(--text-5)", textAlign: "center", marginTop: 8 }}>Press Start to begin recording. Transcript and notes will appear live, side by side.</p>
            )}
          </div>
        ) : (
          <div>
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={14}
              placeholder={`Paste your classroom transcript here.\n\nBest results when you:\n  • Label speakers:  Teacher:  Student A:  Student B:\n  • Include timestamps if available  [0:00]\n  • Include student questions and responses\n  • Note transitions, activities, or pacing shifts\n\nExample:\nTeacher: Today we're diving into systems of equations. Before we start — who can tell me what we figured out last week about slope?\nStudent A: That slope is like the steepness of the line?\nTeacher: Exactly right. And how does that connect to what we're doing today?`}
              style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9, padding: 14, color: "var(--text)", fontSize: 13, lineHeight: 1.85, outline: "none" }} />
            <div style={{ fontSize: 11, color: "var(--text-5)", marginTop: 6, textAlign: "right" }}>
              {transcript.split(" ").filter(Boolean).length} words
            </div>
          </div>
        )}
      </Card>

      {err && <div style={{ background: "var(--danger-soft)", border: "1px solid #dc262622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--danger)" }}>{err}</div>}

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
// Renders a framework's domains/components against an { [componentKey]: {rating, evidence, feedback} }
// object, with an optional expandable AI coaching tip per component. Shared by AnalysisView
// (live observations) and LessonPlanView (written plans mapped to the same frameworks).
function FrameworkEvidenceBlock({ fw, evidence }) {
  const [tips, setTips] = useState({});
  const [loadingTip, setLoadingTip] = useState({});
  const [openTip, setOpenTip] = useState(null);

  const getTip = async (ck, cn, rating, ev) => {
    if (openTip === ck) { setOpenTip(null); return; }
    setOpenTip(ck);
    if (tips[ck]) return;
    setLoadingTip(p => ({ ...p, [ck]: true }));
    try {
      const tip = await generateCoachingTip(ck, cn, rating, ev, fw);
      setTips(p => ({ ...p, [ck]: tip }));
    } catch {}
    setLoadingTip(p => ({ ...p, [ck]: false }));
  };

  return (
    <>
      {Object.entries(fw.domains).map(([dk, d]) => {
        const evidenceComps = Object.entries(d.components).filter(([ck]) => evidence?.[ck]);
        if (!evidenceComps.length) return null;
        return (
          <div key={dk} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: d.color, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${d.color}22` }}>
              {dk} — {d.label}
            </div>
            {evidenceComps.map(([ck, cn]) => {
              const ev = evidence[ck];
              const rc = ratingColor(ev.rating);
              return (
                <div key={ck} style={{ marginBottom: 10, background: "var(--surface-2)", borderRadius: 9, padding: 12, borderLeft: `3px solid ${d.color}44` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: 10, color: d.color, fontWeight: 800 }}>{ck} </span>
                      <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>{cn}</span>
                    </div>
                    {ev.rating && <Chip label={`${ev.rating} – ${fw.ratingScale[ev.rating]}`} color={rc} />}
                  </div>
                  {ev.evidence?.slice(0,2).map((e,i) => (
                    <div key={i} style={{ fontSize: 11, color: "var(--text-3)", background: "var(--surface)", borderRadius: 5, padding: "5px 10px", marginBottom: 4, lineHeight: 1.6 }}>❝ {e}</div>
                  ))}
                  {ev.feedback && <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.65, marginTop: 7 }}>{ev.feedback}</p>}
                  <div style={{ marginTop: 8 }}>
                    <Btn size="sm" variant="ghost" onClick={() => getTip(ck, cn, ev.rating, ev.evidence)}>
                      {openTip === ck ? "▲ Hide Tip" : "✦ Coaching Tip"}
                    </Btn>
                    {openTip === ck && (
                      <div style={{ marginTop: 8, background: d.color+"0d", border: `1px solid ${d.color}22`, borderRadius: 8, padding: 12 }}>
                        {loadingTip[ck]
                          ? <span style={{ display:"flex",alignItems:"center",gap:8,color:"var(--text-4)",fontSize:12 }}><Spinner size={14}/>Generating tip…</span>
                          : <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.75 }}>{tips[ck]}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function AnalysisView({ session }) {
  if (!session) return <EmptyState icon="⚡" text="Run an observation to see AI analysis here." />;

  const { analysis, framework: fwKey, meta } = session;
  const fw = FRAMEWORKS[fwKey];

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
              {meta.subject && <Chip label={meta.subject} color="var(--text-4)" size="md" />}
              {meta.grade && <Chip label={`Gr ${meta.grade}`} color="var(--text-4)" size="md" />}
              {analysis.overallRating && <Chip label={fw.ratingScale[Math.round(analysis.overallRating)]} color={ratingColor(Math.round(analysis.overallRating))} size="md" />}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{meta.teacher || "Observation"}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{meta.school}{meta.school && " · "}{meta.date} · Observer: {meta.observer || "—"}</div>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, marginTop: 12 }}>{analysis.summary}</p>
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
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{d.label}</div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: avg ? d.color : "var(--text-faint)", fontFamily: "'JetBrains Mono',monospace" }}>{avg?.toFixed(1) || "—"}</span>
            </div>
            <RatingBar value={avg || 0} max={Object.keys(fw.ratingScale).length} color={d.color} />
          </Card>
        ))}
      </div>

      {/* Strengths / Growth */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card accent="#16a34a">
          <Label color="var(--success)">✓ Strengths</Label>
          {analysis.strengths?.map((s,i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #16a34a33" }}>{s}</div>
          ))}
        </Card>
        <Card accent="#d97706">
          <Label color="var(--warning)">↑ Growth Areas</Label>
          {analysis.growthAreas?.map((s,i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #d9770633" }}>{s}</div>
          ))}
        </Card>
      </div>

      {/* Scripted examples */}
      {analysis.scriptedExamples && (
        <Card>
          <Label>Scripted Language</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "var(--success-soft)", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: "var(--success)", fontWeight: 700, marginBottom: 6 }}>WHAT WORKED</div>
              <p style={{ fontSize: 12, color: "#15803d", fontStyle: "italic", lineHeight: 1.8 }}>"{analysis.scriptedExamples.whatWorked}"</p>
            </div>
            <div style={{ background: "var(--accent-soft)", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>TRY NEXT TIME</div>
              <p style={{ fontSize: 12, color: "#4338ca", fontStyle: "italic", lineHeight: 1.8 }}>"{analysis.scriptedExamples.whatToTry}"</p>
            </div>
          </div>
        </Card>
      )}

      {/* Evidence by component */}
      <Card>
        <Label>Evidence by Component</Label>
        <FrameworkEvidenceBlock fw={fw} evidence={analysis.evidence} />
      </Card>

      {/* Student interventions */}
      {analysis.studentInterventions?.length > 0 && (
        <Card>
          <Label>Student Intervention Recommendations</Label>
          {analysis.studentInterventions.map((item, i) => {
            const uc = { high:"#dc2626", medium:"#d97706", low:"#16a34a" }[item.urgency] || "var(--text-4)";
            return (
              <div key={i} style={{ background: "var(--surface-2)", borderRadius: 9, padding: 13, marginBottom: 10, borderLeft: `3px solid ${uc}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{item.studentRef}</span>
                  <Chip label={`${item.urgency} priority`} color={uc} />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4, lineHeight: 1.6 }}><strong style={{ color:"var(--text-4)" }}>Observed:</strong> {item.observation}</p>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4, lineHeight: 1.6 }}><strong style={{ color:"var(--success)" }}>Intervention:</strong> {item.intervention}</p>
                {item.strategy && <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}><strong style={{ color:"var(--accent)" }}>Strategy:</strong> {item.strategy}</p>}
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
      `Generated by ClassroomLens Pro | support@classroomlens.com`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    alert("Growth plan copied to clipboard!");
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ borderTop: "3px solid #16a34a" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>Growth Plan — {meta.teacher || "Teacher"}</div>
        <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3 }}>{meta.date} · {meta.school}</div>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, marginTop: 12 }}>{analysis.summary}</p>
      </Card>

      {[
        { key: "immediate", label: "🎯 Tomorrow — Take Action Now", color: "#dc2626", desc: "Implement in your very next class" },
        { key: "shortTerm",  label: "📅 2-Week Practice Goals", color: "#d97706", desc: "Consistent focus over the next two weeks" },
        { key: "longTerm",   label: "🚀 Long-Term Development", color: "#4f46e5", desc: "Professional growth trajectory" },
      ].map(s => (
        <Card key={s.key} accent={s.color}>
          <div style={{ fontSize: 14, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.label}</div>
          <div style={{ fontSize: 10, color: "var(--text-5)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.desc}</div>
          {(analysis.growthPlan[s.key] || []).map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, background: "var(--surface-2)", borderRadius: 7, padding: "10px 12px", marginBottom: 8 }}>
              <span style={{ color: s.color, flexShrink: 0, fontWeight: 800 }}>▸</span>
              <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{item}</span>
            </div>
          ))}
        </Card>
      ))}

      {analysis.scriptedExamples && (
        <Card>
          <Label>Scripted Language to Practice</Label>
          <div style={{ background: "var(--accent-soft)", borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 6 }}>Replace current phrasing with:</p>
            <p style={{ fontSize: 13, color: "#4338ca", fontStyle: "italic", lineHeight: 1.8 }}>"{analysis.scriptedExamples.whatToTry}"</p>
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
function CoachingView({ session }) {
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
      const reply = await generateCoachingReply(session, updated, confType);
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
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Coaching Conference</div>
            <div style={{ fontSize: 12, color: "var(--text-4)" }}>{session.meta.teacher} · {FRAMEWORKS[session.framework]?.shortName}</div>
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
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--text)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-2)"; }}>
                💬 {q}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ display: "flex", flexDirection: "column" }}>
        <Label>Conference Conversation</Label>
        <div ref={chatRef} style={{ minHeight: 200, maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {messages.length === 0 && <p style={{ fontSize: 12, color: "var(--text-5)", fontStyle: "italic" }}>Click a question above or type to begin the conference…</p>}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{ maxWidth: "80%", background: m.role==="user"?"var(--accent-soft)":"var(--surface-2)", border: `1px solid ${m.role==="user"?"#4f46e522":"var(--border)"}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: "var(--text-5)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>{m.role==="user"?"TEACHER":"COACH"}</div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75 }}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading && <div style={{ display:"flex",gap:8,alignItems:"center" }}><Spinner size={14}/><span style={{ fontSize:12,color:"var(--text-4)" }}>Coach is responding…</span></div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send(input)}
            placeholder="Type a teacher response or question…"
            style={{ flex:1, background:"var(--surface)", border:"1px solid var(--border-strong)", borderRadius:8, padding:"10px 14px", color:"var(--text)", fontSize:13, outline:"none", fontFamily:"inherit" }} />
          <Btn onClick={() => send(input)} disabled={loading||!input.trim()}>Send</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRINTABLE REPORT (PDF export via window.print() — see src/print.css)
// Always rendered while a session is active, kept invisible on screen and
// shown only inside @media print, so the "Download PDF" button just calls
// window.print() with no async work needed. Deliberately plain, static
// markup (no buttons, no hover states) — this is what actually prints.
// ─────────────────────────────────────────────────────────────────────────────
const REPORT_TYPE_LABEL = {
  formal: "Formal Summative Evaluation",
  teacher: "Teacher Feedback Letter",
  admin: "Admin / Principal Summary",
  growth: "PD Action Plan Memo",
};

function PrintSectionTitle({ children, color = "#0f172a" }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 5, borderBottom: "1px solid #e2e8f0" }}>
      {children}
    </div>
  );
}

function PrintableReport({ session, reportType, reportText }) {
  if (!session) return null;
  const { analysis, framework: fwKey, meta } = session;
  const fw = FRAMEWORKS[fwKey];
  const maxRating = Object.keys(fw.ratingScale).length;
  const overallRounded = analysis.overallRating ? Math.round(analysis.overallRating) : null;

  const domainAvgs = Object.entries(fw.domains).map(([dk, d]) => {
    const rated = Object.keys(d.components).map(c => analysis.evidence?.[c]?.rating).filter(Boolean);
    const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;
    return { dk, d, avg };
  });

  return (
    <div id="printable-report" className="printable-report">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #0f172a", paddingBottom: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="lens" size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>ClassroomLens <span style={{ color: "#4f46e5" }}>Pro</span></div>
            <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.08em" }}>CLASSROOM OBSERVATION REPORT</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#64748b" }}>Generated {new Date().toLocaleDateString()}</div>
      </div>

      {/* Observation details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20, fontSize: 11 }}>
        {[["Teacher", meta.teacher], ["Observer", meta.observer], ["School", meta.school],
          ["Grade", meta.grade], ["Subject", meta.subject], ["Date", meta.date],
          ["Framework", fw.name]].map(([l, v]) => (
          <div key={l}><strong style={{ color: "#475569" }}>{l}:</strong> <span style={{ color: "#0f172a" }}>{v || "—"}</span></div>
        ))}
      </div>

      {/* Overall rating */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 14, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", breakInside: "avoid" }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: fw.color, fontFamily: "'JetBrains Mono',monospace" }}>{analysis.overallRating?.toFixed(1) || "—"}</div>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.08em" }}>OVERALL RATING</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{overallRounded ? fw.ratingScale[overallRounded] : "—"}</div>
        </div>
      </div>

      {/* Narrative report, if one was generated on this tab */}
      {reportText && (
        <div style={{ marginBottom: 20, breakInside: "avoid" }}>
          <PrintSectionTitle>{REPORT_TYPE_LABEL[reportType] || "Report"}</PrintSectionTitle>
          <p style={{ fontSize: 11.5, color: "#1e293b", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{reportText}</p>
        </div>
      )}

      {/* Domain scores */}
      <div style={{ marginBottom: 20 }}>
        <PrintSectionTitle>Domain Scores</PrintSectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {domainAvgs.map(({ dk, d, avg }) => (
            <div key={dk} style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: 10, breakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: d.color }}>{dk} — {d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: d.color }}>{avg?.toFixed(1) || "—"}</span>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${Math.max((avg || 0) / maxRating * 100, 0)}%`, height: "100%", background: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths / Growth areas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20, breakInside: "avoid" }}>
        <div>
          <PrintSectionTitle color="#16a34a">Strengths</PrintSectionTitle>
          {(analysis.strengths || []).map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: "#334155", lineHeight: 1.7, marginBottom: 5 }}>• {s}</div>
          ))}
        </div>
        <div>
          <PrintSectionTitle color="#d97706">Growth Areas</PrintSectionTitle>
          {(analysis.growthAreas || []).map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: "#334155", lineHeight: 1.7, marginBottom: 5 }}>• {s}</div>
          ))}
        </div>
      </div>

      {/* Evidence by component */}
      <div style={{ marginBottom: 20 }}>
        <PrintSectionTitle>Evidence by Component</PrintSectionTitle>
        {Object.entries(fw.domains).map(([dk, d]) => {
          const comps = Object.entries(d.components).filter(([ck]) => analysis.evidence?.[ck]);
          if (!comps.length) return null;
          return (
            <div key={dk} style={{ marginBottom: 12, breakInside: "avoid" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: d.color, marginBottom: 6 }}>{dk} — {d.label}</div>
              {comps.map(([ck, cn]) => {
                const ev = analysis.evidence[ck];
                return (
                  <div key={ck} style={{ marginBottom: 8, paddingLeft: 10, borderLeft: `3px solid ${d.color}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>
                      {ck} {cn} {ev.rating && <span style={{ color: d.color, fontWeight: 800 }}>— {ev.rating} ({fw.ratingScale[ev.rating]})</span>}
                    </div>
                    {(ev.evidence || []).slice(0, 2).map((e, i) => (
                      <div key={i} style={{ fontSize: 10.5, color: "#475569", fontStyle: "italic", marginTop: 3 }}>❝ {e} ❞</div>
                    ))}
                    {ev.feedback && <div style={{ fontSize: 10.5, color: "#334155", marginTop: 3 }}>{ev.feedback}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Growth plan */}
      {analysis.growthPlan && (
        <div style={{ marginBottom: 20 }}>
          <PrintSectionTitle>Growth Plan</PrintSectionTitle>
          {[["Immediate (Next Class)", analysis.growthPlan.immediate],
            ["Short-Term (2 Weeks)", analysis.growthPlan.shortTerm],
            ["Long-Term", analysis.growthPlan.longTerm]].map(([label, items]) => (
            items?.length > 0 && (
              <div key={label} style={{ marginBottom: 8, breakInside: "avoid" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{label}</div>
                {items.map((s, i) => <div key={i} style={{ fontSize: 11, color: "#334155", lineHeight: 1.6, marginBottom: 3 }}>• {s}</div>)}
              </div>
            )
          ))}
        </div>
      )}

      {/* Scripted language examples */}
      {analysis.scriptedExamples && (
        <div style={{ marginBottom: 20, breakInside: "avoid" }}>
          <PrintSectionTitle>Scripted Language</PrintSectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>WHAT WORKED</div>
              <p style={{ fontSize: 11, color: "#334155", fontStyle: "italic", lineHeight: 1.7 }}>"{analysis.scriptedExamples.whatWorked}"</p>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", marginBottom: 4 }}>TRY NEXT TIME</div>
              <p style={{ fontSize: 11, color: "#334155", fontStyle: "italic", lineHeight: 1.7 }}>"{analysis.scriptedExamples.whatToTry}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Student intervention recommendations, if any */}
      {analysis.studentInterventions?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <PrintSectionTitle>Student Intervention Recommendations</PrintSectionTitle>
          {analysis.studentInterventions.map((item, i) => (
            <div key={i} style={{ marginBottom: 8, paddingLeft: 10, borderLeft: "3px solid #64748b", breakInside: "avoid" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{item.studentRef} <span style={{ fontWeight: 600, color: "#64748b" }}>({item.urgency} priority)</span></div>
              <div style={{ fontSize: 10.5, color: "#334155", marginTop: 2 }}><strong>Observed:</strong> {item.observation}</div>
              <div style={{ fontSize: 10.5, color: "#334155", marginTop: 2 }}><strong>Intervention:</strong> {item.intervention}</div>
              {item.strategy && <div style={{ fontSize: 10.5, color: "#334155", marginTop: 2 }}><strong>Strategy:</strong> {item.strategy}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Signatures */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36, paddingTop: 16, borderTop: "1px solid #cbd5e1", breakInside: "avoid" }}>
        <div style={{ fontSize: 10.5, color: "#334155" }}>Observer Signature: ________________________&nbsp;&nbsp;&nbsp;Date: ________</div>
        <div style={{ fontSize: 10.5, color: "#334155" }}>Teacher Signature: ________________________&nbsp;&nbsp;&nbsp;Date: ________</div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, textAlign: "center", fontSize: 9, color: "#94a3b8" }}>
        Generated by ClassroomLens Pro · support@classroomlens.com
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ReportView({ session }) {
  const [reportType, setReportType] = useState("formal");
  const [reportText, setReportText] = useState("");
  const [generating, setGenerating] = useState(false);

  if (!session) return <EmptyState icon="📄" text="Complete an observation to generate reports." />;
  const { meta, framework: fwKey } = session;
  const fw = FRAMEWORKS[fwKey];

  const generate = async () => {
    setGenerating(true); setReportText("");
    try {
      const text = await generateReport(session, reportType);
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
      "", "Generated by ClassroomLens Pro | support@classroomlens.com",
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
              style={{ background: reportType===k?"var(--accent-soft)":"var(--surface)", border: `1.5px solid ${reportType===k?"var(--accent)":"var(--border-strong)"}`, borderRadius: 9, padding: 12, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: reportType===k?"var(--accent)":"var(--text-2)" }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--text-5)", marginTop: 3 }}>{desc}</div>
            </div>
          ))}
        </div>
        <Btn onClick={generate} disabled={generating} full size="lg">
          {generating ? <span style={{ display:"flex",alignItems:"center",gap:10,justifyContent:"center" }}><Spinner />Generating…</span> : "📄 Generate Report"}
        </Btn>
      </Card>

      {reportText && (
        <Card style={{ borderTop: "3px solid var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <Label>Generated Report</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm" variant="outline" onClick={copy}>📋 Copy Full Report</Btn>
              <Btn size="sm" variant="outline" onClick={() => window.print()}>⬇ Download PDF</Btn>
            </div>
          </div>
          <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Classroom Observation Report</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {[["Teacher",meta.teacher],["Observer",meta.observer],["Date",meta.date],["School",meta.school],["Grade / Subject",`${meta.grade} · ${meta.subject}`],["Framework",fw.name]].map(([l,v]) => (
                <div key={l} style={{ fontSize: 11, color: "var(--text-4)" }}><strong style={{ color:"var(--text-3)" }}>{l}:</strong> {v || "—"}</div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{reportText}</p>
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, color: "var(--text-5)" }}>Observer Signature: ________________________  Date: ________</div>
            <div style={{ fontSize: 10, color: "var(--text-5)" }}>Teacher Signature: ________________________   Date: ________</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: "var(--text-faint)", textAlign: "center" }}>Generated by ClassroomLens Pro · support@classroomlens.com</div>
        </Card>
      )}

      <PrintableReport session={session} reportType={reportType} reportText={reportText} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IEP MEETING ANALYSIS (stateless — nothing is saved)
// ─────────────────────────────────────────────────────────────────────────────
const MEETING_TYPES = ["Initial Evaluation", "Annual Review", "Triennial Reevaluation", "Amendment", "Manifestation Determination"];
const IEP_STATUS_COLOR = { "on-track": "var(--success)", "needs-revision": "var(--warning)", "new": "var(--accent)", "unclear": "var(--text-4)" };
const IEP_FLAG_COLOR = { ok: "var(--success)", watch: "var(--warning)", missing: "var(--danger)" };

function IEPView({ onUsageChecked }) {
  const [meta, setMeta] = useState({ student: "", grade: "", date: new Date().toISOString().split("T")[0], meetingType: MEETING_TYPES[1], caseManager: "" });
  const [mode, setMode] = useState("manual");
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);

  const setMf = (k, v) => setMeta(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isRecording && !isPaused) timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    recognitionRef.current?.stop();
  }, []);

  const startRecording = async () => {
    setNotes(""); setRecTime(0); setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyzerNode = ctx.createAnalyser();
      analyzerNode.fftSize = 256;
      src.connect(analyzerNode);
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
        setNotes(final + interim);
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

  const analyze = async () => {
    const text = notes.trim();
    if (!text) { setErr("Please record or paste meeting notes first."); return; }
    if (text.split(" ").length < 15) { setErr("Notes are too short for a meaningful analysis."); return; }
    setErr(""); setLoading(true); setResult(null);

    // Counts against the same trial/plan limits as a classroom observation —
    // it's the same Claude spend on our shared key either way.
    let allowance;
    try {
      allowance = await checkObservationAllowance();
      onUsageChecked?.(allowance);
    } catch (e) {
      setErr("Couldn't verify your plan: " + e.message);
      setLoading(false);
      return;
    }
    if (!allowance.allowed) {
      setLoading(false);
      return; // parent shows the paywall via onUsageChecked
    }

    try {
      setResult(await analyzeIEPMeeting(text, meta));
    } catch (e) {
      setErr("Analysis failed: " + e.message);
    }
    setLoading(false);
  };

  const copy = () => {
    if (!result) return;
    const lines = [
      `IEP MEETING ANALYSIS`,
      `Student: ${meta.student || "—"} | Grade: ${meta.grade || "—"} | Date: ${meta.date}`,
      `Meeting Type: ${meta.meetingType} | Case Manager: ${meta.caseManager || "—"}`, "",
      `SUMMARY`, result.summary, "",
      `STUDENT STRENGTHS`, ...(result.studentStrengths||[]).map(s=>"• "+s), "",
      `STUDENT NEEDS`, ...(result.studentNeeds||[]).map(s=>"• "+s), "",
      `GOAL ALIGNMENT`, ...(result.goalAlignment||[]).map(g=>`• ${g.goal} [${g.status}] — ${g.note}`), "",
      `ACCOMMODATION RECOMMENDATIONS`, ...(result.accommodationRecommendations||[]).map(a=>`• ${a.accommodation} — ${a.rationale}`), "",
      `PARENT COMMUNICATION`, ...(result.parentCommunication||[]).map(s=>"• "+s), "",
      `COMPLIANCE NOTES (IDEA/FAPE)`, ...(result.complianceNotes||[]).map(c=>`• [${c.flag}] ${c.area} — ${c.note}`), "",
      `Generated by ClassroomLens Pro — not a substitute for legal or clinical review.`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    alert("Analysis copied to clipboard!");
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--accent-soft)", border: "1px solid #4f46e522", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--text-3)", display: "flex", gap: 8, alignItems: "center" }}>
        <Icon name="iep" size={15} />
        Nothing here is saved automatically — this analysis exists only in your browser. Copy anything you want to keep before navigating away.
      </div>

      <Card>
        <Label>Meeting Details</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <TextInput label="Student Name / Initials" value={meta.student} onChange={v => setMf("student", v)} />
          <TextInput label="Case Manager" value={meta.caseManager} onChange={v => setMf("caseManager", v)} />
          <TextInput label="Grade Level" value={meta.grade} onChange={v => setMf("grade", v)} />
          <TextInput label="Date" type="date" value={meta.date} onChange={v => setMf("date", v)} />
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 5, fontWeight: 600 }}>MEETING TYPE</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {MEETING_TYPES.map(t => (
                <button key={t} onClick={() => setMf("meetingType", t)}
                  style={{ background: meta.meetingType===t ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${meta.meetingType===t ? "var(--accent)" : "var(--border-strong)"}`,
                    color: meta.meetingType===t ? "var(--accent)" : "var(--text-3)", borderRadius: 6, padding: "6px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <Label>Meeting Notes</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant={mode==="manual"?"primary":"ghost"} size="sm" onClick={() => setMode("manual")}>✏️ Paste Notes</Btn>
            <Btn variant={mode==="live"?"primary":"ghost"} size="sm" onClick={() => setMode("live")}>🎙 Live Recording</Btn>
          </div>
        </div>

        {mode === "live" ? (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0 4px", background: "var(--surface-2)", borderRadius: 10 }}>
              <Waveform active={isRecording && !isPaused} level={audioLevel} />
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="rec-pulse" style={{ width: 9, height: 9, background: "var(--danger)", borderRadius: "50%" }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: "var(--danger)", fontWeight: 600 }}>{fmtTime(recTime)}</span>
                  {isPaused && <Chip label="Paused" color="var(--warning)" />}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
                {!isRecording
                  ? <Btn size="lg" onClick={startRecording}>⏺ Start Recording</Btn>
                  : <>
                      <Btn variant="ghost" onClick={togglePause}>{isPaused ? "▶ Resume" : "⏸ Pause"}</Btn>
                      <Btn variant="danger" onClick={stopRecording}>⏹ Stop</Btn>
                    </>}
              </div>
            </div>
            {notes && (
              <div style={{ marginTop: 14, background: "var(--surface-2)", borderRadius: 8, padding: 14, maxHeight: 220, overflowY: "auto" }}>
                <Label>Live Notes</Label>
                <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{notes}</p>
              </div>
            )}
          </div>
        ) : (
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={12}
            placeholder={`Paste your IEP meeting notes here.\n\nInclude what you can:\n  • Present levels of performance discussed\n  • Goals reviewed and proposed changes\n  • Accommodations/modifications discussed\n  • Parent/guardian input and questions\n  • Any decisions or next steps`}
            style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9, padding: 14, color: "var(--text)", fontSize: 13, lineHeight: 1.85, outline: "none" }} />
        )}
      </Card>

      {err && <div style={{ background: "var(--danger-soft)", border: "1px solid #dc262622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--danger)" }}>{err}</div>}

      <Btn onClick={analyze} disabled={loading} full size="lg">
        {loading ? <span style={{ display:"flex",alignItems:"center",gap:12,justifyContent:"center" }}><Spinner />Analyzing meeting notes…</span> : "⚡ Analyze IEP Meeting"}
      </Btn>

      {result && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ borderTop: "3px solid var(--accent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{meta.student || "Student"} — {meta.meetingType}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3 }}>{meta.date}{meta.caseManager && ` · Case Manager: ${meta.caseManager}`}</div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, marginTop: 12 }}>{result.summary}</p>
              </div>
              <Btn size="sm" variant="outline" onClick={copy}>📋 Copy Analysis</Btn>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card accent="#16a34a">
              <Label color="var(--success)">Student Strengths</Label>
              {(result.studentStrengths||[]).map((s,i) => <div key={i} style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #16a34a33" }}>{s}</div>)}
              {!result.studentStrengths?.length && <p style={{ fontSize: 12, color: "var(--text-5)" }}>None noted.</p>}
            </Card>
            <Card accent="#d97706">
              <Label color="var(--warning)">Student Needs</Label>
              {(result.studentNeeds||[]).map((s,i) => <div key={i} style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #d9770633" }}>{s}</div>)}
              {!result.studentNeeds?.length && <p style={{ fontSize: 12, color: "var(--text-5)" }}>None noted.</p>}
            </Card>
          </div>

          {result.goalAlignment?.length > 0 && (
            <Card>
              <Label>Goal Alignment</Label>
              {result.goalAlignment.map((g,i) => (
                <div key={i} style={{ background: "var(--surface-2)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{g.goal}</span>
                    <Chip label={g.status} color={IEP_STATUS_COLOR[g.status] || "var(--text-4)"} />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>{g.note}</p>
                </div>
              ))}
            </Card>
          )}

          {result.accommodationRecommendations?.length > 0 && (
            <Card>
              <Label>Accommodation Recommendations</Label>
              {result.accommodationRecommendations.map((a,i) => (
                <div key={i} style={{ background: "var(--surface-2)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{a.accommodation}</div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>{a.rationale}</p>
                </div>
              ))}
            </Card>
          )}

          {result.parentCommunication?.length > 0 && (
            <Card>
              <Label>Parent Communication Suggestions</Label>
              {result.parentCommunication.map((s,i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0, fontWeight: 800 }}>▸</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{s}</span>
                </div>
              ))}
            </Card>
          )}

          {result.complianceNotes?.length > 0 && (
            <Card accent="#dc2626">
              <Label color="var(--danger)">Compliance Notes (IDEA / FAPE)</Label>
              {result.complianceNotes.map((c,i) => (
                <div key={i} style={{ background: "var(--surface-2)", borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: `3px solid ${IEP_FLAG_COLOR[c.flag] || "var(--text-4)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{c.area}</span>
                    <Chip label={c.flag} color={IEP_FLAG_COLOR[c.flag] || "var(--text-4)"} />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>{c.note}</p>
                </div>
              ))}
              <p style={{ fontSize: 10, color: "var(--text-5)", marginTop: 4 }}>This is AI-assisted support for your own review — not a substitute for legal or clinical judgment.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLC MEETING ANALYZER (stateless — nothing is saved)
// ─────────────────────────────────────────────────────────────────────────────
const PLC_STATUS_COLOR = { aligned: "var(--success)", partial: "var(--warning)", unclear: "var(--text-4)" };
const PLC_FLAG_COLOR = { strong: "var(--success)", watch: "var(--warning)", concern: "var(--danger)" };

function PLCView({ onUsageChecked }) {
  const [meta, setMeta] = useState({ topic: "", team: "", facilitator: "", date: new Date().toISOString().split("T")[0] });
  const [mode, setMode] = useState("manual");
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);

  const setMf = (k, v) => setMeta(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isRecording && !isPaused) timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    recognitionRef.current?.stop();
  }, []);

  const startRecording = async () => {
    setNotes(""); setRecTime(0); setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyzerNode = ctx.createAnalyser();
      analyzerNode.fftSize = 256;
      src.connect(analyzerNode);
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
        setNotes(final + interim);
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

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md|markdown)$/i.test(file.name)) {
      setErr("Only .txt or .md files can be uploaded directly — for other formats, paste the transcript text instead.");
      return;
    }
    setErr("");
    const reader = new FileReader();
    reader.onload = () => setNotes(String(reader.result || ""));
    reader.readAsText(file);
  };

  const analyze = async () => {
    const text = notes.trim();
    if (!text) { setErr("Please record, paste, or upload meeting notes first."); return; }
    if (text.split(" ").length < 15) { setErr("This looks too short for a meaningful analysis."); return; }
    setErr(""); setLoading(true); setResult(null);

    // Counts against the same trial/plan limits as a classroom observation —
    // it's the same Claude spend on our shared key either way.
    let allowance;
    try {
      allowance = await checkObservationAllowance();
      onUsageChecked?.(allowance);
    } catch (e) {
      setErr("Couldn't verify your plan: " + e.message);
      setLoading(false);
      return;
    }
    if (!allowance.allowed) {
      setLoading(false);
      return; // parent shows the paywall via onUsageChecked
    }

    try {
      setResult(await analyzePLCMeeting(text, meta));
    } catch (e) {
      setErr("Analysis failed: " + e.message);
    }
    setLoading(false);
  };

  const copy = () => {
    if (!result) return;
    const lines = [
      `PLC MEETING ANALYSIS`,
      `Topic: ${meta.topic || "—"} | Team: ${meta.team || "—"} | Date: ${meta.date}`,
      `Facilitator: ${meta.facilitator || "—"}`, "",
      `SUMMARY`, result.summary, "",
      `KEY DECISIONS`, ...(result.keyDecisions||[]).map(s=>"• "+s), "",
      `ACTION ITEMS`, ...(result.actionItems||[]).map(a=>`• ${a.item} — Owner: ${a.owner} — Due: ${a.timeline}`), "",
      `COLLABORATIVE INQUIRY / DATA-DRIVEN DISCUSSION`, ...(result.collaborativeInquiryEvidence||[]).map(s=>"• "+s), "",
      `TEACHER LEARNING GOALS`, ...(result.teacherLearningGoals||[]).map(s=>"• "+s), "",
      `STUDENT LEARNING NEEDS`, ...(result.studentLearningNeeds||[]).map(s=>"• "+s), "",
      `FOLLOW-UP FOR NEXT MEETING`, ...(result.followUpRecommendations||[]).map(s=>"• "+s), "",
      `ALIGNMENT TO IMPROVEMENT GOALS [${result.goalAlignment?.status || "unclear"}]`, result.goalAlignment?.note || "", "",
      `NORMS ADHERENCE`, ...(result.normsObservations||[]).map(n=>`• [${n.flag}] ${n.area} — ${n.note}`), "",
      `Generated by ClassroomLens Pro`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    alert("Analysis copied to clipboard!");
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--accent-soft)", border: "1px solid #4f46e522", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--text-3)", display: "flex", gap: 8, alignItems: "center" }}>
        <Icon name="plc" size={15} />
        Nothing here is saved automatically — this analysis exists only in your browser. Copy anything you want to keep before navigating away.
      </div>

      <Card>
        <Label>Meeting Details</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <TextInput label="Meeting Topic / Focus" value={meta.topic} onChange={v => setMf("topic", v)} />
          <TextInput label="Team / Grade-Subject" value={meta.team} onChange={v => setMf("team", v)} />
          <TextInput label="Facilitator" value={meta.facilitator} onChange={v => setMf("facilitator", v)} />
          <TextInput label="Date" type="date" value={meta.date} onChange={v => setMf("date", v)} />
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <Label>Meeting Notes</Label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn variant={mode==="manual"?"primary":"ghost"} size="sm" onClick={() => setMode("manual")}>✏️ Paste / Type</Btn>
            <Btn variant={mode==="live"?"primary":"ghost"} size="sm" onClick={() => setMode("live")}>🎙 Live Recording</Btn>
            <Btn variant={mode==="transcript"?"primary":"ghost"} size="sm" onClick={() => setMode("transcript")}>📝 Upload Transcript</Btn>
            {mode === "transcript" && <input ref={fileRef} type="file" accept=".txt,.md,.markdown" onChange={handleFile} style={{ display: "none" }} />}
          </div>
        </div>

        {mode === "live" ? (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0 4px", background: "var(--surface-2)", borderRadius: 10 }}>
              <Waveform active={isRecording && !isPaused} level={audioLevel} />
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="rec-pulse" style={{ width: 9, height: 9, background: "var(--danger)", borderRadius: "50%" }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: "var(--danger)", fontWeight: 600 }}>{fmtTime(recTime)}</span>
                  {isPaused && <Chip label="Paused" color="var(--warning)" />}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
                {!isRecording
                  ? <Btn size="lg" onClick={startRecording}>⏺ Start Recording</Btn>
                  : <>
                      <Btn variant="ghost" onClick={togglePause}>{isPaused ? "▶ Resume" : "⏸ Pause"}</Btn>
                      <Btn variant="danger" onClick={stopRecording}>⏹ Stop</Btn>
                    </>}
              </div>
            </div>
            {notes && (
              <div style={{ marginTop: 14, background: "var(--surface-2)", borderRadius: 8, padding: 14, maxHeight: 220, overflowY: "auto" }}>
                <Label>Live Transcript</Label>
                <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{notes}</p>
              </div>
            )}
            {!notes && !isRecording && (
              <p style={{ fontSize: 12, color: "var(--text-5)", textAlign: "center", marginTop: 8 }}>Press Start to record the meeting live. Transcript will appear as the team talks.</p>
            )}
          </div>
        ) : mode === "transcript" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <Btn variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>⬆ Upload .txt / .md</Btn>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={12}
              placeholder={`Paste a pre-written transcript with speaker labels, or upload a .txt/.md file above.\n\nExample:\nFacilitator: Let's start with our 5th grade math data from the last unit assessment.\nTeacher A: About 60% of students hit the target on fractions, but subtraction with regrouping is still a gap.\nTeacher B: I'm seeing the same pattern in my class — want to try a shared reteach block next week?`}
              style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9, padding: 14, color: "var(--text)", fontSize: 13, lineHeight: 1.85, outline: "none" }} />
          </div>
        ) : (
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={12}
            placeholder={`Paste your meeting notes or agenda here.\n\nInclude what you can:\n  • Data reviewed and what it showed\n  • Decisions made and why\n  • Action items and who owns them\n  • Questions or concerns raised\n  • Next steps`}
            style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9, padding: 14, color: "var(--text)", fontSize: 13, lineHeight: 1.85, outline: "none" }} />
        )}
      </Card>

      {err && <div style={{ background: "var(--danger-soft)", border: "1px solid #dc262622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--danger)" }}>{err}</div>}

      <Btn onClick={analyze} disabled={loading} full size="lg">
        {loading ? <span style={{ display:"flex",alignItems:"center",gap:12,justifyContent:"center" }}><Spinner />Analyzing PLC meeting…</span> : "⚡ Analyze PLC Meeting"}
      </Btn>

      {result && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ borderTop: "3px solid var(--accent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{meta.topic || "PLC Meeting"}{meta.team && ` — ${meta.team}`}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3 }}>{meta.date}{meta.facilitator && ` · Facilitator: ${meta.facilitator}`}</div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, marginTop: 12 }}>{result.summary}</p>
              </div>
              <Btn size="sm" variant="outline" onClick={copy}>📋 Copy Analysis</Btn>
            </div>
          </Card>

          {result.keyDecisions?.length > 0 && (
            <Card>
              <Label>Key Decisions</Label>
              {result.keyDecisions.map((s,i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0, fontWeight: 800 }}>▸</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{s}</span>
                </div>
              ))}
            </Card>
          )}

          {result.actionItems?.length > 0 && (
            <Card>
              <Label>Action Items</Label>
              {result.actionItems.map((a,i) => (
                <div key={i} style={{ background: "var(--surface-2)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{a.item}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Chip label={`Owner: ${a.owner}`} color="var(--accent)" />
                    <Chip label={`Due: ${a.timeline}`} color="var(--text-4)" />
                  </div>
                </div>
              ))}
            </Card>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card accent="#16a34a">
              <Label color="var(--success)">Teacher Learning Goals</Label>
              {(result.teacherLearningGoals||[]).map((s,i) => <div key={i} style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #16a34a33" }}>{s}</div>)}
              {!result.teacherLearningGoals?.length && <p style={{ fontSize: 12, color: "var(--text-5)" }}>None noted.</p>}
            </Card>
            <Card accent="#d97706">
              <Label color="var(--warning)">Student Learning Needs</Label>
              {(result.studentLearningNeeds||[]).map((s,i) => <div key={i} style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #d9770633" }}>{s}</div>)}
              {!result.studentLearningNeeds?.length && <p style={{ fontSize: 12, color: "var(--text-5)" }}>None noted.</p>}
            </Card>
          </div>

          {result.collaborativeInquiryEvidence?.length > 0 && (
            <Card>
              <Label>Evidence of Collaborative Inquiry & Data-Driven Discussion</Label>
              {result.collaborativeInquiryEvidence.map((e,i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text-3)", background: "var(--surface-2)", borderRadius: 5, padding: "7px 12px", marginBottom: 6, lineHeight: 1.6 }}>❝ {e}</div>
              ))}
            </Card>
          )}

          {result.goalAlignment && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                <Label>Alignment to School / District Improvement Goals</Label>
                <Chip label={result.goalAlignment.status} color={PLC_STATUS_COLOR[result.goalAlignment.status] || "var(--text-4)"} />
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>{result.goalAlignment.note}</p>
            </Card>
          )}

          {result.followUpRecommendations?.length > 0 && (
            <Card accent="#4f46e5">
              <Label color="var(--accent)">Follow-Up for Next PLC Meeting</Label>
              {result.followUpRecommendations.map((s,i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0, fontWeight: 800 }}>▸</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{s}</span>
                </div>
              ))}
            </Card>
          )}

          {result.normsObservations?.length > 0 && (
            <Card>
              <Label>Norms Adherence Observations</Label>
              {result.normsObservations.map((n,i) => (
                <div key={i} style={{ background: "var(--surface-2)", borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: `3px solid ${PLC_FLAG_COLOR[n.flag] || "var(--text-4)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{n.area}</span>
                    <Chip label={n.flag} color={PLC_FLAG_COLOR[n.flag] || "var(--text-4)"} />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>{n.note}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON PLAN ANALYZER (stateless — nothing is saved)
// ─────────────────────────────────────────────────────────────────────────────
const DIMENSION_LABELS = {
  standardsAlignment: "Standards Alignment",
  instructionalDesign: "Instructional Design",
  differentiation: "Differentiation",
  assessmentStrategy: "Assessment Strategy",
};
const DIMENSION_RATING_LABEL = { 1: "Needs Work", 2: "Developing", 3: "Solid", 4: "Strong" };

function LessonPlanView({ onUsageChecked }) {
  const [meta, setMeta] = useState({ title: "", grade: "", subject: "" });
  const [framework, setFramework] = useState("danielson");
  const [mode, setMode] = useState("manual");
  const [planText, setPlanText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);

  const setMf = (k, v) => setMeta(p => ({ ...p, [k]: v }));
  const fw = FRAMEWORKS[framework];

  useEffect(() => {
    if (isRecording && !isPaused) timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    recognitionRef.current?.stop();
  }, []);

  const startRecording = async () => {
    setPlanText(""); setRecTime(0); setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyzerNode = ctx.createAnalyser();
      analyzerNode.fftSize = 256;
      src.connect(analyzerNode);
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
        setPlanText(final + interim);
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

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md|markdown)$/i.test(file.name)) {
      setErr("Only .txt or .md files can be uploaded directly — for PDF or Word docs, copy and paste the text instead.");
      return;
    }
    setErr("");
    const reader = new FileReader();
    reader.onload = () => setPlanText(String(reader.result || ""));
    reader.readAsText(file);
  };

  const analyze = async () => {
    const text = planText.trim();
    if (!text) { setErr("Please paste or upload a lesson plan first."); return; }
    if (text.split(" ").length < 20) { setErr("This looks too short to be a full lesson plan."); return; }
    setErr(""); setLoading(true); setResult(null);

    // Counts against the same trial/plan limits as a classroom observation —
    // it's the same Claude spend on our shared key either way.
    let allowance;
    try {
      allowance = await checkObservationAllowance();
      onUsageChecked?.(allowance);
    } catch (e) {
      setErr("Couldn't verify your plan: " + e.message);
      setLoading(false);
      return;
    }
    if (!allowance.allowed) {
      setLoading(false);
      return; // parent shows the paywall via onUsageChecked
    }

    try {
      setResult(await analyzeLessonPlan(text, framework));
    } catch (e) {
      setErr("Analysis failed: " + e.message);
    }
    setLoading(false);
  };

  const copy = () => {
    if (!result) return;
    const lines = [
      `LESSON PLAN ANALYSIS — ${fw.shortName}`,
      `${meta.title || "Untitled Lesson"}${meta.subject ? " · " + meta.subject : ""}${meta.grade ? " · Gr " + meta.grade : ""}`, "",
      `SUMMARY`, result.summary, "",
      ...Object.entries(result.dimensions || {}).flatMap(([k, d]) => [`${(DIMENSION_LABELS[k]||k).toUpperCase()} — ${DIMENSION_RATING_LABEL[d.rating]||d.rating}`, d.notes, ""]),
      `SUGGESTIONS FOR IMPROVEMENT`, ...(result.suggestions||[]).map(s=>"• "+s), "",
      `Generated by ClassroomLens Pro`,
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    alert("Analysis copied to clipboard!");
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <Label>Lesson Details</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <TextInput label="Lesson Title / Topic" value={meta.title} onChange={v => setMf("title", v)} />
          <TextInput label="Subject" value={meta.subject} onChange={v => setMf("subject", v)} />
          <TextInput label="Grade Level" value={meta.grade} onChange={v => setMf("grade", v)} />
        </div>
      </Card>

      <Card>
        <Label>Evaluation Framework</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {Object.entries(FRAMEWORKS).map(([key, f]) => (
            <div key={key} onClick={() => setFramework(key)}
              style={{ background: framework===key ? f.color+"12" : "var(--surface)", border: `1.5px solid ${framework===key ? f.color : "var(--border-strong)"}`,
                borderRadius: 9, padding: "12px 10px", cursor: "pointer", textAlign: "center", transition: "all .15s", boxShadow: framework===key ? "var(--shadow-sm)" : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: framework===key ? f.color : "var(--text-3)" }}>{f.shortName}</div>
              <div style={{ fontSize: 9, color: "var(--text-5)", marginTop: 3 }}>v{f.version}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <Label>Lesson Plan</Label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn variant={mode==="manual"?"primary":"ghost"} size="sm" onClick={() => setMode("manual")}>✏️ Paste / Type</Btn>
            <Btn variant={mode==="live"?"primary":"ghost"} size="sm" onClick={() => setMode("live")}>🎙 Live Recording</Btn>
            {mode === "manual" && <Btn variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>⬆ Upload .txt / .md</Btn>}
            <input ref={fileRef} type="file" accept=".txt,.md,.markdown" onChange={handleFile} style={{ display: "none" }} />
          </div>
        </div>

        {mode === "live" ? (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0 4px", background: "var(--surface-2)", borderRadius: 10 }}>
              <Waveform active={isRecording && !isPaused} level={audioLevel} />
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="rec-pulse" style={{ width: 9, height: 9, background: "var(--danger)", borderRadius: "50%" }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: "var(--danger)", fontWeight: 600 }}>{fmtTime(recTime)}</span>
                  {isPaused && <Chip label="Paused" color="var(--warning)" />}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
                {!isRecording
                  ? <Btn size="lg" onClick={startRecording}>⏺ Start Recording</Btn>
                  : <>
                      <Btn variant="ghost" onClick={togglePause}>{isPaused ? "▶ Resume" : "⏸ Pause"}</Btn>
                      <Btn variant="danger" onClick={stopRecording}>⏹ Stop</Btn>
                    </>}
              </div>
            </div>
            {planText && (
              <div style={{ marginTop: 14, background: "var(--surface-2)", borderRadius: 8, padding: 14, maxHeight: 220, overflowY: "auto" }}>
                <Label>Live Transcript</Label>
                <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{planText}</p>
              </div>
            )}
            {!planText && !isRecording && (
              <p style={{ fontSize: 12, color: "var(--text-5)", textAlign: "center", marginTop: 8 }}>Press Start and talk through your lesson plan — objectives, activities, differentiation, assessment. Transcript will appear live.</p>
            )}
          </div>
        ) : (
          <div>
            <textarea value={planText} onChange={e => setPlanText(e.target.value)} rows={14}
              placeholder={`Paste your lesson plan here, or upload a .txt/.md file above.\n\nInclude what you can:\n  • Objectives / standards addressed\n  • Warm-up, instruction, guided/independent practice, closure\n  • Materials and resources\n  • Differentiation and accommodations\n  • Assessment / checks for understanding`}
              style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9, padding: 14, color: "var(--text)", fontSize: 13, lineHeight: 1.85, outline: "none" }} />
            <div style={{ fontSize: 11, color: "var(--text-5)", marginTop: 6, textAlign: "right" }}>{planText.split(" ").filter(Boolean).length} words</div>
          </div>
        )}
      </Card>

      {err && <div style={{ background: "var(--danger-soft)", border: "1px solid #dc262622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--danger)" }}>{err}</div>}

      <Btn onClick={analyze} disabled={loading} full size="lg">
        {loading ? <span style={{ display:"flex",alignItems:"center",gap:12,justifyContent:"center" }}><Spinner />Analyzing against {fw.shortName}…</span> : `⚡ Analyze Lesson Plan — ${fw.shortName} Framework`}
      </Btn>

      {result && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ borderTop: `3px solid ${fw.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <Chip label={fw.shortName} color={fw.color} size="md" />
                  {meta.subject && <Chip label={meta.subject} color="var(--text-4)" size="md" />}
                  {meta.grade && <Chip label={`Gr ${meta.grade}`} color="var(--text-4)" size="md" />}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{meta.title || "Lesson Plan"}</div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, marginTop: 10 }}>{result.summary}</p>
              </div>
              <Btn size="sm" variant="outline" onClick={copy}>📋 Copy Analysis</Btn>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {Object.entries(result.dimensions || {}).map(([k, d]) => (
              <Card key={k}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 700 }}>{DIMENSION_LABELS[k] || k}</div>
                  <Chip label={DIMENSION_RATING_LABEL[d.rating] || d.rating} color={ratingColor(d.rating)} />
                </div>
                <RatingBar value={d.rating || 0} max={4} color={ratingColor(d.rating)} />
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.65, marginTop: 10 }}>{d.notes}</p>
                {d.opportunities?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {d.opportunities.map((o,i) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--text-3)", background: "var(--surface-2)", borderRadius: 5, padding: "5px 10px", marginBottom: 4, lineHeight: 1.6 }}>▸ {o}</div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {result.suggestions?.length > 0 && (
            <Card accent="#4f46e5">
              <Label color="var(--accent)">Suggestions for Improvement</Label>
              {result.suggestions.map((s,i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0, fontWeight: 800 }}>▸</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{s}</span>
                </div>
              ))}
            </Card>
          )}

          {result.evidence && Object.keys(result.evidence).length > 0 && (
            <Card>
              <Label>Framework Mapping — {fw.shortName}</Label>
              <FrameworkEvidenceBlock fw={fw} evidence={result.evidence} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardView({ sessions, onSelect, onNew }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? sessions : sessions.filter(s => s.framework === filter);
  const avgOverall = sessions.length ? (sessions.reduce((a,s) => a + (s.analysis?.overallRating||0), 0) / sessions.length).toFixed(2) : "—";
  const needsSupport = sessions.filter(s => s.analysis?.overallRating && s.analysis.overallRating < 2.5);
  const teachers = [...new Set(sessions.map(s => s.meta.teacher).filter(Boolean))];
  const recent = [...sessions].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  if (sessions.length === 0) {
    return (
      <div className="fade-up">
        <Card style={{ textAlign: "center", padding: "64px 32px" }}>
          <div style={{ width: 52, height: 52, background: "var(--accent-soft)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <Icon name="dashboard" size={24} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Welcome to ClassroomLens Pro</div>
          <p style={{ fontSize: 13, color: "var(--text-4)", maxWidth: 420, margin: "0 auto 22px", lineHeight: 1.7 }}>
            Your dashboard will fill in with school-wide trends once you've logged your first observation.
          </p>
          <Btn size="lg" onClick={onNew}>+ New Observation</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Observations", value: sessions.length, color: "#4f46e5", icon: "report" },
          { label: "School Average", value: avgOverall, color: "#16a34a", icon: "growth" },
          { label: "Needs Support", value: needsSupport.length, color: "#dc2626", icon: "coaching" },
          { label: "Teachers Observed", value: teachers.length, color: "#d97706", icon: "sessions" },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ width: 34, height: 34, background: s.color + "14", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, marginBottom: 12 }}>
              <Icon name={s.icon} size={17} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Framework breakdown */}
        <Card>
          <Label>Observations by Framework</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px,1fr))", gap: 8 }}>
            {Object.entries(FRAMEWORKS).map(([fk, f]) => {
              const count = sessions.filter(s => s.framework === fk).length;
              const rated = sessions.filter(s => s.framework === fk && s.analysis?.overallRating);
              const avg = rated.length ? (rated.reduce((a,s) => a+s.analysis.overallRating,0)/rated.length).toFixed(1) : "—";
              return (
                <div key={fk} style={{ background: "var(--surface-2)", borderRadius: 9, padding: 12, borderTop: `3px solid ${f.color}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: f.color }}>{f.shortName}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{count}</div>
                  <div style={{ fontSize: 10, color: "var(--text-4)" }}>obs · avg {avg}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <Label>Recent Observations</Label>
          {recent.length === 0
            ? <p style={{ fontSize: 12, color: "var(--text-5)" }}>No observations yet.</p>
            : recent.map(s => {
                const fw = FRAMEWORKS[s.framework];
                return (
                  <div key={s.id} onClick={() => onSelect(s)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "9px 8px", borderRadius: 7, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.meta.teacher || "Untitled"}</div>
                      <div style={{ fontSize: 10, color: "var(--text-5)" }}>{fw?.shortName} · {s.meta.date}</div>
                    </div>
                    {s.analysis?.overallRating && <Chip label={s.analysis.overallRating.toFixed(1)} color={ratingColor(Math.round(s.analysis.overallRating))} />}
                  </div>
                );
              })}
        </Card>
      </div>

      {/* Needs support */}
      {needsSupport.length > 0 && (
        <Card accent="#dc2626">
          <Label color="var(--danger)">Teachers Needing Support (Rating Below 2.5)</Label>
          {needsSupport.map(s => {
            const fw = FRAMEWORKS[s.framework];
            return (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", borderRadius: 7, padding: "10px 12px", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{s.meta.teacher}</span>
                  <span style={{ color: "var(--text-4)", fontSize: 11, marginLeft: 8 }}>{s.meta.subject} · Gr {s.meta.grade}</span>
                  <span style={{ color: "var(--text-5)", fontSize: 10, marginLeft: 8 }}>{s.meta.date}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Chip label={fw?.shortName} color={fw?.color} />
                  <span style={{ fontWeight: 800, color: "var(--danger)", fontFamily: "'JetBrains Mono',monospace" }}>{s.analysis.overallRating?.toFixed(1)}</span>
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
          ? <p style={{ fontSize: 12, color: "var(--text-5)", textAlign: "center", padding: 30 }}>No observations match this filter.</p>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Teacher","Subject","Grade","Date","Framework","Rating","Overall","Observer"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "var(--text-4)", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const fw = FRAMEWORKS[s.framework];
                    const r = s.analysis?.overallRating;
                    return (
                      <tr key={s.id} onClick={() => onSelect(s)} style={{ borderBottom: "1px solid var(--border)", transition: "background .1s", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background="var(--surface-2)"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"10px 10px",color:"var(--text)",fontWeight:600 }}>{s.meta.teacher || "—"}</td>
                        <td style={{ padding:"10px 10px",color:"var(--text-3)" }}>{s.meta.subject || "—"}</td>
                        <td style={{ padding:"10px 10px",color:"var(--text-3)" }}>{s.meta.grade || "—"}</td>
                        <td style={{ padding:"10px 10px",color:"var(--text-3)" }}>{s.meta.date}</td>
                        <td style={{ padding:"10px 10px" }}><Chip label={fw?.shortName} color={fw?.color} /></td>
                        <td style={{ padding:"10px 10px" }}>{r ? <Chip label={fw?.ratingScale[Math.round(r)]} color={ratingColor(Math.round(r))} /> : "—"}</td>
                        <td style={{ padding:"10px 10px",fontWeight:800,color:r?ratingColor(Math.round(r)):"var(--text-5)",fontFamily:"'JetBrains Mono',monospace" }}>{r?.toFixed(1) || "—"}</td>
                        <td style={{ padding:"10px 10px",color:"var(--text-3)" }}>{s.meta.observer || "—"}</td>
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
function SessionsList({ sessions, loading, currentUserId, onSelect, onDelete }) {
  if (loading) return <EmptyState icon="⏳" text="Loading your sessions from the cloud…" />;
  if (sessions.length === 0) return <EmptyState icon="📁" text="No saved sessions yet. Complete your first observation." />;
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: "var(--text-5)", marginBottom: 4 }}>{sessions.length} saved session{sessions.length!==1?"s":""} · synced to your account</div>
      {sessions.map(s => {
        const fw = FRAMEWORKS[s.framework];
        return (
          <div key={s.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, boxShadow: "var(--shadow-sm)", transition: "border-color .15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor=fw.color}
            onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
              <div style={{ cursor: "pointer", flex: 1 }} onClick={() => onSelect(s)}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{s.meta.teacher || "Unknown Teacher"}</span>
                  <Chip label={fw.shortName} color={fw.color} />
                  {s.analysis?.overallRating && <Chip label={`${s.analysis.overallRating.toFixed(1)} — ${fw.ratingScale[Math.round(s.analysis.overallRating)]}`} color={ratingColor(Math.round(s.analysis.overallRating))} />}
                </div>
                <div style={{ color: "var(--text-4)", fontSize: 11, marginTop: 3 }}>{s.meta.subject} · Gr {s.meta.grade} · {s.meta.school}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Btn size="sm" variant="outline" onClick={() => onSelect(s)}>View</Btn>
                {(!currentUserId || s.userId === currentUserId) && (
                  <Btn size="sm" variant="danger" onClick={() => { if(confirm("Delete this session?")) onDelete(s.id); }}>✕</Btn>
                )}
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.55 }}>{s.analysis?.summary?.slice(0,120)}…</p>
            <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 8 }}>{s.timestamp}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS VIEW
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_LABEL = { trial: "No Plan Selected", monthly: "Monthly", annual: "Annual" };

function SettingsView({ onClearSessions, sessionCount, legacyCount, onImportLegacy, billing, onOpenPricing }) {
  const [importing, setImporting] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalErr, setPortalErr] = useState("");

  const manageSubscription = async () => {
    setPortalLoading(true); setPortalErr("");
    try {
      await openBillingPortal(); // redirects on success
    } catch (e) {
      setPortalErr(e.message);
      setPortalLoading(false);
    }
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ borderTop: "3px solid var(--accent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <Label>Plan & Billing</Label>
          <Chip label={PLAN_LABEL[billing?.plan] || "No Plan Selected"} color={billing?.plan === "annual" ? "var(--accent)" : billing?.plan === "monthly" ? "var(--success)" : "var(--text-4)"} size="md" />
        </div>

        {(!billing || billing.plan === "trial") && (
          <>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14 }}>
              No active plan yet.
            </p>
            <Btn onClick={onOpenPricing}>View Plans</Btn>
          </>
        )}

        {billing?.plan === "monthly" && (
          <>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14 }}>
              $9.99/month, unlimited observations. <strong>{billing.billing_period_observations}</strong> analyzed so far.
            </p>
            <Btn onClick={manageSubscription} disabled={portalLoading}>
              {portalLoading ? <span style={{ display:"flex",gap:8,alignItems:"center" }}><Spinner size={14}/>Opening…</span> : "Manage Subscription"}
            </Btn>
          </>
        )}

        {billing?.plan === "annual" && (
          <>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14 }}>
              $59.99/year, unlimited observations. <strong>{billing.billing_period_observations}</strong> analyzed so far.
            </p>
            <Btn onClick={manageSubscription} disabled={portalLoading}>
              {portalLoading ? <span style={{ display:"flex",gap:8,alignItems:"center" }}><Spinner size={14}/>Opening…</span> : "Manage Subscription"}
            </Btn>
          </>
        )}

        {billing?.subscription_status === "past_due" && (
          <div style={{ background: "var(--warning-soft)", border: "1px solid #d9770622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--warning)", marginTop: 12 }}>
            Your last payment failed. Update your payment method via "Manage Subscription" to avoid losing access.
          </div>
        )}
        {portalErr && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 10 }}>{portalErr}</p>}

        <p style={{ fontSize: 11, color: "var(--text-5)", marginTop: 14 }}>
          Need a District plan for multiple schools? <a href="mailto:support@classroomlens.com?subject=District%20Plan%20Inquiry" style={{ color: "var(--accent)" }}>Customer Support →</a>
        </p>
      </Card>

      <Card>
        <Label>Data & Sessions</Label>
        <p style={{ fontSize:12,color:"var(--text-3)",marginBottom:14 }}>{sessionCount} sessions saved to your account in the cloud.</p>
        <div style={{ display:"flex",gap:10 }}>
          <Btn variant="danger" onClick={() => { if(confirm(`Delete all ${sessionCount} sessions? This cannot be undone.`)) { onClearSessions(); } }}>
            🗑 Clear All Sessions
          </Btn>
        </div>
      </Card>

      {legacyCount > 0 && (
        <Card accent="#d97706">
          <Label color="var(--warning)">Import Older Sessions</Label>
          <p style={{ fontSize:12,color:"var(--text-3)",marginBottom:14 }}>
            Found {legacyCount} session{legacyCount!==1?"s":""} saved in this browser from before cloud sync was added. Import them into your account so they're available on any device.
          </p>
          <Btn disabled={importing} onClick={async () => {
            setImporting(true);
            await onImportLegacy();
            setImporting(false);
          }}>
            {importing ? <span style={{ display:"flex",gap:8,alignItems:"center" }}><Spinner size={14}/>Importing…</span> : `⬆ Import ${legacyCount} Local Session${legacyCount!==1?"s":""}`}
          </Btn>
        </Card>
      )}

      <Card>
        <Label>About ClassroomLens Pro</Label>
        <div style={{ fontSize:12,color:"var(--text-3)",lineHeight:1.8 }}>
          <p>Version 1.0.0 · Built for instructional coaches, administrators, and teachers.</p>
          <p style={{ marginTop:8 }}>Supports: Danielson (2022), Marzano 2.0, CEL 5D+, TNTP Core, TPEP (2023), T-TESS, TEAM, TKES</p>
          <p style={{ marginTop:8 }}>Support & licensing: <a href="mailto:support@classroomlens.com" style={{ color:"var(--accent)" }}>Customer Support</a></p>
          <p style={{ marginTop:8,color:"var(--text-5)" }}>© 2025 ClassroomLens Pro · All rights reserved</p>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATION VIEW (individual → school plan upgrade, invites, roster)
// ─────────────────────────────────────────────────────────────────────────────
function OrganizationView({ user, org, school, onOrgChange }) {
  const [schoolName, setSchoolName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!org) return;
    let cancelled = false;
    setMembersLoading(true);
    orgApi.listTeamMembers(org.schoolId)
      .then(rows => { if (!cancelled) setMembers(rows); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setMembersLoading(false); });
    return () => { cancelled = true; };
  }, [org, school]);

  const copy = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  };

  const upgrade = async () => {
    if (!schoolName.trim()) { setErr("Enter a school name."); return; }
    setErr(""); setBusy(true);
    try {
      await orgApi.createSchool(schoolName.trim());
      await onOrgChange();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const join = async () => {
    if (!joinCode.trim()) { setErr("Enter an invite code."); return; }
    setErr(""); setBusy(true);
    try {
      await orgApi.joinSchoolByCode(joinCode.trim().toUpperCase());
      await onOrgChange();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const regenerate = async () => {
    setBusy(true); setErr("");
    try {
      await orgApi.regenerateInviteCode(org.schoolId);
      await onOrgChange();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const remove = async (userId) => {
    if (!confirm("Remove this teacher from your school? Their existing observations stay on record.")) return;
    try {
      await orgApi.removeMember(userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
    } catch (e) { alert("Couldn't remove teacher: " + e.message); }
  };

  // ---- No school yet: individual plan ----
  if (!org) {
    return (
      <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ textAlign: "center", padding: "40px 32px" }}>
          <Chip label="Individual Plan" color="var(--text-4)" size="md" />
          <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", marginTop: 14, marginBottom: 8 }}>Upgrade to the School Plan</div>
          <p style={{ fontSize: 13, color: "var(--text-4)", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
            Create a school to invite your teaching staff, collect their observations under one roof, and see school-wide trends on your Dashboard as their principal.
          </p>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <Label>Upgrade — Create a School</Label>
            <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 14, lineHeight: 1.6 }}>You'll become the school's principal and get an invite code to share with teachers.</p>
            <TextInput label="School Name" value={schoolName} onChange={setSchoolName} placeholder="e.g. Lincoln Elementary" />
            <Btn full style={{ marginTop: 12 }} onClick={upgrade} disabled={busy}>
              {busy ? <span style={{ display:"flex",gap:8,alignItems:"center",justifyContent:"center" }}><Spinner size={14}/>Creating…</span> : "🏫 Upgrade to School Plan"}
            </Btn>
          </Card>

          <Card>
            <Label>Join an Existing School</Label>
            <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 14, lineHeight: 1.6 }}>Got an invite code from your principal? Enter it here to join as a teacher.</p>
            <TextInput label="Invite Code" value={joinCode} onChange={v => setJoinCode(v.toUpperCase())} placeholder="e.g. A1B2C3D4" />
            <Btn full variant="outline" style={{ marginTop: 12 }} onClick={join} disabled={busy}>
              {busy ? <span style={{ display:"flex",gap:8,alignItems:"center",justifyContent:"center" }}><Spinner size={14}/>Joining…</span> : "Join School"}
            </Btn>
          </Card>
        </div>

        {err && <div style={{ background: "var(--danger-soft)", border: "1px solid #dc262622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--danger)" }}>{err}</div>}
      </div>
    );
  }

  const isPrincipal = org.role === "principal";
  const inviteLink = school ? `${window.location.origin}${window.location.pathname}?join=${school.invite_code}` : "";

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ borderTop: "3px solid var(--accent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <Chip label="School Plan" color="var(--accent)" size="md" />
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", marginTop: 10 }}>{school?.name || "Your School"}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3 }}>You're a {isPrincipal ? "Principal" : "Teacher"} at this school</div>
          </div>
          <div style={{ width: 44, height: 44, background: "var(--accent-soft)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
            <Icon name="building" size={22} />
          </div>
        </div>
      </Card>

      {isPrincipal && (
        <Card>
          <Label>Invite Teachers</Label>
          <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 14, lineHeight: 1.6 }}>
            Share this link (or the code) with your teaching staff. Anyone who opens it, signs up or logs in, and confirms will join {school?.name} as a teacher.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 7, padding: "9px 12px", fontSize: 12, color: "var(--text-2)", fontFamily: "'JetBrains Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inviteLink}
            </div>
            <Btn variant="outline" onClick={() => copy(inviteLink, "link")}>{copied === "link" ? "✓ Copied" : "Copy Link"}</Btn>
            <Btn variant="ghost" onClick={() => copy(school?.invite_code || "", "code")}>{copied === "code" ? "✓ Copied" : `Code: ${school?.invite_code}`}</Btn>
            <Btn variant="ghost" onClick={regenerate} disabled={busy}>↻ Regenerate</Btn>
          </div>
        </Card>
      )}

      <Card>
        <Label>Team {membersLoading ? "" : `(${members.length})`}</Label>
        {membersLoading
          ? <p style={{ fontSize: 12, color: "var(--text-5)" }}>Loading roster…</p>
          : members.length === 0
            ? <p style={{ fontSize: 12, color: "var(--text-5)" }}>No teachers have joined yet.</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {members.map(m => (
                  <div key={m.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", borderRadius: 8, padding: "10px 12px", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                        {(m.fullName || m.email || "?").trim()[0]?.toUpperCase() || "?"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.fullName || m.email || "Unknown"}</div>
                        <div style={{ fontSize: 11, color: "var(--text-5)" }}>{m.email}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <Chip label={m.role} color={m.role === "principal" ? "var(--accent)" : "var(--text-4)"} />
                      {isPrincipal && m.userId !== user.id && (
                        <Btn size="sm" variant="danger" onClick={() => remove(m.userId)}>Remove</Btn>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
      </Card>

      {err && <div style={{ background: "var(--danger-soft)", border: "1px solid #dc262622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--danger)" }}>{err}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOIN-BY-LINK CONFIRMATION SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function JoinSchoolScreen({ code, user, onSignOut, onJoined, onSkip }) {
  const [schoolName, setSchoolName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    orgApi.previewSchoolByCode(code)
      .then(name => { if (!cancelled) setSchoolName(name); })
      .catch(e => { if (!cancelled) setErr(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [code]);

  const join = async () => {
    setJoining(true); setErr("");
    try {
      await orgApi.joinSchoolByCode(code);
      onJoined();
    } catch (e) {
      setErr(e.message);
      setJoining(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "var(--text-4)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 10px" }}>
            Signed in as <strong style={{ color: "var(--text-2)" }}>{user.email}</strong>
          </div>
          <Btn size="sm" variant="ghost" onClick={onSignOut}>Sign Out</Btn>
        </div>
        <Card style={{ boxShadow: "var(--shadow-lg)", textAlign: "center", padding: "36px 30px" }}>
          <div style={{ width: 48, height: 48, background: "var(--accent-soft)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "var(--accent)" }}>
            <Icon name="building" size={22} />
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center" }}><Spinner /></div>
          ) : schoolName ? (
            <>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Join {schoolName}?</div>
              <p style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.7, marginBottom: 22 }}>
                You've been invited to join <strong style={{ color: "var(--text-2)" }}>{schoolName}</strong> as a teacher. Your existing sessions stay yours either way.
              </p>
              {err && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 12 }}>{err}</p>}
              <Btn full size="lg" onClick={join} disabled={joining} style={{ marginBottom: 10 }}>
                {joining ? <span style={{ display:"flex",gap:8,alignItems:"center",justifyContent:"center" }}><Spinner size={14}/>Joining…</span> : `Join ${schoolName} →`}
              </Btn>
              <Btn full variant="ghost" onClick={onSkip} disabled={joining}>Not now</Btn>
            </>
          ) : (
            <>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Invalid invite link</div>
              <p style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.7, marginBottom: 22 }}>This invite code doesn't match a school. Ask your principal for a fresh link.</p>
              <Btn full onClick={onSkip}>Continue to ClassroomLens Pro →</Btn>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"dashboard",     icon:"dashboard",  label:"Dashboard",              group:"Overview" },
  { id:"record",        icon:"record",     label:"Observe",                group:"Observation" },
  { id:"analysis",      icon:"analysis",   label:"Analysis",               group:"Observation" },
  { id:"growth",        icon:"growth",     label:"Growth Plan",            group:"Observation" },
  { id:"coaching",      icon:"coaching",   label:"Coaching",               group:"Observation" },
  { id:"report",        icon:"report",     label:"Reports",                group:"Observation" },
  { id:"iep",           icon:"iep",        label:"IEP Meeting Analysis",   group:"Tools" },
  { id:"plc",           icon:"plc",        label:"PLC Meeting Analyzer",   group:"Tools" },
  { id:"lessonplan",    icon:"lessonplan", label:"Lesson Plan Analyzer",   group:"Tools" },
  { id:"sessions",      icon:"sessions",   label:"Sessions",               group:"Library" },
  { id:"organization",  icon:"team",       label:"Organization",           group:"Account" },
  { id:"settings",      icon:"settings",   label:"Settings",               group:"Account" },
];
const TAB_GROUPS = ["Overview", "Observation", "Tools", "Library", "Account"];
const PAGE_META = {
  dashboard: { title: "Dashboard", subtitle: "Your observation trends at a glance" },
  record:    { title: "New Observation", subtitle: "Record or paste a transcript to generate an AI analysis" },
  analysis:  { title: "Analysis", subtitle: "AI-scored breakdown of the active observation" },
  growth:    { title: "Growth Plan", subtitle: "Actionable next steps from the active observation" },
  coaching:  { title: "Coaching Conference", subtitle: "Pre- and post-observation conversation support" },
  report:    { title: "Reports", subtitle: "Generate formal, teacher-facing, or administrative write-ups" },
  iep:       { title: "IEP Meeting Analysis", subtitle: "AI-assisted support for special education case managers — nothing is saved" },
  plc:       { title: "PLC Meeting Analyzer", subtitle: "AI-assisted analysis of your team's collaborative meeting — nothing is saved" },
  lessonplan:{ title: "Lesson Plan Analyzer", subtitle: "Framework-mapped feedback on your lesson plan — nothing is saved" },
  sessions:  { title: "Sessions", subtitle: "Every observation saved to your account" },
  organization: { title: "Organization", subtitle: "Manage your school, plan, and team" },
  settings:  { title: "Settings", subtitle: "API key, data, and account preferences" },
};

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  // No client router in this app — /landing is always the public marketing page (rendered
  // before we even wait on auth to resolve), and / falls back to it for logged-out visitors.
  // Everything else (notably /app) goes through the normal sign-in → app flow below.
  const path = window.location.pathname;
  const [tab, setTab] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [legacyCount, setLegacyCount] = useState(() => loadLegacySessions().length);

  // org === undefined -> not resolved yet, null -> individual plan, object -> {schoolId, role}
  const [org, setOrg] = useState(undefined);
  const [school, setSchool] = useState(null);
  const [joinCode] = useState(() => new URLSearchParams(window.location.search).get("join"));
  const [joinHandled, setJoinHandled] = useState(false);

  const refreshOrg = useCallback(async () => {
    if (!user) return;
    const m = await orgApi.getMyMembership(user.id);
    setOrg(m);
    if (m) setSchool(await orgApi.getSchool(m.schoolId));
    else setSchool(null);
  }, [user]);

  // Load this user's school membership whenever they log in.
  useEffect(() => {
    if (!user) { setOrg(undefined); setSchool(null); return; }
    let cancelled = false;
    orgApi.getMyMembership(user.id).then(async m => {
      if (cancelled) return;
      setOrg(m);
      if (m) {
        const s = await orgApi.getSchool(m.schoolId);
        if (!cancelled) setSchool(s);
      }
    }).catch(() => { if (!cancelled) setOrg(null); });
    return () => { cancelled = true; };
  }, [user]);

  // Billing: undefined -> not resolved yet, object -> the billing_accounts row.
  const [billing, setBilling] = useState(undefined);
  const [showPlansBrowse, setShowPlansBrowse] = useState(false); // voluntary, dismissible (from Settings)
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const refreshBilling = useCallback(async () => {
    if (!user) return;
    try {
      setBilling(await getBillingAccount(user.id));
    } catch {
      // billing_accounts row should always exist (created by trigger on signup);
      // leave billing as-is on a transient fetch error rather than blocking the app.
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setBilling(undefined); return; }
    refreshBilling();
  }, [user, refreshBilling]);

  // Every account starts at plan "trial" (meaning "no plan chosen yet") and
  // is blocked from the app entirely until they start a monthly/annual
  // subscription — both include a 7-day free trial (Stripe status
  // "trialing"), which gets full access exactly like "active". Mirrors the
  // server-side gate in api/track-observation.js, so a canceled/past-due
  // subscription blocks access here too, not just a brand-new account.
  //
  // Also requires stripe_customer_id: create-portal-session.js clears it
  // (without touching plan/subscription_status) when it finds a stale
  // test-mode customer id that doesn't exist in live mode — without this
  // check the user would be stuck seeing an active plan in the UI while
  // "Manage Subscription" keeps failing. Forcing the gate back open sends
  // them through checkout again, which creates a fresh live customer.
  const blocked = billing !== undefined
    && !((billing.plan === "monthly" || billing.plan === "annual")
      && (billing.subscription_status === "active" || billing.subscription_status === "trialing")
      && billing.stripe_customer_id);

  // Returning from Stripe Checkout. session_id is read before the query
  // string is cleared so it can be verified directly against the Stripe API
  // (see api/verify-checkout-session.js) — faster and more reliable than
  // waiting for the webhook to land before refreshing.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;
    const sessionId = params.get("session_id");
    window.history.replaceState({}, "", window.location.pathname);
    if (checkout === "success" && sessionId) {
      setCheckoutNotice("🎉 Activating your plan…");
      verifyCheckoutSession(sessionId)
        .then(() => { setCheckoutNotice(""); refreshBilling(); })
        .catch(e => {
          setCheckoutNotice("");
          setCheckoutError("Payment succeeded but activating your plan failed: " + e.message + " — refreshing to check again.");
          refreshBilling();
        });
    }
  }, [refreshBilling]);

  const handleUsageChecked = useCallback((result) => {
    if (!result.allowed) refreshBilling(); // subscription likely lapsed mid-session — refresh flips mustChoosePlan back on
  }, [refreshBilling]);

  // Load sessions once we know whether this user is a principal (school-wide) or not (own only).
  useEffect(() => {
    if (!user || org === undefined) return;
    let cancelled = false;
    setSessionsLoading(true);
    setSessionsError("");
    const fetcher = org?.role === "principal" && org.schoolId
      ? sessionsApi.listSchoolSessions(org.schoolId)
      : sessionsApi.listSessions(user.id);
    fetcher
      .then(rows => { if (!cancelled) setSessions(rows); })
      .catch(e => { if (!cancelled) setSessionsError(e.message); })
      .finally(() => { if (!cancelled) setSessionsLoading(false); });
    return () => { cancelled = true; };
  }, [user, org]);

  const handleAnalyze = useCallback(async (draft) => {
    const saved = await sessionsApi.createSession(draft, user.id, org?.schoolId);
    setSessions(prev => [saved, ...prev]);
    setActiveSession(saved);
    setTab("analysis");
  }, [user, org]);

  const deleteSession = async (id) => {
    try {
      await sessionsApi.deleteSession(id, user.id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSession?.id === id) setActiveSession(null);
    } catch (e) {
      alert("Failed to delete session: " + e.message);
    }
  };

  const clearSessions = async () => {
    try {
      await sessionsApi.deleteAllSessions(user.id);
      setSessions([]);
      setActiveSession(null);
    } catch (e) {
      alert("Failed to clear sessions: " + e.message);
    }
  };

  const importLegacySessions = async () => {
    try {
      const imported = await sessionsApi.importLocalSessions(loadLegacySessions(), user.id);
      setSessions(prev => [...imported, ...prev]);
      clearLegacySessions();
      setLegacyCount(0);
    } catch (e) {
      alert("Failed to import local sessions: " + e.message);
    }
  };

  if (path === "/landing") return (
    <>
      <style>{css}</style>
      <LandingPage isLoggedIn={!!user} />
    </>
  );

  if (authLoading) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={28} />
      </div>
    </>
  );

  if (!user) {
    if (path === "/" || path === "") return (
      <>
        <style>{css}</style>
        <LandingPage isLoggedIn={false} />
      </>
    );
    return (
      <>
        <style>{css}</style>
        <AuthScreen />
      </>
    );
  }

  // A user who already belongs to a school just silently drops the ?join= param.
  if (joinCode && org) {
    window.history.replaceState({}, "", window.location.pathname);
  }

  if (joinCode && !joinHandled && org === undefined) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={28} />
      </div>
    </>
  );

  if (joinCode && !joinHandled && org === null) return (
    <>
      <style>{css}</style>
      <JoinSchoolScreen
        code={joinCode}
        user={user}
        onSignOut={signOut}
        onJoined={async () => {
          window.history.replaceState({}, "", window.location.pathname);
          await refreshOrg();
          setJoinHandled(true);
        }}
        onSkip={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setJoinHandled(true);
        }}
      />
    </>
  );

  const meta = tab === "dashboard"
    ? { title: "Dashboard", subtitle: org?.role === "principal" ? `School-wide observation trends across ${school?.name || "your school"}` : "Your observation trends at a glance" }
    : (PAGE_META[tab] || {});
  const initial = (user.email || "?").trim()[0]?.toUpperCase() || "?";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      <style>{css}</style>

      {/* Sidebar */}
      <aside style={{ width: 240, flexShrink: 0, background: "var(--sidebar-bg)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 18px 16px" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#4f46e5,#4338ca)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="lens" size={17} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>ClassroomLens <span style={{ color: "#818cf8" }}>Pro</span></div>
            <div style={{ fontSize: 9, color: "var(--sidebar-text)", letterSpacing: "0.1em" }}>OBSERVATION PLATFORM</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
          {TAB_GROUPS.map(group => (
            <div key={group} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 10px", marginBottom: 6 }}>{group}</div>
              {TABS.filter(t => t.group === group).map(t => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                      background: active ? "var(--sidebar-bg-2)" : "transparent",
                      border: "none", borderLeft: `2px solid ${active ? "#818cf8" : "transparent"}`,
                      color: active ? "#fff" : "var(--sidebar-text)",
                      padding: "8px 10px 8px 8px", fontSize: 13, fontWeight: active ? 700 : 600, cursor: "pointer",
                      borderRadius: 7, marginBottom: 2, fontFamily: "inherit", transition: "background .15s, color .15s",
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--sidebar-bg-2)"; e.currentTarget.style.color = "#e2e8f0"; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; } }}>
                    <Icon name={t.icon} size={16} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid var(--sidebar-border)", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 6px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sidebar-bg-2)", color: "#c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{initial}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
              <div style={{ fontSize: 10, color: "var(--sidebar-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {org ? `${school?.name || "School"} · ${org.role === "principal" ? "Principal" : "Teacher"}` : `${sessions.length} session${sessions.length !== 1 ? "s" : ""} saved`}
              </div>
            </div>
            <button onClick={signOut} title="Sign out"
              style={{ background: "transparent", border: "none", color: "var(--sidebar-text)", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fca5a5"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--sidebar-text)"; }}>
              <Icon name="logout" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Page header */}
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "18px 32px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>{meta.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{meta.subtitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {billing?.plan === "monthly" && <Chip label="Monthly Plan" color="var(--success)" size="md" />}
            {billing?.plan === "annual" && <Chip label="Annual Plan" color="var(--accent)" size="md" />}
            {activeSession && (
              <div style={{ fontSize: 11, color: "var(--text-3)", background: "var(--accent-soft)", border: "1px solid #4f46e522", borderRadius: 7, padding: "5px 12px" }}>
                Active session: <strong style={{ color: "var(--accent)" }}>{activeSession.meta.teacher || "Untitled"}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, maxWidth: 1080, width: "100%", margin: "0 auto", padding: "28px 32px 80px" }}>
          {checkoutNotice && (
            <div style={{ background: "var(--success-soft)", border: "1px solid #16a34a22", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--success)", marginBottom: 16 }}>
              {checkoutNotice}
            </div>
          )}
          {sessionsError && (
            <div style={{ background: "var(--danger-soft)", border: "1px solid #dc262622", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--danger)", marginBottom: 16 }}>
              Couldn't load your sessions from the cloud: {sessionsError}
            </div>
          )}
          {tab === "dashboard" && <DashboardView sessions={sessions} onSelect={s => { setActiveSession(s); setTab("analysis"); }} onNew={() => setTab("record")} />}
          {tab === "record"    && <RecordView onAnalyze={handleAnalyze} onUsageChecked={handleUsageChecked} />}
          {tab === "analysis"  && <AnalysisView session={activeSession} />}
          {tab === "growth"    && <GrowthPlanView session={activeSession} />}
          {tab === "coaching"  && <CoachingView session={activeSession} />}
          {tab === "report"    && <ReportView session={activeSession} />}
          {tab === "iep"        && <IEPView onUsageChecked={handleUsageChecked} />}
          {tab === "plc"        && <PLCView onUsageChecked={handleUsageChecked} />}
          {tab === "lessonplan" && <LessonPlanView onUsageChecked={handleUsageChecked} />}
          {tab === "sessions"  && <SessionsList sessions={sessions} loading={sessionsLoading} currentUserId={user.id} onSelect={s => { setActiveSession(s); setTab("analysis"); }} onDelete={deleteSession} />}
          {tab === "organization" && <OrganizationView user={user} org={org} school={school} onOrgChange={refreshOrg} />}
          {tab === "settings"  && <SettingsView onClearSessions={clearSessions} sessionCount={sessions.length} legacyCount={legacyCount} onImportLegacy={importLegacySessions} billing={billing} onOpenPricing={() => setShowPlansBrowse(true)} />}
        </div>
      </div>

      {checkoutError && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--danger)", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, boxShadow: "var(--shadow-lg)", zIndex: 300, maxWidth: 480, textAlign: "center" }}>
          {checkoutError}
        </div>
      )}

      {/* Mandatory — no free trial, no dismiss. Shown for a brand-new account
          (plan "trial") and equally for a lapsed subscription (past_due/canceled),
          since `blocked` mirrors the server-side gate exactly either way. */}
      {blocked && <PricingView mode="gate" />}

      {/* Voluntary — opened from Settings to view/change plans; only reachable
          when not blocked, since Settings itself sits behind the gate above. */}
      {showPlansBrowse && !blocked && (
        <PricingView mode="browse" onDismiss={() => setShowPlansBrowse(false)} />
      )}
    </div>
  );
}
