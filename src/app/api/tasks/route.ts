/**
 * GET /api/tasks — Fetch user's active tasks
 * DELETE /api/tasks?taskId=xxx — Archive/delete a task
 * PATCH /api/tasks — Update step completion status
 *
 * All methods are rate-limited per user via the distributed Firestore limiter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyAuthToken, COLLECTIONS } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimitDistributed } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Shared auth + rate limit helper ─────────────────────────────────────────

async function authorizeRequest(
  request: NextRequest,
  rateLimitKey: string,
  maxRequests: number,
  windowMs: number
): Promise<
  | { userId: string; rateLimitRemaining: number }
  | NextResponse
> {
  // Auth
  const authHeader = request.headers.get('Authorization');
  let userId: string;
  try {
    const decoded = await verifyAuthToken(authHeader);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit
  const rateLimit = await checkRateLimitDistributed(
    `${rateLimitKey}:${userId}`,
    maxRequests,
    windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );
  }

  return { userId, rateLimitRemaining: rateLimit.remaining };
}

// ─── GET — Fetch Tasks ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 60 reads per minute per user
    const auth = await authorizeRequest(request, 'tasks_get', 60, 60000);
    if (auth instanceof NextResponse) return auth;
    const { userId, rateLimitRemaining } = auth;

    const db = getAdminDb();
    const snapshot = await db
      .collection(COLLECTIONS.TASKS)
      .where('user_id', '==', userId)
      .where('archived', '==', false)
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Remove internal fields
      _serverTimestamp: undefined,
    }));

    return NextResponse.json(
      { tasks },
      {
        status: 200,
        headers: { 'X-RateLimit-Remaining': String(rateLimitRemaining) },
      }
    );
  } catch (error) {
    console.error('[API/tasks GET]', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// ─── PATCH — Update Step Completion ──────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    // 30 updates per minute per user
    const auth = await authorizeRequest(request, 'tasks_patch', 30, 60000);
    if (auth instanceof NextResponse) return auth;
    const { userId, rateLimitRemaining } = auth;

    const body = (await request.json()) as {
      taskId: string;
      stepId: string;
      completed: boolean;
    };

    const { taskId, stepId, completed } = body;
    if (!taskId || !stepId) {
      return NextResponse.json({ error: 'taskId and stepId are required' }, { status: 400 });
    }

    const db = getAdminDb();
    const taskRef = db.collection(COLLECTIONS.TASKS).doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskDoc.data()!;
    if (taskData.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the specific step in the array
    type StepRecord = {
      step_id: string;
      completed: boolean;
      started_at?: string | null;
      completed_at?: string | null;
      [key: string]: unknown;
    };
    const updatedSteps = (taskData.action_steps as StepRecord[]).map((step) =>
      step.step_id === stepId
        ? {
            ...step,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            started_at: step.started_at ?? new Date().toISOString(),
          }
        : step
    );

    await taskRef.update({
      action_steps: updatedSteps,
      updated_at: new Date().toISOString(),
      _serverTimestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { success: true, taskId, stepId, completed },
      { headers: { 'X-RateLimit-Remaining': String(rateLimitRemaining) } }
    );
  } catch (error) {
    console.error('[API/tasks PATCH]', error);
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
  }
}

// ─── DELETE — Archive Task ────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    // 20 deletes per minute per user
    const auth = await authorizeRequest(request, 'tasks_delete', 20, 60000);
    if (auth instanceof NextResponse) return auth;
    const { userId, rateLimitRemaining } = auth;

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId query param is required' }, { status: 400 });
    }

    const db = getAdminDb();
    const taskRef = db.collection(COLLECTIONS.TASKS).doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (taskDoc.data()!.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete — archive instead of deleting
    await taskRef.update({
      archived: true,
      updated_at: new Date().toISOString(),
      _serverTimestamp: FieldValue.serverTimestamp(),
    });

    // Decrement user's active task count
    await db
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .update({ active_task_count: FieldValue.increment(-1) });

    return NextResponse.json(
      { success: true, taskId },
      { headers: { 'X-RateLimit-Remaining': String(rateLimitRemaining) } }
    );
  } catch (error) {
    console.error('[API/tasks DELETE]', error);
    return NextResponse.json({ error: 'Failed to archive task' }, { status: 500 });
  }
}
