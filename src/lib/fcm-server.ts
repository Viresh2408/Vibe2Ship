/**
 * FCM Server Utilities — Server-side ONLY (API routes, Cloud Functions)
 *
 * Uses Firebase Admin SDK to send push notifications.
 * NEVER import this in client components or pages — only API routes.
 */

// ─── Send Intervention Notification ──────────────────────────────────────────

/**
 * Sends a high-priority intervention push notification via FCM Admin SDK.
 * Called from API routes. Import dynamically to keep out of client bundle.
 */
export async function sendInterventionNotification(params: {
  token: string;
  taskName: string;
  stepTitle: string;
  minutesRemaining: number;
  urgencyScore: number;
  taskId: string;
}): Promise<boolean> {
  try {
    const { getAdminMessaging } = await import('./firebase-admin');
    const messaging = getAdminMessaging();

    const urgencyEmoji = params.urgencyScore >= 9 ? '🚨' : params.urgencyScore >= 7 ? '⚠️' : '⏰';

    await messaging.send({
      token: params.token,
      notification: {
        title: `${urgencyEmoji} ${params.minutesRemaining}min LEFT — Act NOW`,
        body: `${params.taskName}: ${params.stepTitle}`,
      },
      webpush: {
        notification: {
          title: `${urgencyEmoji} ${params.minutesRemaining} minutes remaining`,
          body: `EXECUTE: ${params.stepTitle}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `intervention-${params.taskId}`,
          renotify: true,
          requireInteraction: true,
          actions: [
            { action: 'open-dashboard', title: '🚀 Execute Now' },
            { action: 'snooze', title: '⏱️ 15 min' },
          ],
          data: {
            taskId: params.taskId,
            url: `/dashboard?task=${params.taskId}`,
          },
        },
        headers: { Urgency: 'high', TTL: '3600' },
        fcmOptions: { link: `/dashboard?task=${params.taskId}` },
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'deadline-interventions',
          priority: 'max',
          defaultVibrateTimings: true,
        },
      },
      data: {
        taskId: params.taskId,
        urgencyScore: String(params.urgencyScore),
        minutesRemaining: String(params.minutesRemaining),
      },
    });

    return true;
  } catch (error) {
    console.error('[FCM Server] Failed to send notification:', error);
    return false;
  }
}
