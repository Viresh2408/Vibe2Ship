/**
 * Firebase Client SDK — Browser-side initialization
 *
 * Initializes Firebase for client-side use:
 * - Authentication (Google Sign-In)
 * - Firestore real-time subscriptions
 * - Cloud Messaging (push notifications)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

// ─── Firebase Config ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ─── Singleton Initialization ─────────────────────────────────────────────────

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let messagingInstance: Messaging | null = null;

function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
}

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  initializeFirebase();
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export function getFirebaseApp(): FirebaseApp {
  if (!app) initializeFirebase();
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) initializeFirebase();
  return db;
}

export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  return provider;
}

/**
 * Gets the Firebase Messaging instance.
 * Returns null in environments where FCM is not supported (SSR, Safari without permission).
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;

  if (messagingInstance) return messagingInstance;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    if (!app) initializeFirebase();
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    console.warn('[FCM] Messaging not supported in this environment');
    return null;
  }
}

// Re-export for convenience
export { GoogleAuthProvider };
