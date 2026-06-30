/**
 * FCM Client Utilities — Browser-side ONLY
 *
 * Handles push notification token registration and foreground message listening.
 * DO NOT import firebase-admin here — this file is used by client components.
 *
 * For server-side FCM (sending notifications), use src/lib/fcm-server.ts
 */

import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';

// ─── Client-Side: Token Registration ─────────────────────────────────────────

/**
 * Requests notification permission and gets the FCM registration token.
 * Must be called from a user interaction (button click) on the client.
 */
export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    if (!('Notification' in window)) {
      console.warn('[FCM] Notifications not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] Notification permission denied');
      return null;
    }

    // Register service worker and inject Firebase config via postMessage
    if ('serviceWorker' in navigator) {
      try {
        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // Push Firebase config (public values only) into the SW scope.
        // The SW listens for { type: 'FIREBASE_CONFIG', config: { ... } } and
        // calls firebase.initializeApp() with these values.
        const firebaseConfig = {
          apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const sw = swReg.installing ?? swReg.waiting ?? swReg.active;
        if (sw) {
          // If SW is still installing, wait for it to be ready first
          if (sw.state !== 'activated') {
            await new Promise<void>((resolve) => {
              sw.addEventListener('statechange', function handler() {
                if (sw.state === 'activated') {
                  sw.removeEventListener('statechange', handler);
                  resolve();
                }
              });
            });
          }
          sw.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
        }
      } catch (swError) {
        console.warn('[FCM] Service worker registration failed:', swError);
      }
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    return token || null;
  } catch (error) {
    console.error('[FCM] Failed to get token:', error);
    return null;
  }
}

/**
 * Listens for foreground push messages when the app is focused.
 * Returns an unsubscribe function.
 */
export async function listenForForegroundMessages(
  onMessageCallback: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, onMessageCallback);
  return unsubscribe;
}
