# 🎓 ClassroomLens Pro
### AI-Powered Classroom Observation & Evaluation Platform

Built by Kim Anthony | anthonykc@gmail.com

---

## What This App Does

ClassroomLens Pro records classroom lessons, transcribes them in real time, and uses AI to:
- Map evidence to evaluation frameworks (Danielson, Marzano, CEL 5D+, TNTP, TPEP, T-TESS, TEAM, TKES)
- Generate ratings with quoted evidence for every rubric component
- Produce coaching feedback, growth plans, and formal reports
- Facilitate pre/post observation conferences
- Track student intervention needs across classrooms
- Give administrators a school-wide observation dashboard

---

## ⚡ Quick Start (5 Minutes)

### Step 1 — Install Node.js
Download and install from: https://nodejs.org (choose the LTS version)

### Step 2 — Open your Terminal
- **Mac**: Press Cmd+Space, type "Terminal", press Enter
- **Windows**: Press Win key, type "PowerShell", press Enter

### Step 3 — Install dependencies
Navigate to this folder and run:
```bash
cd classroomlens-pro
npm install
```

### Step 4 — Set up your accounts (Supabase + Anthropic)
1. Copy the file `.env.example` and rename it to `.env`
   (or run: `cp .env.example .env`)
2. Open `.env` in any text editor
3. **Supabase** (user accounts + cloud storage): create a free project at
   https://supabase.com, then copy the Project URL and `anon public` key from
   Settings → API into `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   Also open the SQL Editor in your Supabase dashboard, paste in the contents
   of `supabase/schema.sql` from this repo, and run it once — this creates
   the `sessions` table and the Row Level Security policies that keep each
   user's observations private to their own account. Then also run
   `supabase/disposable_domains_seed.sql` (a separate, data-only file —
   ~8,200 known throwaway-email domains — kept out of schema.sql so it
   doesn't dominate every future diff there) to power the signup blocklist.
4. **Anthropic** (AI analysis): get a free key at https://console.anthropic.com
   and paste it into `VITE_ANTHROPIC_API_KEY`
5. Save the file

Your `.env` file should look like:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5 — Run the app
```bash
npm run dev
```

The app opens automatically at: **http://localhost:3000**. Create an account
(or sign in) on the first screen — each teacher/admin gets their own login.

---

## 🔑 Getting Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Create a free account
3. Click **API Keys** in the left sidebar
4. Click **Create Key**
5. Copy the key (it starts with `sk-ant-api03-`)
6. Paste it into your `.env` file

**Cost**: Roughly $0.02–$0.10 per observation analysis. Very affordable.

---

## 📋 Features

| Feature | Description |
|---------|-------------|
| ⏺ Live Recording | Record lessons with real-time transcription (Chrome/Edge) |
| ✏️ Paste Transcript | Paste any transcript for analysis |
| ⚡ AI Analysis | Maps evidence to every framework component automatically |
| 📋 8 Frameworks | Danielson, Marzano, CEL 5D+, TNTP Core, TPEP (WA), T-TESS (TX), TEAM (TN), TKES (GA) |
| 🌱 Growth Plans | 3-tier growth plan: tomorrow, 2-week, long-term |
| 💬 Coaching Conference | AI-guided pre/post observation conversations |
| 📄 4 Report Types | Formal eval, teacher letter, admin summary, PD memo |
| 🏫 Admin Dashboard | School-wide observation trends — principals see every teacher's observations in their school |
| 🏢 Organization / School Plan | Principals create a school, invite teachers by code, and manage the team roster |
| 🩺 IEP Meeting Analysis | Record or paste IEP meeting notes for AI-assisted strengths/needs, goal alignment, accommodations, and IDEA/FAPE compliance notes |
| 🗣️ PLC Meeting Analyzer | Analyze PLC meetings for decisions, action items, collaborative inquiry, and norms adherence |
| 📄 Lesson Plan Analyzer | Paste, upload, or record a lesson-plan walkthrough for framework-mapped feedback |
| 📁 Session Storage | Synced to your account in the cloud — available on any device you log into |
| 💳 Billing (Stripe) | Flat-rate plans, 7-day free trial — Monthly ($4.99/mo) or Annual ($19.99/yr, save 67%) |
| ⚙️ Settings | Update API key, manage data, manage subscription |

*IEP, PLC, and Lesson Plan analyses are stateless — nothing from those three tools is saved to your account.*

---

## 🌐 Deploy Online (Share with Others)

### Free Deployment with Vercel
1. Create a free account at https://vercel.com
2. Install Vercel CLI: `npm install -g vercel`
3. Run `vercel` from the project folder
4. Follow the prompts
5. Add your environment variables — Vercel project → Settings → Environment Variables:
   - `VITE_ANTHROPIC_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend)
   - `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_WEBHOOK_SECRET` (billing — see `.env.example` for the full Stripe setup walkthrough)

Your app will be live at a URL like: `https://classroomlens-pro.vercel.app`

### Billing (Stripe) setup
Billing runs through Vercel Serverless Functions in `/api` — these only execute once deployed to Vercel (or via `vercel dev` locally); plain `npm run dev` won't run them, so payment testing has to happen on a real deploy. Full step-by-step instructions (creating the Stripe products/prices, getting the service-role key, wiring the webhook) are in the commented-out section of `.env.example`. Start in Stripe **Test mode** — test card `4242 4242 4242 4242`, any future expiry/CVC — before switching to live keys.

---

## 💡 Tips for Best Results

**For transcripts:**
- Label speakers: `Teacher:` `Student A:` `Student B:`
- Include timestamps if possible: `[0:00]`
- Include student questions AND teacher responses
- Aim for at least 10–15 minutes of classroom interaction

**For live recording:**
- Use Chrome or Edge (required for live transcription)
- Allow microphone access when prompted
- Works best in a quiet environment with a good microphone

---

## 🔒 Privacy & Data

- Your login (email/password) is managed by Supabase, ClassroomLens's authentication provider
- Session/observation data is stored in your own Supabase account, protected by Row Level Security so only you can read or write your rows
- Transcripts are sent to Anthropic's API for analysis only
- Your API key is stored locally in your browser only
- See Anthropic's privacy policy: https://www.anthropic.com/privacy

---

## 📬 Support

Questions or feedback: **support@classroomlens.com**

---

## 🚀 Future Roadmap

- [x] User accounts and cloud sync
- [x] Organization/school roles for true cross-teacher admin dashboards
- [x] Subscription billing (Stripe) — flat-rate Monthly and Annual plans
- [ ] PDF export for formal evaluations
- [ ] Multi-school district dashboard
- [ ] Custom framework builder
- [ ] Email report delivery
- [ ] LMS integration (Google Classroom, Canvas)
- [ ] Mobile app (iOS/Android)

---

*ClassroomLens Pro © 2025 · Built for coaches. Designed for teachers. Trusted by districts.*
