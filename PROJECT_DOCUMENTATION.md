# 🚨 The Last-Minute Life Saver — Complete Project Documentation

> **AI Emergency Management System** — Built for Google Vibe2Ship Hackathon  
> *"Stop Panicking. Start Executing."*

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack (Deep Dive)](#2-tech-stack-deep-dive)
3. [Project Structure & File Map](#3-project-structure--file-map)
4. [How the Project is Connected — Component Graph](#4-how-the-project-is-connected--component-graph)
5. [Data Flow — End-to-End Request Lifecycle](#5-data-flow--end-to-end-request-lifecycle)
6. [Microtasks — How Action Steps Work](#6-microtasks--how-action-steps-work)
7. [Middleware Layer (Auth, Rate Limiting, Safety)](#7-middleware-layer-auth-rate-limiting-safety)
8. [Real-Time Features — How Live Updates Work](#8-real-time-features--how-live-updates-work)
9. [Push Notifications — Autonomous Intervention Engine](#9-push-notifications--autonomous-intervention-engine)
10. [API Routes — Complete Reference](#10-api-routes--complete-reference)
11. [Firebase Architecture — Schema & Security Rules](#11-firebase-architecture--schema--security-rules)
12. [Deployment Pipeline — CI/CD on Google Cloud](#12-deployment-pipeline--cicd-on-google-cloud)
13. [Environment Variables](#13-environment-variables)
14. [Real-World Usage Scenarios](#14-real-world-usage-scenarios)

---

## 1. Project Overview

**The Last-Minute Life Saver** is an autonomous, action-oriented deadline intervention engine. Unlike passive calendars or reminder apps, it is an **AI Emergency Command Center** that transforms deadline panic into an immediately executable action plan.

### The Core Problem

Traditional deadline tools (Google Calendar, Notion, Todoist) are **passive** — they show you the deadline. They do not help you execute. When it's 11 PM and your paper is due at 8 AM, you need more than a reminder. You need a structured plan, AI-generated starter content for every step, and a system that acts autonomously even when you're not looking at it.

### What the App Does in Under 5 Seconds

When a user types a panicked description of their situation:

> *"Engineering paper due 8 AM tomorrow. Haven't started. Need abstract, 3 body sections, IEEE bibliography. It's 11 PM."*

The system returns:

- ✅ A structured **urgency score (1–10)** based on time remaining
- ✅ A **real-time countdown** to the exact deadline
- ✅ **4–10 micro-action steps** with per-step time estimates (totaling available time)
- ✅ An **AI Execution Workspace** for each step — streams Gemini-generated content inline
- ✅ **Push notifications** sent directly to the device when deadline is under 2 hours

---

## 2. Tech Stack (Deep Dive)

### Frontend Layer

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.2.21 | Full-stack React framework with App Router |
| **React** | 18.3.x | UI component library |
| **TypeScript** | 5.7.x | Type safety across the entire codebase |
| **Tailwind CSS** | 3.4.x | Utility-first styling |
| **Framer Motion** | 11.x | Animations (urgency transitions, step reveals) |
| **Three.js** | 0.185.x | 3D particle background on the landing page |
| **@react-three/fiber** | 8.x | React renderer for Three.js |
| **Lucide React** | 0.469.x | Icon library |
| **date-fns** | 4.x | Date/time formatting and countdown math |
| **marked** | 15.x | Markdown → HTML (renders Gemini output) |
| **DOMPurify** | 3.x | Sanitizes AI-generated HTML before rendering |
| **react-hot-toast** | 2.x | Toast notification system |
| **clsx + tailwind-merge** | latest | Conditional CSS class composition |

### AI Core

| Technology | Purpose |
|-----------|---------|
| **Google Gemini 1.5 Flash** | Main AI model for task decomposition and step execution |
| **@google/generative-ai** | Official SDK — handles JSON mode, streaming, safety |
| **Vertex AI SDK** | Schema validation and safety guardrails for production |

> **Why Gemini 1.5 Flash?** Speed. Flash is optimized for low-latency responses at scale. The entire decomposition pipeline (parse panic input → return structured plan) must complete in under 5 seconds. Flash achieves this reliably.

### Backend Layer

| Technology | Purpose |
|-----------|---------|
| **Next.js API Routes** | Serverless API endpoints (App Router `route.ts` pattern) |
| **Node.js runtime** | All API routes use `export const runtime = 'nodejs'` |
| **Firebase Admin SDK** | Server-side Firestore, Auth token verification, FCM push |

### Firebase / Google Cloud Services

| Service | Purpose |
|---------|---------|
| **Firebase Authentication** | Google OAuth sign-in; JWT token issuance |
| **Cloud Firestore** | Primary database; real-time `onSnapshot()` subscriptions |
| **Firebase Cloud Messaging (FCM)** | Push notifications to browser/mobile |
| **Firebase Service Worker** | Background push message handling |
| **Google Cloud Run** | Containerized Next.js deployment (auto-scaling, serverless) |
| **Google Cloud Build** | CI/CD pipeline — builds Docker image, pushes to GCR, deploys |
| **Google Cloud Functions** | `interventionCron` — autonomous deadline intervention |
| **Google Cloud Scheduler** | Triggers `interventionCron` every 15 minutes |
| **Google Container Registry (GCR)** | Docker image storage |
| **Google Secret Manager** | Stores `FIREBASE_ADMIN_PRIVATE_KEY` securely in production |

---

## 3. Project Structure & File Map

```
c:\Project\Vibe2Ship\
├── src/
│   ├── app/                         ← Next.js App Router pages + API
│   │   ├── api/
│   │   │   ├── panic/route.ts       ← POST /api/panic — Core AI endpoint
│   │   │   ├── execute/route.ts     ← POST /api/execute — Streaming SSE
│   │   │   ├── tasks/route.ts       ← GET/PATCH/DELETE /api/tasks
│   │   │   └── fcm-token/route.ts   ← POST /api/fcm-token
│   │   ├── dashboard/page.tsx       ← Main workspace (protected route)
│   │   ├── landing/                 ← Landing page components
│   │   ├── page.tsx                 ← Root landing page
│   │   ├── layout.tsx               ← Root layout (AuthProvider wrapper)
│   │   └── globals.css              ← Design system / CSS variables
│   │
│   ├── components/
│   │   ├── AuthProvider.tsx         ← Firebase Auth context (React Context API)
│   │   ├── PanicIntake.tsx          ← Deadline panic input form
│   │   ├── InterventionTimeline.tsx ← Renders micro-action step cards
│   │   ├── CountdownTimer.tsx       ← Real-time live countdown display
│   │   ├── ExecutionWorkspace.tsx   ← Gemini SSE streaming modal
│   │   ├── UrgencyMeter.tsx         ← Urgency score 1–10 visualization
│   │   └── NotificationBanner.tsx  ← FCM permission request + registration
│   │
│   ├── lib/
│   │   ├── gemini.ts               ← Gemini 1.5 Flash client & decomposition logic
│   │   ├── vertex.ts               ← Schema validation + input safety checks
│   │   ├── firebase.ts             ← Browser-side Firebase SDK (Auth, Firestore, FCM)
│   │   ├── firebase-admin.ts       ← Server-side Firebase Admin SDK
│   │   ├── fcm.ts                  ← Browser-side FCM token registration
│   │   ├── fcm-server.ts           ← Server-side FCM notification sender
│   │   ├── rate-limit.ts           ← Distributed Firestore-backed rate limiter
│   │   └── utils.ts                ← Shared utilities (ID generation, formatting)
│   │
│   ├── types/
│   │   └── task.ts                 ← All TypeScript interfaces (ActionStep, FirestoreTask, etc.)
│   │
│   └── functions/
│       └── interventionCron.js     ← Google Cloud Function (autonomous cron)
│
├── Dockerfile                      ← Docker image for Cloud Run deployment
├── cloudbuild.yaml                 ← CI/CD pipeline (Cloud Build)
├── firebase.json                   ← Firebase project configuration
├── firestore.rules                 ← Firestore security rules
├── firestore.indexes.json          ← Firestore composite indexes
├── next.config.mjs                 ← Next.js configuration
├── tailwind.config.ts              ← Tailwind CSS design tokens
└── .env.local                      ← Local environment variables
```

---

## 4. How the Project is Connected — Component Graph

```
Browser (Client)
│
├── layout.tsx
│   └── AuthProvider.tsx          [React Context]
│       ├── firebase.ts           [Client SDK — Auth]
│       └── exposes: { user, signIn, signOut, getIdToken }
│
├── page.tsx (Landing)
│   └── [Google Sign-In button] → AuthProvider.signInWithGoogle()
│
└── dashboard/page.tsx            [Protected: redirects if !user]
    ├── PanicIntake.tsx
    │   └── POST /api/panic       [→ gemini.ts → vertex.ts → Firestore]
    │
    ├── InterventionTimeline.tsx
    │   ├── CountdownTimer.tsx    [date-fns countdown, 1-second interval]
    │   ├── UrgencyMeter.tsx      [score 1-10 → visual state]
    │   └── ExecutionWorkspace.tsx
    │       └── POST /api/execute [→ gemini.ts streaming → SSE → UI]
    │
    └── NotificationBanner.tsx
        ├── fcm.ts                [requestPermission → getToken]
        └── POST /api/fcm-token  [→ Firestore users + fcm_tokens]

Server (Next.js API Routes — Node.js runtime on Cloud Run)
│
├── /api/panic
│   ├── firebase-admin.ts        [verifyAuthToken]
│   ├── rate-limit.ts            [checkRateLimitDistributed — Firestore]
│   ├── vertex.ts                [checkInputSafety + validateDecompositionSchema]
│   ├── gemini.ts                [decomposeDeadline → Gemini 1.5 Flash]
│   └── firebase-admin.ts        [write to Firestore tasks + users]
│
├── /api/execute
│   ├── firebase-admin.ts        [verifyAuthToken]
│   ├── rate-limit.ts            [checkRateLimitDistributed]
│   └── gemini.ts                [executeStepStreaming → SSE ReadableStream]
│
├── /api/tasks
│   ├── firebase-admin.ts        [verifyAuthToken]
│   ├── rate-limit.ts            [checkRateLimitDistributed]
│   └── firebase-admin.ts        [Firestore CRUD]
│
└── /api/fcm-token
    ├── firebase-admin.ts        [verifyAuthToken]
    ├── rate-limit.ts            [checkRateLimitDistributed]
    └── firebase-admin.ts        [write to users + fcm_tokens]

Google Cloud (Autonomous Background)
│
└── interventionCron.js          [Cloud Function — HTTP trigger]
    ├── Cloud Scheduler           [Fires every 15 minutes]
    ├── Firestore                 [Queries tasks WHERE deadline < 2h]
    └── Firebase Admin Messaging  [Sends FCM push notifications]
```

---

## 5. Data Flow — End-to-End Request Lifecycle

### Flow A: User Submits a Deadline ("Panic Input")

```
1. User types panic text in PanicIntake.tsx
   │
2. PanicIntake calls POST /api/panic with:
   { raw_input: "...", fcm_token: "..." }
   Authorization: Bearer <Firebase JWT>
   │
3. /api/panic middleware chain:
   ├─ [Auth] verifyAuthToken(header) → decode JWT → get userId
   ├─ [Rate Limit] checkRateLimitDistributed("panic:{userId}", 10, 60s)
   │                → Firestore _rate_limits/{key} atomic transaction
   ├─ [Safety] checkInputSafety(raw_input)
   │                → length checks + prompt injection regex
   └─ [AI] decomposeDeadline(raw_input)
            → gemini.ts → Gemini 1.5 Flash (JSON mode)
            → TASK_DECOMPOSITION_SCHEMA enforced
            → returns { task_name, true_deadline, urgency_score, action_steps[] }
   │
4. validateDecompositionSchema(geminiResponse)
   → Vertex AI guardrails — validates all fields, sanitizes data
   │
5. Build FirestoreTask document:
   { id, user_id, task_name, true_deadline, urgency_score, action_steps[], ... }
   │
6. Write to Firestore:
   ├─ tasks/{taskId}          → full task document
   └─ users/{userId}          → last_active, active_task_count++, fcm_token
   │
7. Return JSON response:
   { success: true, task: FirestoreTask, meta: { taskId, responseTimeMs, stepsCount } }
   │
8. Dashboard re-renders with InterventionTimeline showing all steps
   └─ CountdownTimer starts ticking immediately
```

### Flow B: User Executes a Step (AI Workspace)

```
1. User clicks "Execute" on a micro-action step card
   │
2. ExecutionWorkspace.tsx opens modal with step context
   │
3. POST /api/execute with:
   { step_id: "step_001", task_id: "task_xxx", ai_starter_prompt: "..." }
   Authorization: Bearer <Firebase JWT>
   │
4. /api/execute middleware:
   ├─ [Auth] verifyAuthToken
   └─ [Rate Limit] checkRateLimitDistributed("execute:{userId}", 20, 60s)
   │
5. executeStepStreaming(step, taskContext)
   → gemini.ts → Gemini 1.5 Flash (streaming mode)
   → Returns ReadableStream<Uint8Array>
   │
6. Response: Content-Type: text/event-stream (SSE)
   Each chunk: data: {"type":"text","content":"..."}
   Final:      data: {"type":"done","content":""}
   │
7. ExecutionWorkspace reads SSE stream:
   → marked.parse(content) → DOMPurify.sanitize(html)
   → Real-time rendered markdown in the modal
```

### Flow C: Autonomous Intervention (No User Action Required)

```
Cloud Scheduler → Every 15 minutes → HTTP GET interventionCron
   │
1. interventionCron queries Firestore:
   tasks WHERE archived==false
        AND true_deadline <= (now + 120min)
        AND true_deadline >= now
   LIMIT 100
   │
2. For each task:
   ├─ Find incomplete action steps
   ├─ Get user's FCM token from fcm_tokens/{userId}
   ├─ Calculate minutesRemaining
   └─ Build notification payload (urgency-aware title, body, actions)
   │
3. messaging.send(notification)
   → High-priority FCM push to user's device/browser
   → Notification includes: task name, next step, time remaining
   → Action buttons: [⚡ Execute Now] [⏱️ Snooze 15m]
   │
4. Log to intervention_logs/{autoId}
```

---

## 6. Microtasks — How Action Steps Work

Each "microtask" (called `action_step` in the codebase) is a structured unit of work generated by Gemini 1.5 Flash.

### ActionStep Data Shape

```typescript
interface ActionStep {
  step_id: string;           // e.g., "step_001", "step_002"
  title: string;             // e.g., "Write IEEE-format abstract"
  duration_minutes: number;  // e.g., 20 (between 5 and 180)
  action_type: ActionType;   // write | research | review | code | design |
                             // communicate | organize | calculate | present | submit
  ai_starter_prompt: string; // A highly specific, immediately actionable AI prompt
  completed: boolean;        // Updated via PATCH /api/tasks
  started_at: string | null; // ISO timestamp
  completed_at: string | null; // ISO timestamp
}
```

### How Gemini Generates Microtasks

The `decomposeDeadline()` function in `src/lib/gemini.ts` sends a structured prompt to Gemini 1.5 Flash using **JSON mode** (`responseMimeType: 'application/json'`). This forces Gemini to return a strictly structured response matching `TASK_DECOMPOSITION_SCHEMA`.

**Key constraints enforced in the schema:**
- Minimum 3 steps, maximum 12 steps
- Each step's `duration_minutes`: 5–180 minutes
- Steps must be sequential and cover the total available time
- The `ai_starter_prompt` field must be "immediately usable" — context-rich, specific, and actionable

### Urgency Score Calculation

```
Hours Remaining → Urgency Score
───────────────────────────────
> 168 hours (1 week+)  → 1
≤ 168 hours (1 week)   → 2
≤ 72 hours (3 days)    → 3
≤ 48 hours (2 days)    → 4
≤ 24 hours             → 5
≤ 12 hours             → 6
≤ 8 hours              → 7
≤ 6 hours              → 8
≤ 4 hours              → 9
≤ 2 hours or expired   → 10 (CRITICAL)
```

The urgency score drives the **entire UI visual state** — colors shift from green → amber → orange → red, with increasing animation intensity (subtle pulse → aggressive strobe at score 10).

### Microtask Step Lifecycle

```
PENDING
  │
  ├─ User clicks "Execute"  → AI_WORKSPACE_OPEN → Gemini streams content
  │
  └─ User clicks "Complete" → COMPLETED
                               (PATCH /api/tasks → Firestore update → real-time UI sync)
```

State is persisted to Firestore via `PATCH /api/tasks` on every step status change.

---

## 7. Middleware Layer (Auth, Rate Limiting, Safety)

### Overview

Every API route runs through a consistent middleware chain **before** any business logic executes:

```
Request → [Auth Verification] → [Rate Limit Check] → [Input Validation] → [Business Logic]
```

### 7.1 Authentication Middleware

**File:** `src/lib/firebase-admin.ts` — `verifyAuthToken()`

```
Client sends: Authorization: Bearer <Firebase ID Token>
  │
Server calls: getAdminAuth().verifyIdToken(token)
  │
Returns: { uid: string, email: string }
  │
Failure: 401 Unauthorized
```

> **Security Principle:** The `user_id` is **never** read from the request body. It is extracted exclusively from the verified Firebase JWT. This prevents user impersonation attacks.

### 7.2 Distributed Rate Limiting

**File:** `src/lib/rate-limit.ts` — `checkRateLimitDistributed()`

The rate limiter uses **Firestore atomic transactions** so limits work correctly across all Cloud Run replica instances (not just one process's memory).

| Endpoint | Limit |
|----------|-------|
| `POST /api/panic` | 10 requests / 60 seconds per user |
| `POST /api/execute` | 20 requests / 60 seconds per user |
| `GET /api/tasks` | 60 reads / 60 seconds per user |
| `PATCH /api/tasks` | 30 updates / 60 seconds per user |
| `DELETE /api/tasks` | 20 deletes / 60 seconds per user |
| `POST /api/fcm-token` | 5 registrations / 3600 seconds per user |

**How it works:**

```
checkRateLimitDistributed("panic:uid_abc", 10, 60000)
  │
  Firestore transaction on _rate_limits/panic_uid_abc:
  ├─ Document doesn't exist → create { count: 1, resetAt: now+60s } → ALLOW
  ├─ Document exists, window expired → reset { count: 1, resetAt: now+60s } → ALLOW
  ├─ Document exists, count < 10 → increment count → ALLOW
  └─ Document exists, count >= 10 → DENY → 429 Too Many Requests
```

**Fail-open design:** If the Firestore transaction fails (transient network error), the limiter allows the request and logs the error — prioritizing availability over strict enforcement in edge cases.

**Local dev fallback:** Falls back to in-memory `Map` when Firebase Admin is not configured.

### 7.3 Input Safety Check

**File:** `src/lib/vertex.ts` — `checkInputSafety()`

Applied to user input **before** sending to Gemini:

```
Checks:
├─ Input must not be empty
├─ Minimum 10 characters
├─ Maximum 5000 characters
└─ Prompt injection patterns blocked:
   "ignore previous instructions" | "you are now" | "system prompt" |
   "jailbreak" | "dan mode" | "ignore all instructions"
```

### 7.4 Schema Validation (Vertex AI Guardrails)

**File:** `src/lib/vertex.ts` — `validateDecompositionSchema()`

After Gemini returns a response, the output is validated and **sanitized** before persisting to Firestore:

```
Validations:
├─ task_name: non-empty string, max 120 chars
├─ true_deadline: valid ISO 8601 timestamp
├─ urgency_score: integer 1–10
└─ action_steps[]:
   ├─ At least 2 items, at most 15
   ├─ Each step: step_id, title, duration_minutes, action_type, ai_starter_prompt
   └─ action_type must be one of 10 valid values

Sanitization:
├─ task_name trimmed + truncated to 120 chars
├─ true_deadline normalized to ISO string
├─ urgency_score clamped to [1, 10]
└─ All string fields trimmed
```

**Response codes:**
- Invalid schema → `422 Unprocessable Entity`
- Unsafe input → `400 Bad Request`
- Auth failure → `401 Unauthorized`
- Rate limit hit → `429 Too Many Requests`

---

## 8. Real-Time Features — How Live Updates Work

### Firestore Real-Time Subscriptions

The dashboard uses Firestore's `onSnapshot()` listener to receive real-time updates without polling:

```typescript
const q = query(
  collection(db, 'tasks'),
  where('user_id', '==', userId),
  where('archived', '==', false),
  orderBy('created_at', 'desc')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setTasks(tasks);
});
```

**What this means:** When the Cloud Function (`interventionCron`) touches a Firestore document, the dashboard UI updates **instantly** — no page refresh needed.

### CountdownTimer (Live 1-Second Updates)

**File:** `src/components/CountdownTimer.tsx`

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const remaining = calculateTimeRemaining(deadline);
    setCountdown(remaining);
    const newScore = recalculateUrgencyScore(deadline);
    setCurrentUrgency(newScore);
  }, 1000);
  return () => clearInterval(interval);
}, [deadline]);
```

As time runs down, the urgency score updates automatically, triggering CSS changes that shift the visual state of the entire dashboard.

### Server-Sent Events (SSE) for AI Streaming

When the user clicks "Execute" on a step:

1. Server opens a `ReadableStream<Uint8Array>` connected to Gemini's streaming API
2. Each text chunk is formatted as `data: {"type":"text","content":"..."}\n\n`
3. Client reads with Fetch API + `getReader()`:
4. Content is rendered progressively as markdown using `marked` + sanitized with `DOMPurify`

---

## 9. Push Notifications — Autonomous Intervention Engine

### Architecture Overview

```
User Browser                      Google Cloud                    Firebase
─────────────────────────────     ─────────────────────────────   ────────────────
1. NotificationBanner.tsx
   └─ requestPermission()
   └─ register SW (/firebase-messaging-sw.js)
   └─ getToken(messaging, {vapidKey}) → FCM Registration Token
                │
                │ POST /api/fcm-token { token }
                │
2. API stores token:
   ├─ users/{userId}.fcm_token
   └─ fcm_tokens/{userId}.token
                                  3. Cloud Scheduler
                                     every 15 minutes
                                     → interventionCron
                                     │
                                     └─ Query tasks < 2h remaining
                                     └─ Get fcm_tokens/{userId}
                                     └─ messaging.send(payload)
                                                │
                                                ▼
4. Service Worker receives push       Firebase Cloud Messaging
   └─ Shows native OS notification    delivers to registered token
   └─ Action: "Execute Now"
   └─ Tap → opens /dashboard?task=xxx
```

### Notification Payload — Urgency Tiers

| Urgency Score | Title Emoji | Priority | Vibration Pattern |
|---------------|------------|----------|-------------------|
| ≥ 9 (CRITICAL) | 🚨 | `very-high` | `[200,100,200,100,200]` |
| ≥ 7 (HIGH) | ⚠️ | `high` | `[200,100,200]` |
| < 7 (MEDIUM) | ⏰ | `high` | default |

### Foreground vs. Background Messages

- **App open (foreground):** `onMessage()` in `fcm.ts` fires → in-app toast displayed
- **App closed (background):** Firebase Service Worker intercepts push → native OS notification

---

## 10. API Routes — Complete Reference

### `POST /api/panic`
**Core AI endpoint** — transforms panic input into a structured action plan

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `raw_input` | string | ✅ | 10–5000 chars |
| `fcm_token` | string | ❌ | Device push token |

**Headers:** `Authorization: Bearer <Firebase JWT>`

**Response (201):**
```json
{
  "success": true,
  "task": {
    "id": "task_abc123",
    "user_id": "uid_...",
    "task_name": "IEEE Paper — ML in Smart Grid Optimization",
    "true_deadline": "2024-01-15T08:00:00.000Z",
    "urgency_score": 9,
    "action_steps": [{ "step_id": "step_001", "title": "...", "duration_minutes": 20, ... }],
    "archived": false
  },
  "meta": { "taskId": "task_abc123", "responseTimeMs": 2341, "stepsCount": 8 }
}
```

---

### `POST /api/execute`
**Step execution endpoint** — streams AI-generated content for a specific step via SSE

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | ✅ |
| `step_id` | string | ✅ |
| `ai_starter_prompt` | string | ✅ (max 5000 chars) |

**Response:** `Content-Type: text/event-stream`
```
data: {"type":"text","content":"## Research Framework\n\n"}
data: {"type":"text","content":"Here are the key sources..."}
data: {"type":"done","content":""}
```

---

### `GET /api/tasks`
Fetch all active (non-archived) tasks for the authenticated user. Returns up to 20 tasks, ordered newest first.

### `PATCH /api/tasks`
Update a step's completion status.
```json
{ "taskId": "task_abc123", "stepId": "step_002", "completed": true }
```

### `DELETE /api/tasks?taskId=xxx`
Soft-delete (archive) a task. Sets `archived: true`, decrements user's `active_task_count`.

### `POST /api/fcm-token`
Register a device's FCM push token.
```json
{ "token": "d7x9..." }
```

---

## 11. Firebase Architecture — Schema & Security Rules

### Firestore Collections

#### `tasks/{taskId}`
```typescript
{
  id: string,                    // Server-generated ID
  user_id: string,               // Firebase Auth UID (owner)
  task_name: string,             // "IEEE Paper — ML Optimization"
  true_deadline: string,         // ISO 8601
  urgency_score: number,         // 1–10
  action_steps: ActionStep[],    // Ordered micro-steps array
  raw_input: string,             // Original panic text
  created_at: string,
  updated_at: string,
  archived: boolean,             // Soft delete flag
  fcm_token?: string,
  _serverTimestamp: Timestamp,
}
```

#### `users/{userId}`
```typescript
{
  last_active: Timestamp,
  active_task_count: number,
  fcm_token?: string,
  fcm_token_updated_at?: Timestamp,
}
```

#### `fcm_tokens/{userId}`
```typescript
{
  user_id: string,
  token: string,
  updated_at: Timestamp,
  platform: 'web',
}
```

#### `_rate_limits/{identifier}`
```typescript
{
  count: number,
  resetAt: number,     // Unix ms timestamp
  identifier: string,
}
```
> ⚠️ **Client access DENIED.** Only Firebase Admin SDK (server-side) can read/write this collection.

#### `intervention_logs/{autoId}`
```typescript
{
  task_id: string,
  user_id: string,
  step_id: string,
  minutes_remaining: number,
  urgency_score: number,
  sent_at: string,
  _serverTimestamp: Timestamp,
}
```

### Firestore Security Rules

| Collection | Client Access |
|-----------|--------------|
| `tasks/{taskId}` | Read/write only if `resource.data.user_id == request.auth.uid` |
| `users/{userId}` | Read/write only if `request.auth.uid == userId` |
| `fcm_tokens/{userId}` | Read/write only if `request.auth.uid == userId` |
| `_rate_limits/{doc}` | **DENY ALL** — server only via Admin SDK |
| Everything else | **DENY ALL** |

---

## 12. Deployment Pipeline — CI/CD on Google Cloud

### Cloud Build Pipeline (`cloudbuild.yaml`)

Triggered on every push to main branch:

```
Step 1: Build Docker Image
  └─ docker build with --build-arg for all NEXT_PUBLIC_* env vars
  └─ Tags: gcr.io/$PROJECT_ID/last-minute-life-saver:$COMMIT_SHA
           gcr.io/$PROJECT_ID/last-minute-life-saver:latest
  └─ Uses --cache-from for fast incremental builds
  └─ Machine: E2_HIGHCPU_8

Step 2: Push to Container Registry
  └─ docker push --all-tags

Step 3: Deploy to Cloud Run
  └─ gcloud run deploy last-minute-life-saver
  └─ 1 CPU, 1Gi RAM
  └─ 0–10 instances (scale to zero)
  └─ 80 concurrent requests per instance
  └─ 60s request timeout
  └─ Secrets: FIREBASE_ADMIN_PRIVATE_KEY from Secret Manager
```

### Cloud Run Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| Memory | 1Gi | Next.js SSR + Gemini streaming buffers |
| CPU | 1 vCPU | Adequate for concurrent SSE streaming |
| Min instances | 0 | Cost optimization (scale to zero) |
| Max instances | 10 | Burst capacity for hackathon demo |
| Concurrency | 80 | Next.js handles many requests per instance |
| Timeout | 60s | Gemini streaming can take up to ~15s |

### Cloud Function Deployment

```bash
gcloud functions deploy interventionCron \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=your-project-id \
  --region us-central1

gcloud scheduler jobs create http intervention-cron \
  --schedule "every 15 minutes" \
  --uri https://REGION-PROJECT.cloudfunctions.net/interventionCron \
  --http-method GET
```

---

## 13. Environment Variables

### Client-Side (`NEXT_PUBLIC_*` — exposed to browser)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client auth |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | OAuth redirect domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project identifier |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender identification |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app identifier |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push VAPID key for FCM |
| `NEXT_PUBLIC_APP_URL` | Production URL (used for CORS) |

### Server-Side (never exposed to browser)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google AI Studio API key for Gemini 1.5 Flash |
| `GEMINI_MODEL` | Model override (default: `gemini-1.5-flash`) |
| `FIREBASE_ADMIN_PROJECT_ID` | Admin SDK project |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service account private key (Secret Manager in prod) |
| `PANIC_RATE_LIMIT_MAX` | Max panic requests per window (default: 10) |
| `PANIC_RATE_LIMIT_WINDOW_MS` | Rate limit window ms (default: 60000) |

---

## 14. Real-World Usage Scenarios

### Scenario A: Student — Assignment Due Tonight

**Input:** *"Python data analysis assignment due 11:59 PM tonight. Need to clean dataset, run regression, write 500-word report. It's 7 PM."*

- **Urgency: 6/10** (4h 59m remaining) — amber UI
- 5 steps: Load & clean data → Exploratory analysis → Run regression → Interpret results → Write report → Submit
- If still working at 10 PM: Cron fires push → *"⚠️ 2h left — Execute 'Write Report' RIGHT NOW"*

### Scenario B: Professional — Client Presentation in 3 Hours

**Input:** *"Client presentation in 3 hours, slides not done, need market analysis + competitive landscape + financial projections"*

- **Urgency: 8/10** — orange-red UI, aggressive pulse animation
- 7 steps with tight time allocations
- Real-time countdown shows `02:58:44` and counting
- Clicking "Execute" on "Market Analysis" streams a full framework from Gemini in ~8 seconds

### Scenario C: Developer — Deploy Feature Before Midnight

**Input:** *"Need to deploy new auth feature by midnight. Still need to write tests, fix 2 bugs, update docs, do PR review. It's 9 PM."*

- **Urgency: 5/10** (3h remaining)
- Steps mapped to `action_type: code`, `review`, `submit`
- Each step's `ai_starter_prompt` is context-rich and immediately usable

### Scenario D: Autonomous Night-time Intervention

User goes to sleep at 2 AM with a 6 AM deadline:
1. At 4:00 AM — Cloud Scheduler triggers `interventionCron`
2. Cron finds task with deadline at 6 AM (120 min away)
3. Sends push: *"🚨 2h left — Execute 'Write Conclusion' RIGHT NOW"*
4. Action buttons: [⚡ Execute Now] [⏱️ Snooze 15m]
5. User sees notification on phone, taps → dashboard opens at the exact step

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                  │
│  ┌───────────────┐   ┌──────────────────────┐   ┌────────────────┐  │
│  │  Landing Page │   │  Dashboard            │   │  Execution     │  │
│  │  + Google     │   │  (Live Firestore RT   │   │  Workspace     │  │
│  │  Sign In      │   │   subscriptions)      │   │  (SSE Stream)  │  │
│  └──────┬────────┘   └──────────┬────────────┘   └───────┬────────┘  │
└─────────┼────────────────────────┼────────────────────────┼──────────┘
          │ OAuth                  │ REST + Firestore RT     │ SSE
          ▼                        ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIREBASE (Google Cloud)                            │
│  ┌──────────────┐  ┌────────────────────┐  ┌───────────────────────┐ │
│  │ Firebase Auth│  │  Cloud Firestore    │  │ Firebase Cloud        │ │
│  │ Google OAuth │  │  tasks/            │  │ Messaging (FCM)       │ │
│  │ JWT issuance │  │  users/            │  │ Push → Service Worker │ │
│  └──────────────┘  │  fcm_tokens/       │  └───────────────────────┘ │
│                    │  _rate_limits/     │                             │
│                    │  intervention_logs │                             │
│                    └────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
          │                        │                         │
          ▼                        ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD RUN (Next.js)                         │
│  Middleware Chain: [JWT Auth] → [Rate Limit] → [Business Logic]      │
│                                                                       │
│  POST /api/panic   → Gemini decomposition → Firestore write           │
│  POST /api/execute → Gemini streaming    → SSE response              │
│  GET/PATCH/DELETE /api/tasks → Firestore CRUD                        │
│  POST /api/fcm-token → Firestore token store                         │
└──────────────────────────────┬──────────────────────────────────────┘
          │                    │
          ▼                    ▼
┌──────────────────┐  ┌──────────────────────────────────────────────┐
│ GOOGLE AI STUDIO │  │  GOOGLE CLOUD FUNCTIONS + SCHEDULER           │
│                  │  │                                               │
│ Gemini 1.5 Flash │  │  interventionCron.js                         │
│ ├─ JSON mode     │  │  ├─ Triggered every 15min by Cloud Scheduler  │
│ ├─ Streaming     │  │  ├─ Queries Firestore for tasks < 2h          │
│ └─ Safety filter │  │  └─ Sends FCM push notifications              │
└──────────────────┘  └──────────────────────────────────────────────┘
```

---

*Built for Google Vibe2Ship Hackathon 2024 — The Last-Minute Life Saver Track*  
*MIT License · Next.js 14 · Gemini 1.5 Flash · Firebase · Google Cloud Run*
