/**
 * Firebase Admin SDK — Server-side initialization
 *
 * Used exclusively in API routes and server-side code.
 * NEVER import this in client components.
 *
 * Handles: Firestore writes, FCM admin messaging, user verification.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getAuth, Auth } from 'firebase-admin/auth';

// ─── Credential Resolution ────────────────────────────────────────────────────

function getAdminCredential() {
  // In Cloud Run: credentials come from attached service account (ADC)
  // In local dev: use FIREBASE_ADMIN_* env vars
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    return cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Fix escaped newlines in env var
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }

  // Fallback: Application Default Credentials (Cloud Run / GCE)
  return undefined; // Firebase Admin will use ADC automatically
}

// ─── Singleton Initialization ─────────────────────────────────────────────────

let adminApp: App;
let adminDb: Firestore;
let adminMessaging: Messaging;
let adminAuth: Auth;

function initializeAdminSDK(): App {
  if (getApps().length === 0) {
    const credential = getAdminCredential();
    adminApp = initializeApp(
      credential
        ? {
            credential,
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          }
        : {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          }
    );
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

// ─── Accessor Functions ───────────────────────────────────────────────────────

export function getAdminApp(): App {
  if (!adminApp) initializeAdminSDK();
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    getAdminApp();
    adminDb = getFirestore(adminApp);
    // Use UTC timestamps
    adminDb.settings({ ignoreUndefinedProperties: true });
  }
  return adminDb;
}

export function getAdminMessaging(): Messaging {
  if (!adminMessaging) {
    getAdminApp();
    adminMessaging = getMessaging(adminApp);
  }
  return adminMessaging;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    getAdminApp();
    adminAuth = getAuth(adminApp);
  }
  return adminAuth;
}

// ─── Firestore Helpers ────────────────────────────────────────────────────────

export const COLLECTIONS = {
  TASKS: 'tasks',
  USERS: 'users',
  FCM_TOKENS: 'fcm_tokens',
} as const;

/**
 * Verifies a Firebase ID token from the Authorization header.
 * Returns the decoded token or throws if invalid.
 */
export async function verifyAuthToken(authHeader: string | null): Promise<{ uid: string; email: string | undefined }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) throw new Error('No token provided');

  const decoded = await getAdminAuth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}
