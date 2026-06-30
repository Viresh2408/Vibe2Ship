/**
 * POST /api/fcm-token
 *
 * Registers a user's FCM device token for push notifications.
 * Called after the user grants notification permission.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyAuthToken, COLLECTIONS } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimitDistributed } from '@/lib/rate-limit';
import type { FCMTokenRequest } from '@/types/task';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate Limiting — 5 token registrations per hour per user ──────────────
    // FCM tokens rarely change; a high registration rate could indicate abuse
    const rateLimit = await checkRateLimitDistributed(`fcm_token:${userId}`, 5, 3600000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many token registration attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    // ── Parse Body ────────────────────────────────────────────
    let body: FCMTokenRequest;
    try {
      body = (await request.json()) as FCMTokenRequest;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { token } = body;

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Invalid FCM token' }, { status: 400 });
    }

    // ── Persist Token ─────────────────────────────────────────
    const db = getAdminDb();

    // Store in user document
    await db
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .set(
        {
          fcm_token: token,
          fcm_token_updated_at: FieldValue.serverTimestamp(),
          last_active: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // Also store in fcm_tokens collection for easy lookup by Cloud Functions
    await db.collection(COLLECTIONS.FCM_TOKENS).doc(userId).set({
      user_id: userId,
      token,
      updated_at: FieldValue.serverTimestamp(),
      platform: 'web',
    });

    return NextResponse.json(
      { success: true, message: 'FCM token registered' },
      {
        status: 200,
        headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) },
      }
    );
  } catch (error) {
    console.error('[API/fcm-token]', error);
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
  }
}
