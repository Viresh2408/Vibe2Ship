import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminMessaging, COLLECTIONS } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INTERVENTION_THRESHOLD_MINUTES = 120;
const BATCH_SIZE = 100;

export async function GET(request: NextRequest) {
  // Optional security check via Authorization header or query param
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const urlSecret = request.nextUrl.searchParams.get('secret');
    if (urlSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  console.log('[Cron] Starting execution at', new Date().toISOString());

  try {
    const db = getAdminDb();
    const messaging = getAdminMessaging();

    const now = new Date();
    const thresholdTime = new Date(now.getTime() + INTERVENTION_THRESHOLD_MINUTES * 60 * 1000);

    // Query active tasks approaching deadline
    const tasksSnapshot = await db
      .collection(COLLECTIONS.TASKS)
      .where('archived', '==', false)
      .where('true_deadline', '<=', thresholdTime.toISOString())
      .where('true_deadline', '>=', now.toISOString())
      .limit(BATCH_SIZE)
      .get();

    if (tasksSnapshot.empty) {
      console.log('[Cron] No tasks approaching deadline');
      return NextResponse.json({
        success: true,
        message: 'No tasks approaching deadline',
        processed: 0,
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`[Cron] Found ${tasksSnapshot.size} tasks approaching deadline`);

    const results = {
      notificationsSent: 0,
      notificationsFailed: 0,
      tasksProcessed: 0,
      skipped: 0,
    };

    const notificationPromises: Promise<void>[] = [];

    for (const taskDoc of tasksSnapshot.docs) {
      const task = { id: taskDoc.id, ...taskDoc.data() } as any;
      results.tasksProcessed++;

      const incompleteSteps = (task.action_steps || []).filter((s: any) => !s.completed);
      if (incompleteSteps.length === 0) {
        results.skipped++;
        console.log(`[Cron] Task ${task.id} has no incomplete steps, skipping`);
        continue;
      }

      // Get user FCM token
      const fcmToken = await getUserFCMToken(db, task.user_id);
      if (!fcmToken) {
        results.skipped++;
        console.log(`[Cron] No FCM token for user ${task.user_id}, skipping`);
        continue;
      }

      const deadlineMs = new Date(task.true_deadline).getTime();
      const minutesRemaining = Math.max(0, Math.floor((deadlineMs - now.getTime()) / 60000));
      const nextStep = incompleteSteps[0];
      const urgencyScore = recalculateUrgencyScore(task.true_deadline);

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

      notificationPromises.push(
        messaging
          .send(notification)
          .then(() => {
            results.notificationsSent++;
            console.log(`[Cron] Sent notification for task ${task.id}`);
            return logIntervention(db, {
              task_id: task.id,
              user_id: task.user_id,
              step_id: nextStep.step_id,
              minutes_remaining: minutesRemaining,
              urgency_score: urgencyScore,
              sent_at: now.toISOString(),
            });
          })
          .catch((err: any) => {
            results.notificationsFailed++;
            console.error(`[Cron] Failed to send for task ${task.id}:`, err.message);
          })
      );
    }

    await Promise.allSettled(notificationPromises);

    const summary = {
      success: true,
      ...results,
      durationMs: Date.now() - startTime,
      timestamp: now.toISOString(),
    };

    console.log('[Cron] Completed:', JSON.stringify(summary));
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[Cron] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime,
    }, { status: 500 });
  }
}

// Helpers
async function getUserFCMToken(db: any, userId: string) {
  try {
    const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();
    if (!tokenDoc.exists) return null;
    return tokenDoc.data().token || null;
  } catch (err: any) {
    console.error(`[Cron] Failed to get FCM token for ${userId}:`, err.message);
    return null;
  }
}

function buildNotificationPayload({
  token,
  taskId,
  taskName,
  stepTitle,
  stepType,
  minutesRemaining,
  urgencyScore,
  incompleteCount,
}: any) {
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
    data: {
      taskId,
      urgencyScore: String(urgencyScore),
      minutesRemaining: String(minutesRemaining),
      stepTitle,
    },
  };
}

function recalculateUrgencyScore(deadlineISO: string) {
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

async function logIntervention(db: any, data: any) {
  try {
    await db.collection('intervention_logs').add({
      ...data,
      _serverTimestamp: FieldValue.serverTimestamp(),
    });
  } catch (err: any) {
    console.warn('[Cron] Failed to log intervention:', err.message);
  }
}
