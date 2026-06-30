/**
 * POST /api/execute
 *
 * Executes a specific action step via Gemini 1.5 Flash streaming.
 * Returns a Server-Sent Events stream of AI-generated content
 * for the inline Execution Workspace.
 */

import { NextRequest } from 'next/server';
import { executeStepStreaming } from '@/lib/gemini';
import { verifyAuthToken } from '@/lib/firebase-admin';
import { checkRateLimitDistributed } from '@/lib/rate-limit';
import type { ExecuteStepRequest } from '@/types/task';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    let userId: string;
    try {
      const decoded = await verifyAuthToken(authHeader);
      userId = decoded.uid;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Rate Limiting — distributed, separate bucket for execute ──────────────
    const rateLimit = await checkRateLimitDistributed(`execute:${userId}`, 20, 60000);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded for AI execution' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Parse Body ────────────────────────────────────────────
    let body: ExecuteStepRequest;
    try {
      body = (await request.json()) as ExecuteStepRequest;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // NOTE: user_id from body is intentionally ignored — userId comes from JWT only.
    const { ai_starter_prompt, step_id, task_id } = body;

    if (!ai_starter_prompt || !step_id || !task_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ai_starter_prompt, step_id, task_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (ai_starter_prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'ai_starter_prompt too long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Stream Gemini Response ────────────────────────────────
    const streamStep = {
      title: `Step ${step_id}`,
      ai_starter_prompt,
      action_type: 'write' as const,
    };

    const geminiStream = await executeStepStreaming(streamStep, `Task ID: ${task_id}`);

    // Return as SSE stream
    return new Response(geminiStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL ?? '*',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (error) {
    console.error('[API/execute] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Execution failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
