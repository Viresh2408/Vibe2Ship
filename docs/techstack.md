# Tech Stack — The Last-Minute Life Saver

## Technology Choices & Rationale

---

## 1. Frontend Framework: Next.js 14 (App Router)

**Why Next.js 14?**
- **App Router** enables React Server Components and native streaming SSE responses
- **Edge Runtime** support for ultra-low latency API responses
- **Automatic code splitting** keeps the bundle small
- **Built-in TypeScript** support with zero configuration
- **ISR + SSR** flexibility for pages that need both static and dynamic content

```
next: 14.2.21
react: 18.3.1
react-dom: 18.3.1
```

---

## 2. Styling: Tailwind CSS 3.4

**Why Tailwind?**
- **Utility-first** eliminates CSS conflicts and dead code
- **JIT compiler** generates only used styles, minimizing bundle size
- **Custom design tokens** for urgency colors, animations, and shadows built directly into `tailwind.config.ts`
- **Dark mode** support with no additional configuration

```
tailwindcss: 3.4.17
```

Custom additions in `tailwind.config.ts`:
- Urgency color palette (critical/high/medium/low)
- Neon glow box-shadows
- Custom keyframe animations (urgency-pulse, countdown-tick, shimmer)
- Glassmorphism utilities

---

## 3. Primary AI: Google AI Studio — Gemini 1.5 Flash

**Why Gemini 1.5 Flash?**
- **Speed**: Optimized for rapid inference — under 3 seconds for task decomposition
- **JSON Mode**: Native `responseMimeType: "application/json"` eliminates parsing failures
- **Context Window**: 1M token context handles large dumps of user text
- **Streaming**: Native streaming support for `generateContentStream()`
- **Cost**: Flash tier optimized for high-volume, low-latency tasks

```
@google/generative-ai: 0.21.0
```

Two usage patterns:
1. **Batch (decomposition)**: `generateContent()` for task planning
2. **Streaming (execution)**: `generateContentStream()` for SSE responses

---

## 4. System Orchestration: Vertex AI SDK

**Why Vertex AI?**
- **Schema Validation**: Production-grade JSON schema enforcement
- **Safety Guardrails**: Content safety filters before Firestore persistence
- **Rate Limiting**: Enterprise-grade quota management
- **Audit Logging**: Cloud Logging integration for all AI calls

```
@google-cloud/vertexai: 1.9.0
```

Used in `src/lib/vertex.ts` for:
- `validateDecompositionSchema()` — strict schema enforcement
- `checkInputSafety()` — prompt injection prevention
- `checkRateLimit()` — per-user request throttling

---

## 5. Backend Infrastructure: Google Cloud Run

**Why Cloud Run?**
- **Serverless**: No infrastructure management
- **Auto-scaling**: 0 to N instances based on traffic
- **Container-native**: Works directly with our Docker build
- **Cost-efficient**: Pay only for request processing time
- **HTTPS by default**: Automatic SSL certificate management

Configuration in `cloudbuild.yaml`:
- 1 GiB memory, 1 vCPU
- 0 min instances (cold start acceptable)
- 10 max instances
- 80 concurrent requests per instance

---

## 6. Autonomous Interventions: Google Cloud Functions

**Why Cloud Functions?**
- **Event-driven**: HTTP trigger called by Cloud Scheduler every 15 minutes
- **Stateless**: Idempotent design handles retries safely
- **Node.js 20**: Latest LTS runtime
- **Managed scaling**: Google handles concurrency automatically

Deployment: `interventionCron.js` as HTTP Cloud Function

---

## 7. Authentication: Firebase Authentication

**Why Firebase Auth?**
- **Google Sign-In**: One-click OAuth with Google accounts
- **ID Token**: JWT tokens used to authenticate API route calls
- **Client-side SDK**: Seamless integration with React state
- **Security rules**: Firestore rules enforce user data isolation

---

## 8. Real-time Database: Cloud Firestore

**Why Firestore?**
- **Real-time subscriptions**: `onSnapshot()` listener updates UI instantly when Cloud Function modifies tasks
- **NoSQL flexibility**: Schema-free document model fits our dynamic task structure
- **Offline support**: Client SDK caches data for offline access
- **Security rules**: User-scoped data access without backend queries

Collection structure:
```
tasks/{taskId}           — Task documents with action_steps array
users/{userId}           — User metadata and FCM token
fcm_tokens/{userId}      — FCM token registry for Cloud Functions
intervention_logs/{auto} — Audit log of all sent interventions
```

---

## 9. Push Notifications: Firebase Cloud Messaging (FCM)

**Why FCM?**
- **Web Push**: Works in Chrome, Edge, and Firefox
- **Background delivery**: Service worker handles messages when app is closed
- **Priority controls**: `high` urgency header for immediate delivery
- **Free tier**: No cost for standard push volumes

---

## 10. UI Enhancement Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | 0.469 | 500+ clean SVG icons |
| `framer-motion` | 11.x | Smooth component transitions |
| `react-hot-toast` | 2.4.1 | Non-intrusive toast notifications |
| `date-fns` | 4.x | Timezone-safe date calculations |
| `marked` | 15.x | Markdown → HTML rendering in workspace |
| `clsx` + `tailwind-merge` | latest | Conditional className management |

---

## Development Environment

| Tool | Version |
|------|---------|
| Node.js | 20 LTS |
| TypeScript | 5.7 |
| Package Manager | npm |
| Container Runtime | Docker |
| CI/CD | Google Cloud Build |
