# Backend Requirements — The Last-Minute Life Saver

## Production Backend Specification

---

## Server Requirements

### Cloud Run Service
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Memory | 1 GiB | Next.js + Firebase Admin SDK |
| CPU | 1 vCPU | Sufficient for API routes |
| Min instances | 0 | Cost optimization |
| Max instances | 10 | Handles traffic spikes |
| Concurrency | 80 | Standard for Node.js |
| Request timeout | 60s | Covers Gemini + Firestore latency |
| Port | 8080 | Cloud Run standard |

### Runtime
- **Node.js**: 20 LTS
- **Next.js**: 14 (standalone output mode for minimal Docker image)

---

## API Route Requirements

### Authentication
All API routes must:
1. Extract `Authorization: Bearer {token}` header
2. Verify token via `firebase-admin/auth.verifyIdToken()`
3. Return 401 if missing, invalid, or expired

### Error Handling
All routes must:
1. Wrap entire handler in try/catch
2. Log errors with structured JSON (userId, route, error message)
3. Never expose stack traces to clients
4. Return appropriate HTTP status codes

### Request Validation
All POST routes must:
1. Parse JSON body with try/catch
2. Validate required fields before processing
3. Return 400 with descriptive error messages for invalid input

---

## Rate Limiting Requirements

### Implementation
Current: In-memory per-process (suitable for single-instance Cloud Run)
Production: Redis-based distributed rate limiting

| Route | Max Requests | Window |
|-------|-------------|--------|
| `/api/panic` | 10 | 60 seconds |
| `/api/execute` | 20 | 60 seconds |
| `/api/tasks` (GET) | 100 | 60 seconds |
| `/api/tasks` (PATCH) | 50 | 60 seconds |
| `/api/fcm-token` | 5 | 60 seconds |

### Rate Limit Response Headers
```
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1703505660000
```

---

## Data Persistence Requirements

### Firestore Write Requirements
- All task documents must include `user_id` field for security rule enforcement
- All documents must include `_serverTimestamp` (FieldValue.serverTimestamp())
- Soft delete pattern: `archived: true` instead of document deletion
- Update `updated_at` on every mutation

### Firestore Query Requirements
- All queries must include `user_id == auth.uid` filter
- All collection queries must include `archived == false` filter
- Use `limit(20)` on all list queries
- Required composite indexes must be deployed before production

---

## Environment Variable Requirements

### Server-Side Only (Never Exposed to Client)
- `GEMINI_API_KEY` — Google AI Studio key
- `FIREBASE_ADMIN_PROJECT_ID` — Firebase project ID
- `FIREBASE_ADMIN_CLIENT_EMAIL` — Service account email
- `FIREBASE_ADMIN_PRIVATE_KEY` — Service account private key (via Secret Manager)

### Client-Side (NEXT_PUBLIC_ prefix, safe to expose)
- All `NEXT_PUBLIC_FIREBASE_*` variables
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` — FCM VAPID key

### Validation on Startup
- `gemini.ts` throws `Error` if `GEMINI_API_KEY` is undefined
- `firebase-admin.ts` falls back to ADC if admin env vars are missing

---

## Security Requirements

### HTTP Headers
Enforced in `next.config.ts`:
- `X-Frame-Options: DENY` — Prevent clickjacking
- `X-Content-Type-Options: nosniff` — Prevent MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Service Worker
- `Cache-Control: no-cache` on `/firebase-messaging-sw.js`
- `Service-Worker-Allowed: /` header

### Firestore
- Security rules restrict all data to `auth.uid == resource.data.user_id`
- Cloud Functions use Admin SDK which bypasses rules (by design)

---

## Cloud Function Requirements

### Function Specification
- Runtime: Node.js 20
- Memory: 512 MB
- Timeout: 300 seconds
- Max instances: 5
- Trigger: HTTP (called by Cloud Scheduler)

### Idempotency
The function is idempotent — calling it multiple times with the same state produces the same result. Duplicate notifications are prevented by the 15-minute scheduling interval.

### Error Handling
- Individual notification failures do not stop batch processing
- All errors logged to Cloud Logging
- Function returns summary JSON with success/failure counts

---

## Performance Requirements

| Metric | Target | SLA |
|--------|--------|-----|
| `/api/panic` response time | < 5 seconds | P95 |
| `/api/execute` first token | < 3 seconds | P95 |
| `/api/tasks` GET response | < 500ms | P99 |
| FCM notification delivery | < 30 seconds | Best effort |
| Dashboard initial load | < 2 seconds | P95 |
| Firestore subscription update | < 1 second | Real-time |
