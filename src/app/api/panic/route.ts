/**
 * POST /api/panic
 *
 * The core endpoint. Accepts raw panic text, runs it through Gemini 1.5 Flash,
 * validates via Vertex AI schema guardrails, and persists to Firestore.
 *
 * Returns a fully structured action plan JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decomposeDeadline } from '@/lib/gemini';
import { validateDecompositionSchema, checkInputSafety } from '@/lib/vertex';
import { checkRateLimitDistributed } from '@/lib/rate-limit';
import { getAdminDb, verifyAuthToken, COLLECTIONS } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { FirestoreTask, PanicSubmission } from '@/types/task';
import { generateId } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ── Auth Verification ─────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    let userId: string;

    try {
      const decoded = await verifyAuthToken(authHeader);
      userId = decoded.uid;
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }

    // ── Rate Limiting (distributed — works across Cloud Run replicas) ──
    const maxRequests = parseInt(process.env.PANIC_RATE_LIMIT_MAX ?? '10');
    const windowMs = parseInt(process.env.PANIC_RATE_LIMIT_WINDOW_MS ?? '60000');
    const rateLimit = await checkRateLimitDistributed(`panic:${userId}`, maxRequests, windowMs);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait before submitting again.',
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    // ── Parse Request Body ────────────────────────────────────
    let body: PanicSubmission;
    try {
      body = (await request.json()) as PanicSubmission;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    // NOTE: raw_input and fcm_token are the only fields we read.
    // user_id from the body is intentionally ignored — userId comes from the JWT only.
    const { raw_input, fcm_token } = body;

    // ── Input Safety Check ────────────────────────────────────
    const safetyCheck = checkInputSafety(raw_input);
    if (!safetyCheck.safe) {
      return NextResponse.json({ error: safetyCheck.reason }, { status: 400 });
    }

    // ── Gemini Decomposition ──────────────────────────────────
    let geminiResponse;
    try {
      geminiResponse = await decomposeDeadline(raw_input);
    } catch (geminiError) {
      console.error('[API/panic] Gemini error:', geminiError);
      return NextResponse.json(
        {
          error: 'AI analysis failed. Please try rephrasing your deadline description.',
          details: geminiError instanceof Error ? geminiError.message : 'Unknown error',
        },
        { status: 502 }
      );
    }

    // ── Vertex AI Schema Validation ───────────────────────────
    const validation = validateDecompositionSchema(geminiResponse);
    if (!validation.valid || !validation.sanitized) {
      console.error('[API/panic] Schema validation failed:', validation.errors);
      return NextResponse.json(
        {
          error: 'AI response did not meet quality standards. Please try again.',
          validation_errors: validation.errors,
        },
        { status: 422 }
      );
    }

    const validated = validation.sanitized;
    const now = new Date().toISOString();
    const taskId = generateId('task');

    // ── Build Firestore Document ──────────────────────────────
    const firestoreTask: FirestoreTask = {
      id: taskId,
      user_id: userId,
      task_name: validated.task_name,
      true_deadline: validated.true_deadline,
      urgency_score: validated.urgency_score,
      action_steps: validated.action_steps.map((step) => ({
        ...step,
        completed: false,
        started_at: null,
        completed_at: null,
      })),
      raw_input,
      created_at: now,
      updated_at: now,
      archived: false,
      ...(fcm_token ? { fcm_token } : {}),
    };

    // ── Persist to Firestore ──────────────────────────────────
    try {
      const db = getAdminDb();
      await db.collection(COLLECTIONS.TASKS).doc(taskId).set({
        ...firestoreTask,
        _serverTimestamp: FieldValue.serverTimestamp(),
      });

      // Also update user's active task count
      await db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .set(
          {
            last_active: FieldValue.serverTimestamp(),
            active_task_count: FieldValue.increment(1),
            ...(fcm_token ? { fcm_token } : {}),
          },
          { merge: true }
        );
    } catch (firestoreError) {
      console.error('[API/panic] Firestore write failed:', firestoreError);
      // Non-fatal: Return the response anyway, just log the persistence failure
      console.warn('[API/panic] Continuing without Firestore persistence');
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        task: firestoreTask,
        meta: {
          taskId,
          responseTimeMs: responseTime,
          stepsCount: firestoreTask.action_steps.length,
        },
      },
      {
        status: 201,
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    console.error('[API/panic] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Our team has been notified.' },
      { status: 500 }
    );
  }
}
