# Tasks — The Last-Minute Life Saver

## Project Task Breakdown

This document lists all implementation tasks organized by component for development tracking.

---

## Phase 1: Project Bootstrap ✅

- [x] Initialize Next.js 14 project with TypeScript
- [x] Configure Tailwind CSS with custom urgency design system
- [x] Set up TypeScript with strict mode
- [x] Create `.env.example` with all required variables
- [x] Configure `next.config.ts` with security headers and webpack overrides

---

## Phase 2: Type System & Libraries ✅

- [x] Define all TypeScript interfaces in `src/types/task.ts`
- [x] Build utility functions in `src/lib/utils.ts`
- [x] Implement Gemini 1.5 Flash engine in `src/lib/gemini.ts`
- [x] Build Vertex AI validation layer in `src/lib/vertex.ts`
- [x] Initialize Firebase client SDK in `src/lib/firebase.ts`
- [x] Initialize Firebase Admin SDK in `src/lib/firebase-admin.ts`
- [x] Build FCM utilities in `src/lib/fcm.ts`

---

## Phase 3: API Routes ✅

- [x] `POST /api/panic` — Gemini decomposition + Firestore persistence
- [x] `POST /api/execute` — Gemini SSE streaming
- [x] `GET/PATCH/DELETE /api/tasks` — Task CRUD
- [x] `POST /api/fcm-token` — Token registration

---

## Phase 4: React Components ✅

- [x] `AuthProvider` — Firebase Auth context
- [x] `CountdownTimer` — Real-time countdown with urgency states
- [x] `UrgencyMeter` — SVG ring visualization
- [x] `PanicIntake` — Natural-language deadline input
- [x] `NotificationBanner` — FCM push registration
- [x] `ExecutionWorkspace` — Inline Gemini streaming modal
- [x] `InterventionTimeline` — Step cards with execute buttons

---

## Phase 5: Pages ✅

- [x] `src/app/globals.css` — Dark theme, glassmorphism, animations
- [x] `src/app/layout.tsx` — Root layout with providers
- [x] `src/app/page.tsx` — Landing page with auth gate
- [x] `src/app/dashboard/page.tsx` — Main workspace with Firestore RT

---

## Phase 6: Cloud Infrastructure ✅

- [x] `src/functions/interventionCron.js` — Cloud Function
- [x] `public/firebase-messaging-sw.js` — FCM service worker
- [x] `public/manifest.json` — PWA manifest
- [x] `Dockerfile` — Multi-stage production build
- [x] `cloudbuild.yaml` — CI/CD pipeline

---

## Phase 7: Documentation ✅

- [x] `docs/architecture.md`
- [x] `docs/workflow.md`
- [x] `docs/techstack.md`
- [x] `docs/tasks.md`
- [x] `docs/mcp.md`
- [x] `docs/apis.md`
- [x] `docs/agents.md`
- [x] `docs/backend_requirements.md`
- [x] `docs/dataset_and_model.md`
- [x] `docs/google_cloud_deployment.md`
- [x] `docs/firebase_architecture.md`
- [x] `docs/dynamic_ui_states.md`
- [x] `docs/gemini_prompt_engineering.md`
- [x] `README.md`
- [x] `ENVIRONMENT.md`
- [x] `JUDGES_PITCH.md`
- [x] `TROUBLESHOOTING.md`

---

## Phase 8: Setup & Run (TODO for developer)

- [ ] Copy `.env.example` → `.env.local`
- [ ] Fill in all environment variable values
- [ ] Run `npm install`
- [ ] Update `public/firebase-messaging-sw.js` with actual Firebase config values
- [ ] Deploy Firestore security rules
- [ ] Deploy Firestore indexes
- [ ] Run `npm run dev` to start local development
- [ ] Deploy to Cloud Run via `cloudbuild.yaml`
- [ ] Deploy `interventionCron` Cloud Function
- [ ] Set up Cloud Scheduler for 15-minute trigger
