# Troubleshooting — The Last-Minute Life Saver

## Common Issues & Solutions

---

## Environment & Setup Issues

### ❌ `Error: GEMINI_API_KEY environment variable is not set`

**Cause**: Missing API key in environment  
**Fix**:
1. Copy `.env.example` → `.env.local`
2. Get API key from [https://aistudio.google.com](https://aistudio.google.com)
3. Add `GEMINI_API_KEY=your_key` to `.env.local`
4. Restart the dev server (`npm run dev`)

---

### ❌ Firebase Authentication Popup Blocked

**Cause**: Browser popup blocker  
**Fix**:
1. Allow popups for `localhost:3000` in browser settings
2. Or use `signInWithRedirect()` instead of `signInWithPopup()` in `AuthProvider.tsx`

---

### ❌ `FirebaseError: Missing or insufficient permissions`

**Cause**: Firestore security rules not deployed  
**Fix**:
1. Copy rules from `docs/firebase_architecture.md`
2. Create `firestore.rules` file
3. Run `firebase deploy --only firestore:rules`

---

### ❌ Firestore Composite Index Error

**Cause**: Required indexes not created  
**Fix**: Click the link in the error message (Firebase auto-generates the index creation URL), or run:
```bash
firebase deploy --only firestore:indexes
```

---

### ❌ `FIREBASE_ADMIN_PRIVATE_KEY` format error

**Cause**: Newlines not escaped properly  
**Fix**: In `.env.local`, the key must have `\n` (not actual newlines):
```env
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

---

## API & AI Issues

### ❌ `/api/panic` returns 502 — "Gemini returned invalid JSON"

**Cause**: Temperature too high or prompt variation  
**Fix**: This is rare at `temperature: 0.4`. If it persists:
1. Check Google AI Studio quota limits
2. Check API key validity
3. Try rephrasing the input

---

### ❌ `/api/panic` returns 422 — "Schema validation failed"

**Cause**: Gemini returned a structurally valid JSON but failed schema checks  
**Fix**: 
1. The user should retry — this is transient
2. Check `validation_errors` in the response for specific issues
3. If systematic: lower the temperature to `0.3` in `src/lib/gemini.ts`

---

### ❌ `/api/execute` streaming stops early

**Cause**: Request timeout or connection drop  
**Fix**:
1. Click "Retry" button in the ExecutionWorkspace
2. Check Cloud Run timeout setting (must be ≥ 60s for streaming)
3. Check that `X-Accel-Buffering: no` header is set (already in route.ts)

---

### ❌ Gemini returns deadline in wrong timezone

**Cause**: User's input timezone ambiguity  
**Fix**: Be explicit in the input: "due 8 AM EST tomorrow" or "due 08:00 IST January 15"

---

## Push Notification Issues

### ❌ Notification permission not appearing

**Cause**: Notification API requires HTTPS in most browsers (except localhost)  
**Fix**: 
1. On localhost, use Chrome (most permissive)
2. In production, ensure HTTPS (Cloud Run provides this by default)
3. Check `public/firebase-messaging-sw.js` has correct Firebase config

---

### ❌ Background notifications not showing

**Cause**: Service worker not registered or wrong VAPID key  
**Fix**:
1. Open DevTools → Application → Service Workers → Check registration
2. Verify `NEXT_PUBLIC_FIREBASE_VAPID_KEY` matches Firebase Console
3. Verify `firebase-messaging-sw.js` uses correct Firebase config values

---

### ❌ Cloud Function not sending notifications

**Cause**: Multiple possible causes  
**Debug**:
```bash
# Check function logs
gcloud functions logs read interventionCron --region us-central1 --limit 50
```

Common fixes:
1. FCM token not registered — user must click "Enable Notifications"
2. `fcm_tokens` collection empty — POST to `/api/fcm-token` first
3. No tasks with `deadline < 120min` exist yet
4. Cloud Scheduler not configured

---

## Build & Deployment Issues

### ❌ Docker build fails — `MODULE_NOT_FOUND`

**Cause**: Missing dependencies  
**Fix**:
```bash
npm install
npm run build
```

---

### ❌ Cloud Run fails to start — Port error

**Cause**: App not listening on port 8080  
**Fix**: `next.config.ts` includes `standalone` output mode. Ensure `Dockerfile` uses `PORT=8080` and `HOSTNAME=0.0.0.0`.

---

### ❌ TypeScript build errors

**Fix**:
```bash
npm run type-check
```

Common issues:
- `firebase-admin` imports in client components → move to API routes or `src/lib/firebase-admin.ts`
- Missing `@types` packages → `npm install --save-dev @types/package-name`

---

## Local Development Tips

### Enable Real-time Firestore in Local Dev

The dashboard uses `onSnapshot()` which works with the real Firestore. For fully offline dev:
```bash
firebase emulators:start --only firestore,auth
```

Set env vars to use emulators:
```env
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### Test the Cloud Function Locally

```bash
# Install functions framework
npm install -g @google-cloud/functions-framework

# Run locally
cd src/functions
functions-framework --target=interventionCron --port=8081

# Test
curl http://localhost:8081/interventionCron
```

---

## Getting Help

1. Check [Google AI Studio docs](https://ai.google.dev/docs)
2. Check [Firebase docs](https://firebase.google.com/docs)
3. Check [Cloud Run docs](https://cloud.google.com/run/docs)
4. Review structured error logs in Cloud Logging
