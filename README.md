# 🚨 The Last-Minute Life Saver

<p align="center">
  <strong>AI Emergency Deadline Management System</strong><br/>
  <em>"Stop Panicking. Start Executing."</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-blue?logo=google" alt="Gemini"/>
  <img src="https://img.shields.io/badge/Firebase-Real%20Time-orange?logo=firebase" alt="Firebase"/>
  <img src="https://img.shields.io/badge/Google%20Cloud%20Run-Deployed-blue?logo=googlecloud" alt="Cloud Run"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Hackathon-Vibe2Ship%202024-purple" alt="Vibe2Ship"/>
</p>

---

## 📌 What Is This?

**The Last-Minute Life Saver** is an autonomous, action-oriented deadline intervention engine built for the **Google Vibe2Ship Hackathon — "The Last-Minute Life Saver" Track**.

Traditional deadline tools (Google Calendar, Notion, Todoist) are **passive** — they show you the deadline. They don't help you execute.

We built an **AI Emergency Command Center** that transforms deadline panic into an immediately executable action plan in **under 5 seconds**.

---

## 🎯 The Demo Scenario

You type:
> *"Engineering paper due 8 AM tomorrow. Haven't started. Need abstract, 3 body sections, IEEE bibliography. It's 11 PM."*

In under 5 seconds, you get:

```
📋 Task: IEEE Paper — ML in Smart Grid Optimization
⏰ Deadline: 8:00 AM (8h 47m remaining)
🔴 Urgency: 9/10 — CRITICAL

STEP 1: Create detailed paper outline       [15m] → Execute with AI
STEP 2: Research ML + Smart Grid literature [45m] → Execute with AI
STEP 3: Write abstract (IEEE format)        [20m] → Execute with AI
STEP 4: Write Introduction section         [30m] → Execute with AI
STEP 5: Write Methodology section          [45m] → Execute with AI
STEP 6: Write Results & Discussion         [45m] → Execute with AI
STEP 7: Compile bibliography               [20m] → Execute with AI
STEP 8: Proofread + final check            [30m] → Execute with AI
STEP 9: Submit                             [10m] → Execute with AI
```

Click **"Execute"** on any step → Gemini streams an immediately usable draft in real-time **right inside the UI**.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🧠 AI Panic Intake** | Describe your crisis in plain English — Gemini 1.5 Flash parses it into a structured plan |
| **📊 Urgency Engine** | Dynamic 1–10 urgency score; the entire UI transforms from calm green → pulsing red as the deadline approaches |
| **⏱️ Live Countdown** | Real-time countdown timer ticking every second to your exact deadline |
| **🚀 Execution Workspace** | Click any step → Gemini streams context-aware content inline (no tab switching) |
| **🔔 Autonomous Intervention** | Cloud Function runs every 15 min — sends push notifications when deadline is under 2 hours, even if browser is closed |
| **⚡ Real-Time Sync** | Firestore `onSnapshot()` — the dashboard updates live, no refresh needed |
| **🔐 Secure Auth** | Firebase Authentication with Google Sign-In |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.2.21 | Full-stack React framework with App Router |
| **React** | 18.3.x | UI component library |
| **TypeScript** | 5.7.x | Type safety across the entire codebase |
| **Tailwind CSS** | 3.4.x | Utility-first styling |
| **Framer Motion** | 11.x | Animations — urgency transitions, step reveals |
| **Three.js** | 0.185.x | 3D particle background on the landing page |
| **Lucide React** | 0.469.x | Icon library |
| **date-fns** | 4.x | Date/time formatting and countdown math |
| **marked + DOMPurify** | 15.x / 3.x | Renders and sanitizes AI-generated markdown |

### AI & Backend
| Technology | Purpose |
|-----------|---------|
| **Google Gemini 1.5 Flash** | Main AI — task decomposition, step execution, streaming |
| **@google/generative-ai SDK** | JSON mode, streaming, safety config |
| **Vertex AI SDK** | Schema validation + safety guardrails |
| **Firebase Admin SDK** | Server-side Firestore + FCM operations |
| **Next.js API Routes** | REST + SSE streaming endpoints |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Cloud Firestore** | Real-time NoSQL database with `onSnapshot()` |
| **Firebase Auth** | Google OAuth — Sign-in with Google |
| **Firebase Cloud Messaging** | Web push notifications (background delivery) |
| **Google Cloud Run** | Containerized Next.js deployment (auto-scaling) |
| **Cloud Build** | CI/CD pipeline on every `git push` |
| **Cloud Functions** | Serverless cron — autonomous intervention engine |
| **Cloud Scheduler** | Triggers the intervention cron every 15 minutes |

---

## 🏗️ Project Structure

