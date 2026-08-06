# 🎓 ClassroomLens Pro
### AI-Powered Classroom Observation & Evaluation Platform

Built by Kim Anthony | anthonykc@gmail.com

---

## What This App Does

ClassroomLens Pro records classroom lessons, transcribes them in real time, and uses AI to:
- Map evidence to evaluation frameworks (Danielson, Marzano, CEL 5D+, TNTP, TPEP)
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

### Step 4 — Add your API Key
1. Copy the file `.env.example` and rename it to `.env`
   (or run: `cp .env.example .env`)
2. Open `.env` in any text editor
3. Get your free API key at: https://console.anthropic.com
4. Replace `sk-ant-your-key-goes-here` with your actual key
5. Save the file

Your `.env` file should look like:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
```

### Step 5 — Run the app
```bash
npm run dev
```

The app opens automatically at: **http://localhost:3000**

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
| 📋 5 Frameworks | Danielson, Marzano, CEL 5D+, TNTP Core, TPEP (WA) |
| 🌱 Growth Plans | 3-tier growth plan: tomorrow, 2-week, long-term |
| 💬 Coaching Conference | AI-guided pre/post observation conversations |
| 📄 4 Report Types | Formal eval, teacher letter, admin summary, PD memo |
| 🏫 Admin Dashboard | School-wide data and teacher support tracking |
| 📁 Session Storage | All sessions saved locally, persistent between visits |
| ⚙️ Settings | Update API key, manage data |

---

## 🌐 Deploy Online (Share with Others)

### Free Deployment with Vercel
1. Create a free account at https://vercel.com
2. Install Vercel CLI: `npm install -g vercel`
3. Run `vercel` from the project folder
4. Follow the prompts
5. Add your environment variable:
   - Go to your Vercel project → Settings → Environment Variables
   - Add: `VITE_ANTHROPIC_API_KEY` = your key

Your app will be live at a URL like: `https://classroomlens-pro.vercel.app`

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

- All session data is stored **locally on your device** (localStorage)
- Transcripts are sent to Anthropic's API for analysis only
- No data is stored on any external server by ClassroomLens
- Your API key is stored locally in your browser only
- See Anthropic's privacy policy: https://www.anthropic.com/privacy

---

## 📬 Support

Questions or feedback: **anthonykc@gmail.com**

---

## 🚀 Future Roadmap

- [ ] User accounts and cloud sync
- [ ] PDF export for formal evaluations
- [ ] Multi-school district dashboard
- [ ] Custom framework builder
- [ ] Email report delivery
- [ ] LMS integration (Google Classroom, Canvas)
- [ ] Mobile app (iOS/Android)

---

*ClassroomLens Pro © 2025 · Built for coaches. Designed for teachers. Trusted by districts.*
