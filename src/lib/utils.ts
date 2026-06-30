/**
 * Utility Functions — The Last-Minute Life Saver
 *
 * Shared helpers for time calculations, urgency mappings,
 * countdown formatting, and className utilities.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CountdownState, UrgencyLevel, UrgencyThresholds } from '@/types/task';

// ─── ClassName Utility ────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Time & Countdown ─────────────────────────────────────────────────────────

/**
 * Calculates detailed countdown state from a deadline ISO string.
 */
export function calculateCountdown(deadlineISO: string): CountdownState {
  const now = Date.now();
  const deadline = new Date(deadlineISO).getTime();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
      urgencyLevel: 'critical',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hoursRemaining = diffMs / (1000 * 60 * 60);
  let urgencyLevel: UrgencyLevel;

  if (hoursRemaining <= 2) urgencyLevel = 'critical';
  else if (hoursRemaining <= 8) urgencyLevel = 'high';
  else if (hoursRemaining <= 24) urgencyLevel = 'medium';
  else urgencyLevel = 'low';

  return { days, hours, minutes, seconds, totalSeconds, isExpired: false, urgencyLevel };
}

/**
 * Formats a duration in minutes to human-readable string.
 * e.g., 90 → "1h 30m", 45 → "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Pads a number to 2 digits.
 */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Formats a countdown for display: "2d 4h 30m 15s" or "04:30:15"
 */
export function formatCountdownDisplay(state: CountdownState): string {
  const { days, hours, minutes, seconds } = state;
  if (days > 0) return `${days}d ${hours}h ${pad2(minutes)}m`;
  if (hours > 0) return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

/**
 * Returns a human-readable "time from now" string.
 */
export function timeFromNow(isoDate: string): string {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const absDiff = Math.abs(diffMs);
  const past = diffMs < 0;

  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  let result: string;
  if (minutes < 1) result = 'just now';
  else if (minutes < 60) result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  else if (hours < 24) result = `${hours} hour${hours !== 1 ? 's' : ''}`;
  else result = `${days} day${days !== 1 ? 's' : ''}`;

  return past ? `${result} ago` : `in ${result}`;
}

/**
 * Formats an ISO timestamp to a friendly local time string.
 */
export function formatDeadline(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── Urgency Mappings ─────────────────────────────────────────────────────────

/**
 * Maps an urgency score (1-10) to visual theme properties.
 */
export function getUrgencyThresholds(score: number): UrgencyThresholds {
  if (score >= 9) {
    return {
      level: 'critical',
      color: 'text-crisis',
      bgColor: 'bg-crisis-bg/40',
      borderColor: 'border-crisis',
      pulseClass: 'animate-urgency-pulse',
      label: 'CRITICAL — ACT NOW',
    };
  }
  if (score >= 7) {
    return {
      level: 'high',
      color: 'text-urgency',
      bgColor: 'bg-urgency-bg/30',
      borderColor: 'border-urgency',
      pulseClass: 'animate-pulse',
      label: 'HIGH URGENCY',
    };
  }
  if (score >= 4) {
    return {
      level: 'medium',
      color: 'text-cool',
      bgColor: 'bg-bg-raised/40',
      borderColor: 'border-cool/40',
      pulseClass: '',
      label: 'MODERATE',
    };
  }
  return {
    level: 'low',
    color: 'text-mint',
    bgColor: 'bg-mint-bg/20',
    borderColor: 'border-mint/30',
    pulseClass: '',
    label: 'ON TRACK',
  };
}


/**
 * Returns a color for action type badges.
 */
export function getActionTypeColor(actionType: string): string {
  const colorMap: Record<string, string> = {
    write: 'bg-blue-900/50 text-blue-300 border-blue-700',
    research: 'bg-purple-900/50 text-purple-300 border-purple-700',
    review: 'bg-cyan-900/50 text-cyan-300 border-cyan-700',
    code: 'bg-green-900/50 text-green-300 border-green-700',
    design: 'bg-pink-900/50 text-pink-300 border-pink-700',
    communicate: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    organize: 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
    calculate: 'bg-teal-900/50 text-teal-300 border-teal-700',
    present: 'bg-orange-900/50 text-orange-300 border-orange-700',
    submit: 'bg-red-900/50 text-red-300 border-red-700',
  };
  return colorMap[actionType] ?? 'bg-gray-900/50 text-gray-300 border-gray-700';
}

/**
 * Returns an emoji icon for each action type.
 */
export function getActionTypeIcon(actionType: string): string {
  const iconMap: Record<string, string> = {
    write: '✍️',
    research: '🔍',
    review: '👁️',
    code: '💻',
    design: '🎨',
    communicate: '📧',
    organize: '📋',
    calculate: '🧮',
    present: '🎤',
    submit: '🚀',
  };
  return iconMap[actionType] ?? '⚡';
}

// ─── Progress Calculation ─────────────────────────────────────────────────────

/**
 * Calculates the completion percentage of action steps.
 */
export function calculateProgress(steps: Array<{ completed: boolean }>): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter((s) => s.completed).length;
  return Math.round((completed / steps.length) * 100);
}

/**
 * Calculates total estimated minutes for all steps.
 */
export function calculateTotalTime(steps: Array<{ duration_minutes: number }>): number {
  return steps.reduce((acc, s) => acc + s.duration_minutes, 0);
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/**
 * Truncates a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Generates a unique ID with a prefix.
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
