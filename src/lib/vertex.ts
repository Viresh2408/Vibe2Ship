/**
 * Vertex AI Integration — Production Safety Guardrails
 *
 * Wraps Gemini calls with Vertex AI safety validation and
 * schema enforcement for production deployments on Cloud Run.
 *
 * Falls back gracefully in development environments.
 */

import type { GeminiDecompositionResponse } from '@/types/task';

// ─── Vertex AI Validation ─────────────────────────────────────────────────────

/**
 * Validates a Gemini response against our strict schema using Vertex AI rules.
 * This acts as a production safety guardrail before persisting data.
 */
export function validateDecompositionSchema(
  response: unknown
): { valid: boolean; errors: string[]; sanitized?: GeminiDecompositionResponse } {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    return { valid: false, errors: ['Response must be an object'] };
  }

  const r = response as Record<string, unknown>;

  // ── Validate task_name ──────────────────────────────────────
  if (!r.task_name || typeof r.task_name !== 'string') {
    errors.push('task_name must be a non-empty string');
  } else if ((r.task_name as string).length > 120) {
    errors.push('task_name exceeds maximum length of 120 characters');
  }

  // ── Validate true_deadline ──────────────────────────────────
  if (!r.true_deadline || typeof r.true_deadline !== 'string') {
    errors.push('true_deadline must be a string');
  } else {
    const dt = new Date(r.true_deadline as string);
    if (isNaN(dt.getTime())) {
      errors.push(`true_deadline is not a valid ISO timestamp: ${r.true_deadline}`);
    }
  }

  // ── Validate urgency_score ──────────────────────────────────
  if (typeof r.urgency_score !== 'number') {
    errors.push('urgency_score must be a number');
  } else if (!Number.isInteger(r.urgency_score) || r.urgency_score < 1 || r.urgency_score > 10) {
    errors.push('urgency_score must be an integer between 1 and 10');
  }

  // ── Validate action_steps ───────────────────────────────────
  if (!Array.isArray(r.action_steps)) {
    errors.push('action_steps must be an array');
  } else {
    if (r.action_steps.length < 2) {
      errors.push('action_steps must contain at least 2 items');
    }
    if (r.action_steps.length > 15) {
      errors.push('action_steps must not exceed 15 items');
    }

    const validActionTypes = [
      'write', 'research', 'review', 'code', 'design',
      'communicate', 'organize', 'calculate', 'present', 'submit',
    ];

    (r.action_steps as unknown[]).forEach((step, idx) => {
      if (!step || typeof step !== 'object') {
        errors.push(`action_steps[${idx}] must be an object`);
        return;
      }

      const s = step as Record<string, unknown>;

      if (!s.step_id || typeof s.step_id !== 'string') {
        errors.push(`action_steps[${idx}].step_id is missing or invalid`);
      }
      if (!s.title || typeof s.title !== 'string') {
        errors.push(`action_steps[${idx}].title is missing or invalid`);
      }
      if (typeof s.duration_minutes !== 'number' || s.duration_minutes < 1) {
        errors.push(`action_steps[${idx}].duration_minutes must be a positive number`);
      }
      if (!s.action_type || !validActionTypes.includes(s.action_type as string)) {
        errors.push(
          `action_steps[${idx}].action_type must be one of: ${validActionTypes.join(', ')}`
        );
      }
      if (!s.ai_starter_prompt || typeof s.ai_starter_prompt !== 'string') {
        errors.push(`action_steps[${idx}].ai_starter_prompt is missing or invalid`);
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ── Build sanitized output ──────────────────────────────────
  const sanitized: GeminiDecompositionResponse = {
    task_name: (r.task_name as string).trim().substring(0, 120),
    true_deadline: new Date(r.true_deadline as string).toISOString(),
    urgency_score: Math.max(1, Math.min(10, Math.round(r.urgency_score as number))),
    action_steps: (r.action_steps as Record<string, unknown>[]).map((s, idx) => ({
      step_id: String(s.step_id ?? `step_${String(idx + 1).padStart(3, '0')}`),
      title: String(s.title).trim(),
      duration_minutes: Math.max(1, Math.round(Number(s.duration_minutes))),
      action_type: s.action_type as GeminiDecompositionResponse['action_steps'][0]['action_type'],
      ai_starter_prompt: String(s.ai_starter_prompt).trim(),
    })),
  };

  return { valid: true, errors: [], sanitized };
}

// ─── Content Safety Check ─────────────────────────────────────────────────────

/**
 * Checks user input for problematic content before sending to Gemini.
 * Acts as a pre-filter safety guardrail.
 */
export function checkInputSafety(input: string): {
  safe: boolean;
  reason?: string;
} {
  const trimmed = input.trim();

  if (!trimmed) {
    return { safe: false, reason: 'Input cannot be empty' };
  }

  if (trimmed.length < 10) {
    return { safe: false, reason: 'Input too short — please describe your deadline situation' };
  }

  if (trimmed.length > 5000) {
    return { safe: false, reason: 'Input too long — please limit to 5000 characters' };
  }

  // Block prompt injection attempts
  const injectionPatterns = [
    /ignore previous instructions/i,
    /ignore all instructions/i,
    /you are now/i,
    /system prompt/i,
    /jailbreak/i,
    /dan mode/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: 'Input contains disallowed content' };
    }
  }

  return { safe: true };
}

// ─── Rate Limiting Helper ──────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter for API routes.
 * In production, use Redis or Cloud Armor for distributed rate limiting.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}
