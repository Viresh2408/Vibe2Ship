# The Last-Minute Life Saver

## AI Emergency Management System — Architecture Document

### Overview

The Last-Minute Life Saver is an autonomous, action-oriented deadline intervention engine built for the Google Vibe2Ship Hackathon ("The Last-Minute Life Saver" track). It transforms chaotic user panic about impending deadlines into structured, Gemini-powered execution plans with real-time countdowns and proactive push interventions.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js 14 App Router (React 18 + Tailwind CSS)         │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │   │
│  │  │ PanicIntake │  │ Intervention │  │  Execution    │   │   │
│  │  │  Component  │  │  Timeline    │  │  Workspace    │   │   │
│  │  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘   │   │
│  │         │                │                  │            │   │
│  │  ┌──────▼──────────────────────────────────▼───────┐    │   │
│  │  │         Firebase Client SDK                      │    │   │
│  │  │  Auth (Google)  |  Firestore RT  |  FCM Client  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ↕ HTTPS                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↕ HTTPS/SSE
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD RUN                             │
│                  (Next.js API Routes)                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ POST /panic  │  │ POST         │  │  GET/PATCH/DELETE    │  │
│  │              │  │ /execute     │  │  /tasks              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                     │
│  ┌──────▼─────────────────▼──────────────────┐                 │
│  │          Core Libraries                    │                 │
│  │  gemini.ts  |  vertex.ts  |  firebase-     │                 │
│  │             |             |  admin.ts       │                 │
│  └──────┬──────────────┬────────────┬─────────┘                 │
└─────────┼──────────────┼────────────┼─────────────────────────┘
          │              │            │
          ↓              ↓            ↓
┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│  Gemini 1.5 │  │  Vertex AI   │  │  Firebase Admin SDK      │
│  Flash API  │  │  (Validation)│  │  Firestore + FCM Admin   │
│  (AI Studio)│  └──────────────┘  └──────────────────────────┘
└─────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  GOOGLE CLOUD FUNCTIONS                         │
│              interventionCron.js (HTTP trigger)                 │
│                                                                 │
│  Runs every 15 minutes via Cloud Scheduler                      │
│  Queries Firestore for tasks with deadline < 120 minutes        │
│  Sends FCM push notifications via Firebase Admin SDK            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend (Next.js 14 App Router)

| Component | File | Responsibility |
|-----------|------|----------------|
| Root Layout | `src/app/layout.tsx` | Auth provider, Toaster, metadata |
| Landing Page | `src/app/page.tsx` | Hero, Google Sign-In, feature showcase |
| Dashboard | `src/app/dashboard/page.tsx` | Main workspace with Firestore RT subscription |
| PanicIntake | `src/components/PanicIntake.tsx` | Natural-language deadline input |
| InterventionTimeline | `src/components/InterventionTimeline.tsx` | Step cards with urgency theming |
| CountdownTimer | `src/components/CountdownTimer.tsx` | Real-time countdown with urgency states |
| ExecutionWorkspace | `src/components/ExecutionWorkspace.tsx` | Inline AI streaming modal |
| UrgencyMeter | `src/components/UrgencyMeter.tsx` | SVG ring urgency visualization |
| NotificationBanner | `src/components/NotificationBanner.tsx` | FCM push registration flow |
| AuthProvider | `src/components/AuthProvider.tsx` | Firebase Auth context |

### Backend (API Routes on Cloud Run)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/panic` | POST | Gemini decomposition + Firestore persistence |
| `/api/execute` | POST | Gemini SSE streaming for step execution |
| `/api/tasks` | GET/PATCH/DELETE | Task and step CRUD operations |
| `/api/fcm-token` | POST | FCM token registration |

### Libraries

| File | Purpose |
|------|---------|
| `src/lib/gemini.ts` | Gemini 1.5 Flash client, schema, streaming |
| `src/lib/vertex.ts` | Schema validation, safety checks, rate limiting |
| `src/lib/firebase.ts` | Client SDK singleton (Auth, Firestore, FCM) |
| `src/lib/firebase-admin.ts` | Admin SDK singleton (server-only) |
| `src/lib/fcm.ts` | FCM client-side utilities (token requests, service worker registration, foreground listener) |
| `src/lib/fcm-server.ts` | FCM server-side utilities (sending push notifications via Firebase Admin SDK) |
| `src/lib/utils.ts` | Countdown, urgency mapping, formatters |
| `src/types/task.ts` | TypeScript interfaces for all data models |

---

## Data Flow

### Task Creation Flow
1. User types panic description → `PanicIntake` component
2. POST to `/api/panic` with Firebase Auth token
3. Rate limit check via `vertex.ts`
4. Input safety check (injection, length validation)
5. Gemini 1.5 Flash generates structured JSON plan
6. Vertex AI schema validation + sanitization
7. Firestore write via Admin SDK
8. Response returned to client
9. Firestore real-time subscription updates dashboard

### Step Execution Flow
1. User clicks "Execute" on a step → `ExecutionWorkspace` opens
2. POST to `/api/execute` with step's `ai_starter_prompt`
3. Gemini 1.5 Flash streams response via SSE
4. Client reads SSE stream and renders markdown in real-time
5. User marks step complete → PATCH `/api/tasks`
6. Firestore updated → real-time subscription refreshes UI

### Proactive Intervention Flow
1. Cloud Scheduler triggers `interventionCron` every 15 minutes
2. Queries Firestore for tasks with `deadline < 120 minutes`
3. Gets user FCM tokens from `fcm_tokens` collection
4. Sends high-priority push notifications via Firebase Messaging
5. User clicks notification → opens dashboard focused on that task

---

## Scalability Considerations

- **Cloud Run**: Auto-scales 0→10 instances, handles traffic spikes
- **Firestore**: Horizontally sharded, handles millions of concurrent users
- **Rate Limiting**: Per-user in-memory limits (upgrade to Redis for distributed)
- **Gemini**: Uses Flash tier for low-latency responses
- **FCM**: Firebase handles delivery at global scale
- **CDN**: Next.js static assets served via CDN edge nodes
