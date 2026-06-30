# Firebase Architecture — The Last-Minute Life Saver

## Overview

Firebase provides the real-time data layer, authentication, and push notification infrastructure for the Last-Minute Life Saver. This document details the Firestore schema, security rules, indexing strategy, and FCM configuration.

---

## Firestore Data Model

### Collection: `tasks`

**Document ID**: `task_{timestamp}_{random}` (e.g., `task_1703505600000_abc123`)

```typescript
interface FirestoreTask {
  id: string;                    // Document ID
  user_id: string;               // Firebase Auth UID
  task_name: string;             // "IEEE Paper: ML in Smart Grid"
  true_deadline: string;         // ISO 8601: "2024-01-15T08:00:00.000Z"
  urgency_score: number;         // 1–10
  raw_input: string;             // Original panic text
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
  archived: boolean;             // Soft delete flag
  fcm_token?: string;            // User's FCM token at creation time
  _serverTimestamp: Timestamp;   // Server-generated timestamp
  
  action_steps: Array<{
    step_id: string;             // "step_001"
    title: string;               // "Write paper abstract"
    duration_minutes: number;    // 20
    action_type: string;         // "write"
    ai_starter_prompt: string;   // Full prompt text
    completed: boolean;          // false
    started_at: string | null;   // ISO 8601 or null
    completed_at: string | null; // ISO 8601 or null
  }>;
}
```

### Collection: `users`

**Document ID**: Firebase Auth UID

```typescript
interface UserDocument {
  fcm_token: string;             // Latest FCM registration token
  fcm_token_updated_at: Timestamp;
  last_active: Timestamp;
  active_task_count: number;     // Incremented/decremented with tasks
}
```

### Collection: `fcm_tokens`

**Document ID**: Firebase Auth UID

```typescript
interface FCMTokenDocument {
  user_id: string;
  token: string;                 // FCM registration token
  updated_at: Timestamp;
  platform: 'web' | 'android' | 'ios';
}
```

### Collection: `intervention_logs`

**Document ID**: Auto-generated

```typescript
interface InterventionLog {
  task_id: string;
  user_id: string;
  step_id: string;
  minutes_remaining: number;
  urgency_score: number;
  sent_at: string;               // ISO 8601
  _serverTimestamp: Timestamp;
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Tasks: users can only read/write their own tasks
    match /tasks/{taskId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null 
                    && request.resource.data.user_id == request.auth.uid;
    }
    
    // Users: users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    
    // FCM Tokens: users can only manage their own tokens
    match /fcm_tokens/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    
    // Intervention logs: read-only for users, write-only via Cloud Functions
    match /intervention_logs/{logId} {
      allow read: if request.auth != null;
      allow write: if false; // Cloud Functions use Admin SDK (bypasses rules)
    }
  }
}
```

---

## Firestore Indexes

Required composite indexes (deploy via Firebase CLI):

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "archived", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "archived", "order": "ASCENDING" },
        { "fieldPath": "true_deadline", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Firebase Authentication

### Configuration
- **Provider**: Google OAuth 2.0
- **Authorized domains**: `localhost`, your Cloud Run URL, your custom domain
- **Token expiry**: 1 hour (ID tokens)
- **Session persistence**: `LOCAL` (survives browser close)

### Server-Side Verification
All API routes verify the Firebase ID token:
```typescript
const decoded = await getAdminAuth().verifyIdToken(token);
// Returns: { uid, email, exp, ... }
```

---

## Firebase Cloud Messaging (FCM) Architecture

### Token Lifecycle
```
1. User grants Notification permission
2. Firebase SDK generates FCM registration token
3. Token registered via POST /api/fcm-token → stored in Firestore
4. Token used by Cloud Function for push delivery
5. Token refreshed automatically by Firebase SDK
```

### Web Push Configuration
- **VAPID Key**: Generated in Firebase Console → Project Settings → Cloud Messaging
- **Service Worker**: `/public/firebase-messaging-sw.js`
- **Delivery**: Background messages via service worker, foreground via `onMessage()` listener

### Notification Priority
| Urgency Score | FCM Priority | Vibration | RequireInteraction |
|---------------|-------------|-----------|-------------------|
| 9–10 | very-high | 200,100,200,100,200 | true |
| 7–8 | high | 200,100,200 | true |
| 5–6 | high | 200,100,200 | false |
| < 5 | normal | default | false |

---

## Firestore Real-time Subscription

The dashboard uses an `onSnapshot()` listener for zero-latency updates:

```typescript
const unsubscribe = onSnapshot(
  query(
    collection(db, 'tasks'),
    where('user_id', '==', user.uid),
    where('archived', '==', false),
    orderBy('created_at', 'desc'),
    limit(20)
  ),
  (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTasks(tasks);
  }
);
```

This means when the Cloud Function modifies a task, the dashboard updates in real-time without any polling.
