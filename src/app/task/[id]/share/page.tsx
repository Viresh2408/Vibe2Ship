'use client';

/**
 * Public Share Page — Read-only task summary
 * Does not require auth. Fetches task via public share API.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Zap, Clock, Shield, AlertTriangle } from 'lucide-react';
import {
  cn,
  getUrgencyThresholds,
  calculateCountdown,
  formatDuration,
  calculateProgress,
  calculateTotalTime,
} from '@/lib/utils';
import type { FirestoreTask } from '@/types/task';

export default function PublicSharePage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<FirestoreTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<any>(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchSharedTask = async () => {
      try {
        const res = await fetch(`/api/tasks/share?taskId=${taskId}`);
        if (!res.ok) {
          throw new Error('Task not found');
        }
        const data = await res.json();
        setTask(data.task);
      } catch (err) {
        console.error(err);
        toastError();
      } finally {
        setLoading(false);
      }
    };

    fetchSharedTask();
  }, [taskId]);

  const toastError = () => {
    // Basic fallback error handling
  };

  // Timer Tick Hook
  useEffect(() => {
    if (!task) return;

    const tick = () => {
      const state = calculateCountdown(task.true_deadline);
      setCountdown(state);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [task]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Zap className="w-8 h-8 text-urgency animate-pulse" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-crisis" />
        <h1 className="text-xl font-bold">Shared Task Not Found</h1>
        <p className="text-sm text-text-secondary">This link might have expired or the task was deleted.</p>
        <button
          onClick={() => router.push('/')}
          className="btn-primary text-xs"
        >
          Go Home
        </button>
      </div>
    );
  }

  const thresholds = getUrgencyThresholds(task.urgency_score);
  const progress = calculateProgress(task.action_steps);
  const totalMinutes = calculateTotalTime(task.action_steps);
  const completedSteps = task.action_steps.filter((s) => s.completed).length;

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col text-text-primary">
      {/* Nav */}
      <nav className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-border-subtle/50 glass">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-urgency to-urgency-bg flex items-center justify-center shadow-glow-urgency">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white text-sm tracking-tight">Last-Minute Life Saver</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Shield className="w-3.5 h-3.5" />
          <span>Shared Read-only View</span>
        </div>
      </nav>

      {/* Main card */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-12 space-y-6">
        
        {/* Countdown Hero */}
        <div
          className={cn(
            'rounded-3xl border p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-lg',
            thresholds.bgColor,
            thresholds.borderColor
          )}
        >
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded bg-bg-base/60 text-xs font-bold tracking-widest uppercase text-text-secondary border border-border-subtle/50">
              Urgent Deadline Tracker
            </span>
            <h1 className="text-2xl font-black text-white leading-tight mt-2">{task.task_name}</h1>
          </div>

          {countdown ? (
            <div className="flex flex-col items-center">
              <span className="font-mono text-4xl md:text-5xl font-black tracking-widest tabular-nums text-white neon-text-urgency animate-pulse">
                {countdown.isExpired ? (
                  'EXPIRED'
                ) : (
                  <>
                    {countdown.days > 0 && `${countdown.days}d `}
                    {String(countdown.hours).padStart(2, '0')}:
                    {String(countdown.minutes).padStart(2, '0')}:
                    {String(countdown.seconds).padStart(2, '0')}
                  </>
                )}
              </span>
              <span className="text-xs text-text-secondary uppercase tracking-widest mt-1">
                Remaining Focus Window
              </span>
            </div>
          ) : (
            <div className="w-6 h-6 border-2 border-urgency border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Time Budget */}
        <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-bold uppercase tracking-wider">Estimated Time Budget Segment Timeline</span>
            <span>Total Focus Time: {formatDuration(totalMinutes)}</span>
          </div>
          
          <div className="h-4 bg-bg-base rounded-full overflow-hidden flex divide-x divide-bg-card">
            {task.action_steps.map((step) => (
              <div
                key={step.step_id}
                className={cn(
                  'h-full transition-all duration-300',
                  step.completed ? 'bg-mint' : 
                    task.urgency_score >= 9 ? 'bg-crisis' : 'bg-urgency'
                )}
                style={{ flexGrow: step.duration_minutes }}
              />
            ))}
          </div>
        </div>

        {/* Steps List */}
        <div className="bg-bg-card border border-border-subtle rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border-subtle bg-bg-base/30 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Action Steps</h2>
            <span className="text-xs text-text-secondary/80">
              {completedSteps}/{task.action_steps.length} Steps Done ({progress}%)
            </span>
          </div>

          <div className="divide-y divide-border-subtle/30">
            {task.action_steps.map((step) => (
              <div
                key={step.step_id}
                className={cn(
                  'flex items-center justify-between px-6 py-4 opacity-90',
                  step.completed && 'bg-bg-base/20 opacity-55'
                )}
              >
                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      step.completed ? 'line-through text-text-secondary/50' : 'text-text-primary'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-text-secondary/50 mt-0.5">
                    Estimated: {formatDuration(step.duration_minutes)}
                  </p>
                </div>

                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded border uppercase',
                    step.completed
                      ? 'bg-mint-bg/30 text-mint border-mint'
                      : 'bg-bg-raised text-text-secondary border-border-subtle'
                  )}
                >
                  {step.completed ? 'Complete' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
