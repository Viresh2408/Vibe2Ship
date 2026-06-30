# APIs — The Last-Minute Life Saver

## Complete API Reference

---

## Internal API Routes (Next.js App Router)

### POST `/api/panic`
**Purpose**: Analyze a deadline panic input and return a structured action plan

**Authentication**: Required — Firebase ID token in `Authorization: Bearer {token}` header

**Rate Limit**: 10 requests/minute per user

**Request Body**:
```json
{
  "raw_input": "Engineering paper due 8 AM tomorrow, haven't started, need abstract and 3 body sections",
  "user_id": "firebase_uid_here",
  "fcm_token": "fcm_registration_token_optional"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "task": {
    "id": "task_1703505600000_abc123",
    "user_id": "firebase_uid",
    "task_name": "IEEE Engineering Paper: ML in Smart Grid Optimization",
    "true_deadline": "2024-01-15T08:00:00.000Z",
    "urgency_score": 9,
    "action_steps": [
      {
        "step_id": "step_001",
        "title": "Create detailed paper outline",
        "duration_minutes": 15,
        "action_type": "organize",
        "ai_starter_prompt": "Create a detailed outline for an engineering paper on ML in Smart Grid Optimization...",
        "completed": false,
        "started_at": null,
        "completed_at": null
      }
    ],
    "raw_input": "...",
    "created_at": "2024-01-14T23:12:00.000Z",
    "updated_at": "2024-01-14T23:12:00.000Z",
    "archived": false
  },
  "meta": {
    "taskId": "task_1703505600000_abc123",
    "responseTimeMs": 2847,
    "stepsCount": 8
  }
}
```

**Error Responses**:
| Status | Error | Description |
|--------|-------|-------------|
| 400 | Input too short | Less than 10 characters |
| 400 | Disallowed content | Prompt injection detected |
| 401 | Unauthorized | Missing or invalid Firebase token |
| 422 | Schema validation failed | Gemini response didn't meet quality standards |
| 429 | Rate limit exceeded | Too many requests |
| 502 | AI analysis failed | Gemini API error |
| 500 | Internal server error | Unexpected failure |

---

### POST `/api/execute`
**Purpose**: Execute a step's AI prompt and stream Gemini output as SSE

**Authentication**: Required

**Rate Limit**: 20 requests/minute per user

**Request Body**:
```json
{
  "step_id": "step_001",
  "task_id": "task_1703505600000_abc123",
  "ai_starter_prompt": "Create a detailed outline for an engineering paper on ML...",
  "user_id": "firebase_uid"
}
```

**Success Response (200)**: Server-Sent Events stream
```
Content-Type: text/event-stream

data: {"type":"text","content":"# Paper Outline\n\n"}
data: {"type":"text","content":"## 1. Introduction\n"}
data: {"type":"text","content":"- Background on Smart Grid systems\n"}
...
data: {"type":"done","content":""}
```

**SSE Event Types**:
| Type | Description |
|------|-------------|
| `text` | Partial content chunk from Gemini |
| `done` | Stream complete |
| `error` | Error during streaming |

---

### GET `/api/tasks`
**Purpose**: Fetch all active tasks for the authenticated user

**Authentication**: Required

**Success Response (200)**:
```json
{
  "tasks": [
    { "id": "...", "task_name": "...", "urgency_score": 9, ... }
  ]
}
```

---

### PATCH `/api/tasks`
**Purpose**: Update a step's completion status

**Request Body**:
```json
{
  "taskId": "task_1703505600000_abc123",
  "stepId": "step_001",
  "completed": true
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "taskId": "task_1703505600000_abc123",
  "stepId": "step_001",
  "completed": true
}
```

---

### DELETE `/api/tasks?taskId={id}`
**Purpose**: Soft-archive a task (marks `archived: true`)

**Success Response (200)**:
```json
{ "success": true, "taskId": "task_1703505600000_abc123" }
```

---

### POST `/api/fcm-token`
**Purpose**: Register an FCM device token for push notifications

**Request Body**:
```json
{
  "token": "fcm_registration_token_string",
  "user_id": "firebase_uid"
}
```

**Success Response (200)**:
```json
{ "success": true, "message": "FCM token registered" }
```

---

## External APIs

### Google AI Studio — Gemini 1.5 Flash
- **Endpoint**: Managed by `@google/generative-ai` SDK
- **Model**: `gemini-1.5-flash`
- **Auth**: API key via `GEMINI_API_KEY` environment variable
- **Usage**: Task decomposition + step execution streaming

### Firebase Authentication REST API
- **Endpoint**: `https://identitytoolkit.googleapis.com/v1/...`
- **Usage**: Managed by Firebase SDK — not called directly

### Cloud Firestore REST API
- **Endpoint**: `https://firestore.googleapis.com/v1/...`
- **Usage**: Managed by Firebase Admin SDK — not called directly

### Firebase Cloud Messaging HTTP v1 API
- **Endpoint**: `https://fcm.googleapis.com/v1/...`
- **Usage**: Managed by Firebase Admin Messaging SDK

---

## Cloud Function API

### GET `/interventionCron` (Cloud Function HTTP trigger)
**Purpose**: Check for expiring deadlines and send push notifications

**Called by**: Cloud Scheduler every 15 minutes

**Response (200)**:
```json
{
  "success": true,
  "notificationsSent": 3,
  "notificationsFailed": 0,
  "tasksProcessed": 4,
  "skipped": 1,
  "durationMs": 1243,
  "timestamp": "2024-01-15T06:00:00.000Z"
}
```
