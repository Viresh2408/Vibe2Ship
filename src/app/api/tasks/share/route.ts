/**
 * GET /api/tasks/share?taskId=xxx
 *
 * Public unauthenticated endpoint to fetch shared task data.
 * Strips out sensitive user fields like user_id and fcm_token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const db = getAdminDb();
    const taskDoc = await db.collection(COLLECTIONS.TASKS).doc(taskId).get();

    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const data = taskDoc.data()!;

    // Enforce safety: do not expose finished tasks that are archived, unless they are completed
    // (Actually let's just allow read-only rendering of any valid task, but delete user credentials)
    const sharedTask = {
      id: taskDoc.id,
      task_name: data.task_name,
      true_deadline: data.true_deadline,
      urgency_score: data.urgency_score,
      action_steps: data.action_steps,
      created_at: data.created_at,
      updated_at: data.updated_at,
      archived: data.archived || false,
    };

    return NextResponse.json({ task: sharedTask }, { status: 200 });
  } catch (error) {
    console.error('[API/tasks/share GET]', error);
    return NextResponse.json({ error: 'Failed to fetch shared task' }, { status: 500 });
  }
}
