# Workflow — The Last-Minute Life Saver

## User Journey & System Workflow

---

## Primary User Workflow

### Phase 1: Discovery & Onboarding (< 30 seconds)
```
User arrives at landing page
  → Views hero: "Stop Panicking. Start Executing."
  → Sees feature overview (AI decomposition, countdown, workspace, push alerts)
  → Clicks "Continue with Google"
  → Firebase Google OAuth popup
  → Redirected to Dashboard
  → Prompted to enable push notifications
```

### Phase 2: Emergency Intake (< 15 seconds)
```
User sees "Panic Intake" text field
  → Types or dictates their deadline situation in plain English
    Example: "Engineering paper due 8 AM tomorrow, haven't started,
              need abstract, 3 body sections, bibliography"
  → Presses Cmd+Enter or clicks "Generate Plan"
  → Loading state: "🧠 Analyzing your deadline..."
  → Gemini 1.5 Flash processes in ~3-5 seconds
  → Task card appears below with full action plan
```

### Phase 3: Dashboard Review (< 60 seconds)
```
User reviews generated intervention:
  → Task name: "IEEE Engineering Paper: ML in Smart Grid Optimization"
  → Urgency score: 9/10 — CRITICAL (pulsing red ring)
  → Countdown: "08:47:23" (8 hours remaining)
  → Action steps displayed as timeline:
    1. ✍️ Write paper outline (15m)
    2. 🔍 Research ML + Smart Grid literature (45m)
    3. ✍️ Write abstract (20m)
    4. ✍️ Write Section 1: Introduction (30m)
    5. ✍️ Write Section 2: Methodology (45m)
    6. ✍️ Write Section 3: Results & Discussion (45m)
    7. 📋 Compile bibliography in IEEE format (20m)
    8. 👁️ Review and proofread (30m)
    9. 🚀 Submit via portal (10m)
```

### Phase 4: Execution (Ongoing)
```
User clicks "Execute" on Step 1 → "Write paper outline"
  → ExecutionWorkspace modal opens
  → ai_starter_prompt pre-loaded, Gemini streams response
  → Full outline appears within 10 seconds
  → User copies output, works in their editor
  → Returns, clicks "Mark Done" on Step 1
  → Step grays out, progress bar updates
  → Continues to Step 2...
```

### Phase 5: Proactive Interventions (Autonomous)
```
[Background — every 15 minutes via Cloud Function]
  → Scheduler triggers interventionCron
  → Query: tasks where deadline < 2 hours
  → User's task found: 90 minutes remaining
  → FCM push notification sent:
    Title: "🚨 90 MINUTES REMAINING"
    Body: "Engineering Paper: Execute 'Write conclusion' RIGHT NOW"
    Actions: [⚡ Execute Now] [⏱️ Snooze 15m]
  → User clicks notification
  → Browser opens to /dashboard?task=task_xyz
  → Focused on the specific task card
```

---

## System Interaction Workflow

### API Interaction Sequence
```
Client                    Cloud Run              Gemini          Firestore
  │                          │                    │                 │
  ├──POST /api/panic──────────►                   │                 │
  │  {raw_input, user_id}    │                    │                 │
  │                          ├──verifyIdToken()──►                  │
  │                          │◄─────────────────────────── uid      │
  │                          │                    │                 │
  │                          ├──checkRateLimit()  │                 │
  │                          ├──checkInputSafety()│                 │
  │                          │                    │                 │
  │                          ├──generateContent()─►                 │
  │                          │  system prompt +   │                 │
  │                          │  user input        │                 │
  │                          │◄───── JSON plan ───┤                 │
  │                          │                    │                 │
  │                          ├──validateSchema()  │                 │
  │                          ├────────────────────┼──set(task)─────►│
  │                          │                    │                 │
  │◄───── {task: FirestoreTask} ─────────────────────────────────  │
  │                          │                    │                 │
  ├── onSnapshot() ──────────┼────────────────────┼────────────────►│
  │   (real-time listener)   │                    │◄── live update ─┤
```

### Streaming Execution Sequence
```
Client                    Cloud Run              Gemini
  │                          │                    │
  ├──POST /api/execute────────►                   │
  │  {step_id, ai_starter_prompt}                 │
  │                          ├──generateContentStream()─►
  │                          │  streaming prompt  │
  │◄── SSE: data:{text:"..."}┤◄───── chunk 1 ────┤
  │◄── SSE: data:{text:"..."}┤◄───── chunk 2 ────┤
  │◄── SSE: data:{text:"..."}┤◄───── chunk N ────┤
  │◄── SSE: data:{done:""}   │                    │
  │  render markdown live    │                    │
```

---

## Error Handling Workflow

```
User submits panic input
  → Rate limit exceeded → Toast: "Too many requests, wait 60s"
  → Input too short → Toast: "Please describe in more detail"
  → Gemini error → Toast: "AI analysis failed, try rephrasing"
  → Schema validation fail → Toast: "AI quality check failed, retry"
  → Firestore error → Task still shown (persistence non-fatal)
  → Auth expired → Redirect to login page
```

---

## Cloud Function Workflow

```
Cloud Scheduler (every 15 min)
  → HTTP GET: /interventionCron
    ├── Query Firestore: tasks where deadline <= now + 120min
    │                          AND archived == false
    ├── For each task:
    │   ├── Get incomplete steps
    │   ├── Fetch user FCM token from fcm_tokens collection
    │   ├── Calculate minutes remaining
    │   ├── Build FCM payload with urgency emoji + step title
    │   ├── Send via Firebase Admin Messaging
    │   └── Log to intervention_logs collection
    └── Return summary JSON with counts
```
