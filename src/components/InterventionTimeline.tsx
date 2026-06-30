'use client';

/**
 * InterventionTimeline — Dynamic Action Step Timeline
 *
 * Renders Gemini-generated action steps with:
 * - Color states tied to urgency_score
 * - Step completion tracking
 * - Inline Execute buttons → opens ExecutionWorkspace
 * - Progress visualization
 * - Real-time step duration tracking
 */

import React, { useState } from 'react';
import Link from 'next/link';

import {
  CheckCircle2,
  Circle,
  Zap,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  cn,
  getUrgencyThresholds,
  getActionTypeIcon,
  getActionTypeColor,
  formatDuration,
  calculateProgress,
  calculateTotalTime,
} from '@/lib/utils';
import UrgencyMeter from './UrgencyMeter';
import CountdownTimer from './CountdownTimer';
import ExecutionWorkspace from './ExecutionWorkspace';
import type { FirestoreTask, ActionStep } from '@/types/task';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

interface InterventionTimelineProps {
  task: FirestoreTask;
  onTaskDeleted: (taskId: string) => void;
  onStepUpdated: (taskId: string, stepId: string, completed: boolean) => void;
}

export default function InterventionTimeline({
  task,
  onTaskDeleted,
  onStepUpdated,
}: InterventionTimelineProps) {
  const { getIdToken } = useAuth();
  const [activeStep, setActiveStep] = useState<ActionStep | null>(null);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const thresholds = getUrgencyThresholds(task.urgency_score);
  const progress = calculateProgress(task.action_steps);
  const totalMinutes = calculateTotalTime(task.action_steps);
  const completedSteps = task.action_steps.filter((s) => s.completed).length;

  const handleToggleStep = async (step: ActionStep) => {
    if (updatingStep) return;
    setUpdatingStep(step.step_id);

    const newCompleted = !step.completed;

    try {
      const token = await getIdToken();
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({
          taskId: task.id,
          stepId: step.step_id,
          completed: newCompleted,
        }),
      });

      if (!res.ok) throw new Error('Failed to update step');

      onStepUpdated(task.id, step.step_id, newCompleted);

      if (newCompleted) {
        toast.success(`✅ "${step.title}" completed!`, {
          style: { background: '#003827', color: '#44dfab', border: '1px solid #44dfab' },
        });
      }
    } catch {
      toast.error('Failed to update step. Please try again.', {
        style: { background: '#690005', color: '#ffb4ab', border: '1px solid #ffb4ab' },
      });
    } finally {
      setUpdatingStep(null);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Archive this task? It will be removed from your dashboard.')) return;
    setIsDeleting(true);
    setShowMenu(false);

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/tasks?taskId=${task.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!res.ok) throw new Error('Failed to archive');
      onTaskDeleted(task.id);
      toast.success('Task archived.', {
        style: { background: '#1c1b1b', color: '#e5e2e1', border: '1px solid #46464c' },
      });
    } catch {
      toast.error('Failed to archive task.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* ── Card ── */}
      <div
        className={cn(
          'rounded-3xl border overflow-hidden transition-all duration-500',
          'bg-gradient-to-b from-bg-card to-bg-hover',
          thresholds.borderColor,
          thresholds.level === 'critical' && 'shadow-urgency-critical animate-border-pulse',
          thresholds.level === 'high' && 'shadow-urgency-high',
          thresholds.level === 'medium' && 'shadow-urgency-medium',
          thresholds.level === 'low' && 'shadow-urgency-low'
        )}
      >
        {/* ── Task Header ── */}
        <div
          className={cn(
            'px-6 pt-6 pb-4 border-b',
            'border-border-subtle/40',
            thresholds.bgColor
          )}
        >
          <div className="flex items-start gap-4">
            <UrgencyMeter score={task.urgency_score} size="md" />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/task/${task.id}`}>
                  <h3 className="text-xl font-black text-text-primary hover:text-urgency transition-colors leading-tight line-clamp-2 cursor-pointer">
                    {task.task_name}
                  </h3>
                </Link>

                {/* Context menu */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 rounded-lg text-text-secondary/60 hover:text-text-primary hover:bg-bg-raised transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-8 z-10 bg-bg-raised border border-border-subtle rounded-xl shadow-card overflow-hidden min-w-[140px]">
                      <button
                        onClick={handleDeleteTask}
                        disabled={isDeleting}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-crisis hover:bg-bg-hover transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleting ? 'Archiving...' : 'Archive Task'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>{completedSteps}/{task.action_steps.length} steps complete</span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      progress === 100 ? 'bg-mint' :
                        thresholds.level === 'critical' ? 'bg-crisis' :
                        thresholds.level === 'high' ? 'bg-urgency' :
                        thresholds.level === 'medium' ? 'bg-cool' : 'bg-mint'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{formatDuration(totalMinutes)} total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="mt-4">
            <CountdownTimer
              deadlineISO={task.true_deadline}
              taskName={task.task_name}
            />
          </div>
        </div>

        {/* ── Action Steps ── */}
        <div className="divide-y divide-border-subtle/30">
          {task.action_steps.map((step, idx) => (
            <StepRow
              key={step.step_id}
              step={step}
              index={idx}
              taskUrgencyScore={task.urgency_score}
              isUpdating={updatingStep === step.step_id}
              onToggle={() => handleToggleStep(step)}
              onExecute={() => setActiveStep(step)}
            />
          ))}
        </div>

        {/* ── Completion Banner ── */}
        {progress === 100 && (
          <div className="px-6 py-4 bg-mint-bg/30 border-t border-mint/40 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-mint" />
            <div>
              <p className="text-sm font-bold text-mint">All steps complete! 🎉</p>
              <p className="text-xs text-text-secondary">Great work — remember to submit!</p>
            </div>
            <button
              onClick={handleDeleteTask}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mint-bg/60 hover:bg-mint-bg text-mint text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Archive
            </button>
          </div>
        )}
      </div>

      {/* ── Execution Workspace Modal ── */}
      {activeStep && (
        <ExecutionWorkspace
          step={activeStep}
          taskId={task.id}
          taskName={task.task_name}
          onClose={() => setActiveStep(null)}
          onStepComplete={(stepId) => {
            onStepUpdated(task.id, stepId, true);
            setActiveStep(null);
          }}
        />
      )}
    </>
  );
}

// ─── Step Row Sub-component ───────────────────────────────────────────────────

interface StepRowProps {
  step: ActionStep;
  index: number;
  taskUrgencyScore: number;
  isUpdating: boolean;
  onToggle: () => void;
  onExecute: () => void;
}

function StepRow({
  step,
  index,
  taskUrgencyScore,
  isUpdating,
  onToggle,
  onExecute,
}: StepRowProps) {
  const thresholds = getUrgencyThresholds(taskUrgencyScore);

  return (
    <div
      className={cn(
        'group flex items-center gap-4 px-6 py-4 transition-all duration-200',
        step.completed
          ? 'opacity-60 bg-bg-base/30'
          : 'hover:bg-bg-hover/40',
        !step.completed &&
          taskUrgencyScore >= 9 &&
          index === 0 &&
          'bg-crisis-bg/10'
      )}
    >
      {/* Step number / check */}
      <button
        onClick={onToggle}
        disabled={isUpdating}
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          'transition-all duration-200 border-2',
          step.completed
            ? 'bg-mint-bg/30 border-mint text-mint'
            : 'border-border-subtle text-text-secondary/60 hover:border-border-strong hover:text-text-primary',
          isUpdating && 'opacity-50 cursor-not-allowed'
        )}
        title={step.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {isUpdating ? (
          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
        ) : step.completed ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </button>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm">{getActionTypeIcon(step.action_type)}</span>
          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border',
              getActionTypeColor(step.action_type)
            )}
          >
            {step.action_type}
          </span>
          <span className="text-xs text-text-secondary/60">· {formatDuration(step.duration_minutes)}</span>
        </div>
        <p
          className={cn(
            'text-sm font-semibold',
            step.completed ? 'line-through text-text-secondary/60' : 'text-text-primary'
          )}
        >
          {step.title}
        </p>
      </div>

      {/* Execute button */}
      {!step.completed && (
        <button
          id={`execute-step-${step.step_id}`}
          onClick={onExecute}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
            'text-xs font-bold transition-all duration-200 transform active:scale-95',
            'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0',
            taskUrgencyScore >= 7
              ? 'bg-crisis-bg/60 hover:bg-crisis-bg text-crisis border border-crisis/50'
              : 'bg-urgency-bg/60 hover:bg-urgency-bg text-urgency border border-urgency/50'
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          Execute
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