```
vibe2ship/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── panic/route.ts          ← Main AI endpoint (Gemini JSON mode)
│   │   │   ├── execute/route.ts        ← Streaming execution (SSE)
│   │   │   ├── tasks/route.ts          ← Task CRUD (Firestore)
│   │   │   └── fcm-token/route.ts      ← FCM token registration
│   │   ├── dashboard/page.tsx          ← Main workspace UI
│   │   ├── page.tsx                    ← Landing page (Three.js 3D bg)
│   │   ├── layout.tsx                  ← Root layout + metadata
│   │   └── globals.css                 ← Design system + urgency states
│   ├── components/
│   │   ├── AuthProvider.tsx            ← Firebase Auth context + Google Sign-In
│   │   ├── PanicIntake.tsx             ← Deadline input form
│   │   ├── InterventionTimeline.tsx    ← Step cards list
│   │   ├── CountdownTimer.tsx          ← Real-time countdown display
│   │   ├── ExecutionWorkspace.tsx      ← Inline Gemini streaming modal
│   │   ├── UrgencyMeter.tsx            ← 1–10 score visualization
│   │   └── NotificationBanner.tsx      ← FCM push permission + registration
│   ├── lib/
│   │   ├── gemini.ts                   ← Gemini 1.5 Flash engine (JSON + stream)
│   │   ├── vertex.ts                   ← Vertex AI validation + safety
│   │   ├── firebase.ts                 ← Client SDK initialization
│   │   ├── firebase-admin.ts           ← Server SDK initialization
│   │   ├── fcm.ts                      ← Push notification logic
│   │   └── utils.ts                    ← Shared utilities
│   ├── types/
│   │   └── task.ts                     ← TypeScript interfaces (Task, Step, etc.)
│   └── functions/
│       └── interventionCron.js         ← Cloud Function (autonomous intervention)
├── docs/                               ← Full technical documentation
│   ├── architecture.md
│   ├── workflow.md
│   ├── apis.md
│   ├── agents.md
│   ├── firebase_architecture.md
│   ├── gemini_prompt_engineering.md
│   ├── google_cloud_deployment.md
│   ├── techstack.md
│   ├── dynamic_ui_states.md
│   ├── mcp.md
│   ├── backend_requirements.md
│   └── dataset_and_model.md
├── public/
│   └── firebase-messaging-sw.js        ← FCM service worker (background push)
├── .env.example                        ← Environment variable template (no secrets)
├── Dockerfile                          ← Production container for Cloud Run
├── cloudbuild.yaml                     ← Cloud Build CI/CD pipeline
├── firebase.json                       ← Firebase project config
├── firestore.rules                     ← Firestore security rules
├── firestore.indexes.json              ← Firestore composite indexes
├── next.config.mjs                     ← Next.js config
├── tailwind.config.ts                  ← Tailwind design tokens
└── package.json
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- A Google AI Studio account (for Gemini API key)
- A Firebase project
- (Optional) Google Cloud project for full deployment

### 1. Clone the repository

```bash
git clone https://github.com/Viresh2408/Vibe2Ship.git
cd Vibe2Ship
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in your credentials. See [ENVIRONMENT.md](./ENVIRONMENT.md) for the full guide.

**Minimum required for local dev:**
```bash
GEMINI_API_KEY=your_google_ai_studio_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🌐 Deployment

### Google Cloud Run (Production)

```bash
# Build and deploy in one step
gcloud run deploy vibe2ship \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key,...
```

### CI/CD with Cloud Build

Every `git push` to `main` automatically triggers a Cloud Build pipeline defined in [`cloudbuild.yaml`](./cloudbuild.yaml):

1. Build Docker image
2. Push to Artifact Registry
3. Deploy to Cloud Run

See [docs/google_cloud_deployment.md](./docs/google_cloud_deployment.md) for the full guide.

---

## 🔗 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/panic` | `POST` | Submit panic description → get structured AI plan |
| `/api/execute` | `POST` | Execute a specific step → stream Gemini response (SSE) |
| `/api/tasks` | `GET / POST / PATCH / DELETE` | Task CRUD operations backed by Firestore |
| `/api/fcm-token` | `POST` | Register FCM push token for a user |

See [docs/apis.md](./docs/apis.md) for full request/response schemas.

---

## 📐 Architecture

```
User (Browser)
    │
    ▼
┌─────────────────────────────────────────────┐
│            Next.js App (Cloud Run)          │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │  React UI   │    │    API Routes      │  │
│  │  Components │◄──►│  /api/panic        │  │
│  │  (Auth,     │    │  /api/execute      │  │
│  │   Timer,    │    │  /api/tasks        │  │
│  │   Steps)    │    │  /api/fcm-token    │  │
│  └─────────────┘    └────────┬───────────┘  │
└───────────────────────────────┼─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ Gemini 1.5   │   │  Firestore   │   │Firebase Auth │
    │ Flash (AI)   │   │ (Real-time)  │   │(Google OAuth)│
    └──────────────┘   └──────┬───────┘   └──────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Cloud Function    │
                    │  (Cron every 15m) │
                    │  ↓ checks deadlines│
                    │  ↓ sends FCM push  │
                    └────────────────────┘
```

---

## 🔒 Security

