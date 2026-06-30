# Environment Setup — The Last-Minute Life Saver

## Step-by-Step Environment Configuration

---

## 1. Copy the Template

```bash
cp .env.example .env.local
```

> **⚠️ Never commit `.env.local` to version control**

---

## 2. Google AI Studio — Gemini API Key

**What**: API key for Gemini 1.5 Flash (task decomposition + execution)

**How to get it**:
1. Go to [https://aistudio.google.com](https://aistudio.google.com)
2. Click **Get API key** → **Create API key**
3. Copy the key

```env
GEMINI_API_KEY=AIzaSy...your_key_here
```

---

## 3. Firebase Project Setup

**Create project**:
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → Name it (e.g., "last-minute-life-saver")
3. Enable Google Analytics (optional)

**Enable Firebase services**:
- Authentication → Sign-in method → Google → Enable
- Firestore Database → Create database → Production mode → `us-central1`
- Cloud Messaging → Already enabled by default

### Firebase Client Config

1. Project Settings → General → Your apps → Add app (Web `</>`)
2. Register app, copy config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Firebase VAPID Key (for Web Push)

1. Project Settings → Cloud Messaging → Web configuration
2. Click **Generate key pair** under Web Push certificates
3. Copy the **Key pair** value:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNtSi...your_vapid_key
```

### Firebase Admin SDK (Server-side)

1. Project Settings → Service accounts
2. Click **Generate new private key** → Download JSON file
3. Extract values from the JSON:

```env
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

> **Note**: The private key must be quoted and newlines replaced with `\n`

---

## 4. Service Worker Configuration

The file `public/firebase-messaging-sw.js` requires your Firebase config hardcoded (service workers cannot access environment variables):

Open the file and replace placeholder values:
```javascript
firebase.initializeApp({
  apiKey: 'YOUR_ACTUAL_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});
```

---

## 5. Firebase Auth Domain

Add your development URL to Firebase authorized domains:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add: `localhost` (already there)
3. Add your Cloud Run URL when deployed

---

## 6. Firestore Security Rules

Deploy security rules from `docs/firebase_architecture.md`:

```bash
# Create firestore.rules file
# Deploy:
firebase deploy --only firestore:rules

# Deploy indexes:
firebase deploy --only firestore:indexes
```

---

## 7. Verify Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 and:
1. ✅ Page loads without errors
2. ✅ "Continue with Google" button works
3. ✅ Dashboard loads after sign-in
4. ✅ Panic input submits successfully (requires GEMINI_API_KEY)
5. ✅ Notification banner appears (requires FCM setup)

---

## Complete `.env.local` Example

```env
# ─── Gemini ──────────────────────────────────────────────
GEMINI_API_KEY=AIzaSy_your_actual_key_here

# ─── Google Cloud ────────────────────────────────────────
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# ─── Firebase Client ─────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy_your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNtSi_your_vapid_key

# ─── Firebase Admin ───────────────────────────────────────
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"

# ─── App ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```
