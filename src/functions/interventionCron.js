/**
 * Intervention Cron — Google Cloud Function
 * 
 * Autonomous deadline intervention engine.
 * Triggered every 15 minutes via Cloud Scheduler.
 * 
 * Logic:
 * 1. Queries Firestore for active tasks with deadlines < 120 minutes away
 * 2. Calculates urgency and finds the most critical incomplete step
 * 3. Sends high-priority FCM push notifications telling users exactly what to do
 * 
 * Deploy:
 *   gcloud functions deploy interventionCron \
 *     --runtime nodejs20 \
 *     --trigger-http \
 *     --allow-unauthenticated \
 *     --set-env-vars GOOGLE_CLOUD_PROJECT=your-project-id \
 *     --region us-central1
 * 
 * Cloud Scheduler (call every 15 min):
 *   gcloud scheduler jobs create http intervention-cron \
 *     --schedule "every 15 minutes" \
 *     --uri https://REGION-PROJECT.cloudfunctions.net/interventionCron \
 *     --http-method GET
 */

'use strict';

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

// ─── Firebase Admin Init ──────────────────────────────────────────────────────

function initAdmin() {
  if (getApps().length > 0) return;
  
  // On Cloud Run/GCF: ADC (Application Default Credentials) is used automatically
  // In local dev: set GOOGLE_APPLICATION_CREDENTIALS env var
  initializeApp();
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERVENTION_THRESHOLD_MINUTES = 120; // Trigger when < 2h remaining
const BATCH_SIZE = 100; // Firestore query limit
const COLLECTIONS = {
  TASKS: 'tasks',
  FCM_TOKENS: 'fcm_tokens',
  INTERVENTION_LOGS: 'intervention_logs',
};

// ─── Main Handler ─────────────────────────────────────────────────────────────

/**
 * HTTP-triggered Cloud Function
 * Also compatible with Pub/Sub triggers if needed
 */
exports.interventionCron = async (req, res) => {
  const startTime = Date.now();
  console.log('[InterventionCron] Starting execution at', new Date().toISOString());

  try {
    initAdmin();
    const db = getFirestore();
    const messaging = getMessaging();

    const now = new Date();
    const thresholdTime = new Date(now.getTime() + INTERVENTION_THRESHOLD_MINUTES * 60 * 1000);

    // ── Query active tasks approaching deadline ──────────────
    const tasksSnapshot = await db
      .collection(COLLECTIONS.TASKS)
      .where('archived', '==', false)
      .where('true_deadline', '<=', thresholdTime.toISOString())
      .where('true_deadline', '>=', now.toISOString())
      .limit(BATCH_SIZE)
      .get();

    if (tasksSnapshot.empty) {
      console.log('[InterventionCron] No tasks approaching deadline');
      return res.status(200).json({
        success: true,
        message: 'No tasks approaching deadline',
        processed: 0,
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`[InterventionCron] Found ${tasksSnapshot.size} tasks approaching deadline`);

    const results = {
      notificationsSent: 0,
      notificationsFailed: 0,
      tasksProcessed: 0,
      skipped: 0,
    };

    // ── Process each task ────────────────────────────────────
    const notificationPromises = [];

    for (const taskDoc of tasksSnapshot.docs) {
      const task = { id: taskDoc.id, ...taskDoc.data() };
      results.tasksProcessed++;

      // Skip if no incomplete steps
      const incompleteSteps = (task.action_steps || []).filter((s) => !s.completed);
      if (incompleteSteps.length === 0) {
        results.skipped++;
        console.log(`[InterventionCron] Task ${task.id} has no incomplete steps, skipping`);
        continue;
      }

      // Get the FCM token for this user
      const fcmToken = await getUserFCMToken(db, task.user_id);
      if (!fcmToken) {
        results.skipped++;
        console.log(`[InterventionCron] No FCM token for user ${task.user_id}, skipping`);
        continue;
      }

      // Calculate minutes remaining
      const deadlineMs = new Date(task.true_deadline).getTime();
      const minutesRemaining = Math.max(0, Math.floor((deadlineMs - now.getTime()) / 60000));

      // Get the most critical step (first incomplete one)
      const nextStep = incompleteSteps[0];
      const urgencyScore = recalculateUrgencyScore(task.true_deadline);

      // Build notification
      const notification = buildNotificationPayload({
        token: fcmToken,
        taskId: task.id,
        taskName: task.task_name,
        stepTitle: nextStep.title,
        stepType: nextStep.action_type,
        minutesRemaining,
        urgencyScore,
        incompleteCount: incompleteSteps.length,
      });

      // Queue notification send
      notificationPromises.push(
        messaging
          .send(notification)
          .then(() => {
            results.notificationsSent++;
            console.log(`[InterventionCron] Sent notification for task ${task.id}`);
            
            // Log intervention
            return logIntervention(db, {
              task_id: task.id,
              user_id: task.user_id,
              step_id: nextStep.step_id,
              minutes_remaining: minutesRemaining,
              urgency_score: urgencyScore,
              sent_at: now.toISOString(),
            });
          })
          .catch((err) => {
            results.notificationsFailed++;
            console.error(`[InterventionCron] Failed to send for task ${task.id}:`, err.message);
          })
      );
    }

    // Execute all notifications in parallel (capped by batch size)
    await Promise.allSettled(notificationPromises);

    const summary = {
      success: true,
      ...results,
      durationMs: Date.now() - startTime,
      timestamp: now.toISOString(),
    };

    console.log('[InterventionCron] Completed:', JSON.stringify(summary));
    return res.status(200).json(summary);
  } catch (error) {
    console.error('[InterventionCron] Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime,
    });
  }
};

// ─── Helper: Get User FCM Token ───────────────────────────────────────────────

async function getUserFCMToken(db, userId) {
  try {
    const tokenDoc = await db.collection(COLLECTIONS.FCM_TOKENS).doc(userId).get();
    if (!tokenDoc.exists) return null;
    return tokenDoc.data().token || null;
  } catch (err) {
    console.error(`[InterventionCron] Failed to get FCM token for ${userId}:`, err.message);
    return null;
  }
}

// ─── Helper: Build Notification Payload ──────────────────────────────────────

function buildNotificationPayload({
  token,
  taskId,
  taskName,
  stepTitle,
  stepType,
  minutesRemaining,
  urgencyScore,
  incompleteCount,
}) {
  const urgencyEmoji = urgencyScore >= 9 ? '🚨' : urgencyScore >= 7 ? '⚠️' : '⏰';
  const timeLabel =
    minutesRemaining <= 30
      ? `${minutesRemaining} MINUTES`
      : minutesRemaining <= 60
      ? `${minutesRemaining} min`
      : `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m`;

  return {
    token,
    notification: {
      title: `${urgencyEmoji} ${timeLabel} REMAINING`,
      body: `${taskName}: Execute "${stepTitle}" RIGHT NOW`,
    },
    webpush: {
      notification: {
        title: `${urgencyEmoji} ${timeLabel} left — Act immediately`,
        body: `NEXT: ${stepTitle} (${incompleteCount} step${incompleteCount !== 1 ? 's' : ''} remaining)`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: `intervention-${taskId}`,
        renotify: true,
        requireInteraction: urgencyScore >= 8,
        silent: false,
        vibrate: urgencyScore >= 9 ? [200, 100, 200, 100, 200] : [200, 100, 200],
        timestamp: Date.now(),
        actions: [
          { action: 'execute', title: '⚡ Execute Now' },
          { action: 'snooze-15', title: '⏱️ Snooze 15m' },
        ],
        data: {
          taskId,
          stepTitle,
          url: `/dashboard?task=${taskId}`,
          urgencyScore: String(urgencyScore),
          minutesRemaining: String(minutesRemaining),
        },
      },
      headers: {
        Urgency: urgencyScore >= 8 ? 'very-high' : 'high',
        TTL: '3600',
      },
      fcmOptions: {
        link: `/dashboard?task=${taskId}`,
      },
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'deadline-interventions',
        priority: 'max',
        defaultVibrateTimings: true,
        notificationCount: incompleteCount,
      },
    },
    data: {
      taskId,
      urgencyScore: String(urgencyScore),
      minutesRemaining: String(minutesRemaining),
      stepTitle,
    },
  };
}

// ─── Helper: Recalculate Urgency Score ───────────────────────────────────────

function recalculateUrgencyScore(deadlineISO) {
  const now = Date.now();
  const deadline = new Date(deadlineISO).getTime();
  const hoursRemaining = (deadline - now) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return 10;
  if (hoursRemaining <= 0.5) return 10;
  if (hoursRemaining <= 1) return 10;
  if (hoursRemaining <= 2) return 9;
  if (hoursRemaining <= 4) return 8;
  if (hoursRemaining <= 6) return 7;
  return 6;
}

// ─── Helper: Log Intervention ─────────────────────────────────────────────────

async function logIntervention(db, data) {
  try {
    await db.collection(COLLECTIONS.INTERVENTION_LOGS).add({
      ...data,
      _serverTimestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn('[InterventionCron] Failed to log intervention:', err.message);
  }
}
