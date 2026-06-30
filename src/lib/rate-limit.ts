/**
 * Distributed Rate Limiter — Firestore-backed
 *
 * Replaces the in-memory rateLimitMap in vertex.ts.
 * Works correctly across multiple Cloud Run replicas because counters
 * live in Firestore, not in process memory.
 *
 * Falls back to in-memory for dev/CI environments where Firestore is unavailable.
 */

// ─── In-memory fallback ───────────────────────────────────────────────────────
// Used when Firestore is not configured (local dev without Firebase credentials)

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function checkMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = memoryStore.get(identifier);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}

// ─── Firestore-backed distributed rate limiter ────────────────────────────────

/**
 * Checks and increments rate limit using Firestore atomic transactions.
 * Automatically falls back to in-memory if Firestore is unavailable.
 *
 * @param identifier  Unique key e.g. "panic:uid_abc", "tasks_get:uid_abc"
 * @param maxRequests Maximum allowed requests per window
 * @param windowMs    Time window in milliseconds
 */
export async function checkRateLimitDistributed(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Check if Firebase Admin is configured
  const hasFirebaseAdmin =
    process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY') &&
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    !process.env.FIREBASE_ADMIN_PROJECT_ID.includes('your-project');

  if (!hasFirebaseAdmin) {
    // Fallback to in-memory (local dev without Firebase)
    return checkMemoryRateLimit(identifier, maxRequests, windowMs);
  }

  try {
    const { getAdminDb } = await import('./firebase-admin');
    const db = getAdminDb();
    const now = Date.now();
    const docRef = db.collection('_rate_limits').doc(
      // Sanitize the identifier for use as a Firestore doc ID
      identifier.replace(/[^a-zA-Z0-9_\-:.]/g, '_')
    );

    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);

      if (!doc.exists) {
        const resetAt = now + windowMs;
        tx.set(docRef, { count: 1, resetAt, identifier });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
      }

      const data = doc.data()!;
      const { count, resetAt } = data as { count: number; resetAt: number };

      // Window expired — reset
      if (now > resetAt) {
        const newResetAt = now + windowMs;
        tx.set(docRef, { count: 1, resetAt: newResetAt, identifier });
        return { allowed: true, remaining: maxRequests - 1, resetAt: newResetAt };
      }

      // Over limit
      if (count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt };
      }

      // Increment
      tx.update(docRef, { count: count + 1 });
      return { allowed: true, remaining: maxRequests - (count + 1), resetAt };
    });

    return result;
  } catch (error) {
    // If Firestore transaction fails, fail-open (allow the request) and log
    console.error('[RateLimit] Firestore rate limit check failed, failing open:', error);
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }
}

/**
 * Synchronous in-memory rate limiter (kept for backward compatibility).
 * Use checkRateLimitDistributed() for production multi-instance deployments.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkMemoryRateLimit(identifier, maxRequests, windowMs);
}