- **No credentials in code**: All secrets are environment variables — never hardcoded
- **`.env.local` is gitignored**: Real credentials never leave your machine
- **Service account keys are gitignored**: Firebase Admin SDK JSON files are blocked
- **Firestore Security Rules**: Users can only read/write their own data (see [`firestore.rules`](./firestore.rules))
- **Server-side only**: Firebase Admin SDK runs only in API routes — private key never exposed to browser
- **Input sanitization**: All AI-generated HTML is sanitized with DOMPurify before rendering
- **Rate limiting**: `/api/panic` endpoint has configurable rate limiting per user

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Full environment variable setup guide |
| [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) | Complete project deep-dive |
| [JUDGES_PITCH.md](./JUDGES_PITCH.md) | Hackathon pitch document |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and solutions |
| [docs/architecture.md](./docs/architecture.md) | System design and component map |
| [docs/workflow.md](./docs/workflow.md) | User journey and sequence diagrams |
| [docs/techstack.md](./docs/techstack.md) | Technology choices with rationale |
| [docs/apis.md](./docs/apis.md) | Complete API reference |
| [docs/agents.md](./docs/agents.md) | AI agent architecture |
| [docs/firebase_architecture.md](./docs/firebase_architecture.md) | Firestore schema and security rules |
| [docs/gemini_prompt_engineering.md](./docs/gemini_prompt_engineering.md) | Prompt design and JSON schema |
| [docs/google_cloud_deployment.md](./docs/google_cloud_deployment.md) | Full Cloud Run deployment guide |
| [docs/dynamic_ui_states.md](./docs/dynamic_ui_states.md) | Urgency-driven visual state machine |
| [docs/mcp.md](./docs/mcp.md) | Model Control Plane |
| [docs/backend_requirements.md](./docs/backend_requirements.md) | Production backend specifications |
| [docs/dataset_and_model.md](./docs/dataset_and_model.md) | AI model usage and dataset details |

---

## 🧠 How the AI Works

### 1. Panic Intake → Structured Plan (JSON Mode)

```
User input: "Presentation due in 3 hours, slides not done"
     ↓
Gemini 1.5 Flash (JSON Mode)
     ↓
{
  "task_title": "Client Presentation",
  "deadline": "2024-01-15T15:00:00",
  "urgency_score": 9,
  "urgency_label": "CRITICAL",
  "steps": [
    { "title": "Create slide structure", "duration_minutes": 20, "ai_starter_prompt": "..." },
    ...
  ]
}
```

### 2. Step Execution → Streaming Content (SSE)

```
User clicks "Execute" on Step 1
     ↓
POST /api/execute { stepTitle, aiStarterPrompt, taskContext }
     ↓
Gemini 1.5 Flash (Streaming Mode)
     ↓
Server-Sent Events stream → rendered Markdown in UI
```

### 3. Autonomous Intervention (Cloud Function)

```
Cloud Scheduler → every 15 minutes
     ↓
Cloud Function queries Firestore
     ↓
For each task where deadline < 2 hours:
     ↓
Firebase Admin sends FCM push notification
→ "⚠️ 1h 47m left! Execute Step 3: Write Results now."
```

---

## 🏆 What Makes This Novel

1. **Urgency-Driven UI** — The entire interface dynamically transforms based on urgency score. At 9/10, it's red, pulsing, and aggressive. Not just color — layout, animations, and messaging all escalate.

2. **Inline AI Execution** — Every step ships with a pre-engineered `ai_starter_prompt`. Click Execute → stream content directly in the app. No copy-paste, no tab switching.

3. **Autonomous Intervention** — The Cloud Function is a real autonomous agent. It acts without user interaction, sending push notifications that tell you exactly which step to do right now.

4. **Real-Time Everything** — Firestore `onSnapshot()` means the UI updates the instant the Cloud Function modifies a document. No polling, no refresh.

5. **100% Google Stack** — Gemini AI + Firebase + Cloud Run + Cloud Functions + Cloud Scheduler + Cloud Build. Every service is genuinely integrated and working.

---

## 🔧 Environment Variables

See [`.env.example`](./.env.example) for the full list. **Never commit `.env.local`.**

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `GEMINI_MODEL` | Optional | Model name (default: `gemini-2.5-flash`) |
| `GOOGLE_CLOUD_PROJECT` | ✅ | GCP project ID |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase web app API key |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `FIREBASE_ADMIN_PROJECT_ID` | ✅ | Firebase Admin project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | ✅ | Service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | ✅ | Service account private key |

---

## 📦 Getting API Keys

1. **Gemini API Key**: [Google AI Studio](https://aistudio.google.com) → Get API Key
2. **Firebase Config**: [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps → Web
3. **Firebase Admin SDK**: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
4. **GCP Project**: [Google Cloud Console](https://console.cloud.google.com)

---

## 🐳 Docker

```bash
# Build
docker build -t vibe2ship .

# Run locally with env file
docker run -p 3000:3000 --env-file .env.local vibe2ship
```

---

## 📜 License

MIT — Built for Google Vibe2Ship Hackathon 2024

---

<p align="center">
  Made with ❤️ for Google Vibe2Ship Hackathon<br/>
  <strong>The Last-Minute Life Saver</strong> — Because deadlines don't care about excuses.
</p>
