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
      .get();

    const allTasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      _serverTimestamp: undefined,
    })) as any[];

    // In-memory filter, sort, and limit to bypass index requirement
    const tasks = allTasks
      .filter((t) => t.archived === false)
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 20);


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

// ─── PUT — Update Task Details (Steps, Deadline, Name) ───────────────────────

export async function PUT(request: NextRequest) {
  try {
    // 30 updates per minute per user
    const auth = await authorizeRequest(request, 'tasks_put', 30, 60000);
    if (auth instanceof NextResponse) return auth;
    const { userId, rateLimitRemaining } = auth;

    const body = (await request.json()) as {
      taskId: string;
      action_steps?: any[];
      true_deadline?: string;
      task_name?: string;
      urgency_score?: number;
    };

    const { taskId, action_steps, true_deadline, task_name, urgency_score } = body;
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
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

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
      _serverTimestamp: FieldValue.serverTimestamp(),
    };

    if (action_steps !== undefined) {
      updates.action_steps = action_steps;
    }
    if (true_deadline !== undefined) {
      updates.true_deadline = true_deadline;
    }
    if (task_name !== undefined) {
      updates.task_name = task_name;
    }
    if (urgency_score !== undefined) {
      updates.urgency_score = urgency_score;
    }

    await taskRef.update(updates);

    return NextResponse.json(
      { success: true, taskId, updates },
      { headers: { 'X-RateLimit-Remaining': String(rateLimitRemaining) } }
    );
  } catch (error) {
    console.error('[API/tasks PUT]', error);
    return NextResponse.json({ error: 'Failed to update task details' }, { status: 500 });
  }
}

