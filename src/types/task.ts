/**
 * Core TypeScript types for The Last-Minute Life Saver
 * All data models used across frontend, API routes, and Cloud Functions
 */

export type ActionType =
  | 'write'
  | 'research'
  | 'review'
  | 'code'
  | 'design'
  | 'communicate'
  | 'organize'
  | 'calculate'
  | 'present'
  | 'submit';

export interface ActionStep {
  step_id: string;
  title: string;
  duration_minutes: number;
  action_type: ActionType;
  ai_starter_prompt: string;
  completed: boolean;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface TaskPayload {
  task_name: string;
  true_deadline: string; // ISO 8601 timestamp
  urgency_score: number; // 1–10
  action_steps: ActionStep[];
  raw_input: string;
  created_at: string;
  updated_at: string;
}

export interface FirestoreTask extends TaskPayload {
  id: string;
  user_id: string;
  fcm_token?: string;
  archived: boolean;
}

export interface GeminiDecompositionResponse {
  task_name: string;
  true_deadline: string;
  urgency_score: number;
  action_steps: Omit<ActionStep, 'completed' | 'started_at' | 'completed_at'>[];
}

export interface PanicSubmission {
  raw_input: string;
  // NOTE: user_id is intentionally omitted — the server reads it from the
  // verified Firebase JWT only. Never trust user_id from the client payload.
  fcm_token?: string;
}

export interface ExecuteStepRequest {
  step_id: string;
  task_id: string;
  ai_starter_prompt: string;
  // NOTE: user_id is intentionally omitted — the server reads it from the
  // verified Firebase JWT only. Never trust user_id from the client payload.
}

export interface FCMTokenRequest {
  token: string;
  // NOTE: user_id is intentionally omitted — the server reads it from the
  // verified Firebase JWT only. Never trust user_id from the client payload.
}

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export interface UrgencyThresholds {
  level: UrgencyLevel;
  color: string;
  bgColor: string;
  borderColor: string;
  pulseClass: string;
  label: string;
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  urgencyLevel: UrgencyLevel;
}

export interface StreamChunk {
  type: 'text' | 'done' | 'error';
  content: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
