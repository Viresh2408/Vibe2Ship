/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background push messages when the app is not in focus.
 * Served from /firebase-messaging-sw.js with no-cache headers (next.config.mjs).
 *
 * ─── How Firebase config reaches this file ────────────────────────────────────
 * Service workers cannot access environment variables or import from Next.js.
 * We solve this with two strategies:
 *
 *  1. The Next.js app injects config values as self.__FIREBASE_* globals via
 *     a <script> tag in layout.tsx before calling getToken().
 *     (These are PUBLIC values — safe to expose to the browser.)
 *
 *  2. If the app hasn't injected those globals yet (cold start), we fall back
 *     to values baked in at build time by /api/firebase-config.
 *
 * ─── To configure ────────────────────────────────────────────────────────────
 *  Fill in the NEXT_PUBLIC_FIREBASE_* env vars in .env.local.
 *  The app will automatically pass them to this file at runtime.
 */

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// ─── Lazy config initialisation ───────────────────────────────────────────────
// Firebase config is pushed into the SW scope by the main app via
// self.__FIREBASE_CONFIG (set in layout.tsx or the firebase-config API route).
// We defer initialisation until the first 'install' event so the globals
// have time to arrive.

let messagingInitialised = false;

function tryInitFirebase() {
  if (messagingInitialised) return;

  const cfg = self.__FIREBASE_CONFIG || {};

  const apiKey           = cfg.apiKey            || self.__FIREBASE_API_KEY;
  const authDomain       = cfg.authDomain         || self.__FIREBASE_AUTH_DOMAIN;
  const projectId        = cfg.projectId          || self.__FIREBASE_PROJECT_ID;
  const storageBucket    = cfg.storageBucket      || self.__FIREBASE_STORAGE_BUCKET;
  const messagingSenderId= cfg.messagingSenderId  || self.__FIREBASE_MESSAGING_SENDER_ID;
  const appId            = cfg.appId              || self.__FIREBASE_APP_ID;

  if (!apiKey || apiKey.startsWith('REPLACE') || apiKey.startsWith('your_')) {
    console.warn('[SW] Firebase config not yet available — deferring init');
    return;
  }

  try {
    // Guard against double-initialisation
    if (!firebase.apps.length) {
      firebase.initializeApp({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId });
    }

    const messaging = firebase.messaging();

    // ─── Background Message Handler ───────────────────────────────────────────
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Received background message:', payload);

      const { notification = {}, data = {} } = payload;
      const urgency = parseInt(data.urgencyScore || '0');

      const notificationTitle = notification.title || '⚡ Deadline Alert';
      const notificationOptions = {
        body:             notification.body || 'Check your active deadlines now',
        icon:             '/icons/icon-192x192.png',
        badge:            '/icons/badge-72x72.png',
        tag:              `intervention-${data.taskId || 'generic'}`,
        renotify:         true,
        requireInteraction: urgency >= 8,
        silent:           false,
        vibrate:          urgency >= 9 ? [200, 100, 200, 100, 200] : [200, 100, 200],
        timestamp:        Date.now(),
        data: {
          taskId:           data.taskId,
          url:              data.url || '/dashboard',
          urgencyScore:     data.urgencyScore,
          minutesRemaining: data.minutesRemaining,
        },
        actions: [
          { action: 'execute',    title: '⚡ Execute Now' },
          { action: 'snooze-15', title: '⏱️ Snooze 15m'  },
        ],
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    messagingInitialised = true;
    console.log('[SW] Firebase Messaging initialised for project:', projectId);
  } catch (err) {
    console.error('[SW] Firebase init failed:', err);
  }
}

// ─── Service Worker lifecycle ─────────────────────────────────────────────────

self.addEventListener('install', () => {
  console.log('[SW] Installing Firebase Messaging SW');
  tryInitFirebase();
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  tryInitFirebase();
});

// ─── Notification Click Handler ───────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, notification } = event;
  const data = notification.data || {};
  const taskUrl = data.url || '/dashboard';

  if (action === 'execute' || !action) {
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes('/dashboard') && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(taskUrl);
          }
        })
    );
  } else if (action === 'snooze-15') {
    console.log('[SW] Snoozed for 15 minutes, taskId:', data.taskId);
  }
});

// ─── Push Subscription Change ─────────────────────────────────────────────────

self.addEventListener('pushsubscriptionchange', () => {
  console.log('[SW] Push subscription changed — token refresh handled by Firebase SDK');
});

// ─── Message from main thread (config injection) ──────────────────────────────
// The main app sends: postMessage({ type: 'FIREBASE_CONFIG', config: { ... } })
// This lets the app push real env-var values into the SW without hardcoding.

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    self.__FIREBASE_CONFIG = event.data.config;
    tryInitFirebase();
  }
});
