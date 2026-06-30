'use client';

/**
 * Task Detail Page — Mission Control
 *
 * Side-by-side split workspace:
 * - Left: Large countdown, progress metrics, Segmented Time Budget, step editing & reordering.
 * - Right: Docked Execution Workspace.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import {
  Zap,
  ArrowLeft,
  Clock,
  CheckCircle,
  Share2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Activity,
  AlertTriangle,
  Settings,
  MoreVertical,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  cn,
  getUrgencyThresholds,
  calculateCountdown,
  formatDuration,
  calculateProgress,
  calculateTotalTime,
} from '@/lib/utils';
import type { FirestoreTask, ActionStep } from '@/types/task';
import InlineWorkspace from '@/components/InlineWorkspace';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<FirestoreTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<ActionStep | null>(null);
  
  // States for timer
  const [countdown, setCountdown] = useState<any>(null);

  // States for editing mode
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState(15);

  // Auth Gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Firestore Real-time Subscription
  useEffect(() => {
    if (!user || !taskId) return;

    const db = getFirebaseDb();
    const taskRef = doc(db, 'tasks', taskId);

    const unsubscribe = onSnapshot(
      taskRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const taskData = { id: docSnap.id, ...docSnap.data() } as FirestoreTask;
          if (taskData.user_id === user.uid) {
            setTask(taskData);
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
        setLoading(false);
      },
      (error) => {
        console.error('[TaskDetail] Firestore snapshot error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, taskId, router]);

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

  // Sync active step changes (if the database updates, update reference)
  useEffect(() => {
    if (activeStep && task) {
      const match = task.action_steps.find((s) => s.step_id === activeStep.step_id);
      if (match) {
        setActiveStep(match);
      } else {
        setActiveStep(null);
      }
    }
  }, [task, activeStep]);

  // Bulk Save Steps helper
  const saveSteps = async (newSteps: ActionStep[]) => {
    if (!task || !user) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({
          taskId: task.id,
          action_steps: newSteps,
        }),
      });

      if (!res.ok) throw new Error('Failed to update steps');
      toast.success('Sequence saved.');
    } catch {
      toast.error('Failed to update steps.');
    }
  };

  // Toggle single step completion
  const handleToggleStep = async (step: ActionStep) => {
    if (!task || !user) return;
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
      
      // Update local state if needed (subscription takes care of it, but good for instant UI feedback)
      if (newCompleted) {
        toast.success(`✅ "${step.title}" completed!`);
      }
    } catch {
      toast.error('Failed to update step.');
    }
  };

  // Snooze Task (+30 Minutes)
  const handleSnooze = async () => {
    if (!task || !user) return;
    try {
      const currentDeadline = new Date(task.true_deadline);
      const newDeadline = new Date(currentDeadline.getTime() + 30 * 60 * 1000).toISOString();

      const token = await getIdToken();
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({
          taskId: task.id,
          true_deadline: newDeadline,
        }),
      });

      if (!res.ok) throw new Error('Failed to snooze');
      toast.success('⏰ Deadline extended by 30 mins!');
    } catch {
      toast.error('Snooze failed.');
    }
  };

  // Mark all steps complete
  const handleMarkAllComplete = async () => {
    if (!task || !user) return;
    const updatedSteps = task.action_steps.map((s) => ({
      ...s,
      completed: true,
      completed_at: s.completed_at ?? new Date().toISOString(),
    }));
    await saveSteps(updatedSteps);
    toast.success('All steps marked completed!');
  };

  // Move step up
  const handleMoveUp = async (idx: number) => {
    if (!task || idx === 0) return;
    const list = [...task.action_steps];
    const temp = list[idx];
    list[idx] = list[idx - 1];
    list[idx - 1] = temp;
    await saveSteps(list);
  };

  // Move step down
  const handleMoveDown = async (idx: number) => {
    if (!task || idx === task.action_steps.length - 1) return;
    const list = [...task.action_steps];
    const temp = list[idx];
    list[idx] = list[idx + 1];
    list[idx + 1] = temp;
    await saveSteps(list);
  };

  // Edit Step Action
  const startEditStep = (step: ActionStep) => {
    setEditingStepId(step.step_id);
    setEditTitle(step.title);
    setEditDuration(step.duration_minutes);
  };

  const saveEditStep = async (stepId: string) => {
    if (!task) return;
    const updatedSteps = task.action_steps.map((s) => {
      if (s.step_id === stepId) {
        return {
          ...s,
          title: editTitle,
          duration_minutes: editDuration,
        };
      }
      return s;
    });
    await saveSteps(updatedSteps);
    setEditingStepId(null);
  };

  // Share link copy
  const handleShare = () => {
    if (!task) return;
    const url = `${window.location.origin}/task/${task.id}/share`;
    navigator.clipboard.writeText(url);
    toast.success('🔗 Shareable link copied!');
  };

  // Archive Task
  const handleArchive = async () => {
    if (!window.confirm('Archive this task?')) return;
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/tasks?taskId=${task?.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!res.ok) throw new Error('Failed to archive');
      toast.success('Task archived.');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to archive.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Zap className="w-8 h-8 text-urgency animate-pulse" />
      </div>
    );
  }

  if (!task) return null;

  const thresholds = getUrgencyThresholds(task.urgency_score);
  const progress = calculateProgress(task.action_steps);
  const totalMinutes = calculateTotalTime(task.action_steps);
  const completedSteps = task.action_steps.filter((s) => s.completed).length;

  // Segmented time budget variables
  const incompleteMinutes = task.action_steps
    .filter((s) => !s.completed)
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const totalTimeLeftSeconds = countdown?.totalSeconds ?? 0;
  const totalTimeLeftMinutes = Math.floor(totalTimeLeftSeconds / 60);
  const isBehindSchedule = totalTimeLeftMinutes < incompleteMinutes;

  // Activity Log events list
  const activityEvents = [
    { label: 'Panic Engine Initialized', timestamp: task.created_at },
    ...task.action_steps
      .filter((s) => s.started_at)
      .map((s) => ({
        label: `Started step: "${s.title}"`,
        timestamp: s.started_at!,
      })),
    ...task.action_steps
      .filter((s) => s.completed_at)
      .map((s) => ({
        label: `Completed step: "${s.title}"`,
        timestamp: s.completed_at!,
      })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col text-text-primary">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-border-subtle/50 glass">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-xs text-text-secondary/60 hover:text-text-primary transition-colors uppercase tracking-wider font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-bg-raised hover:bg-bg-active text-xs text-text-secondary border border-border-subtle/60 transition-colors font-bold"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button
            onClick={handleArchive}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-crisis-bg/20 hover:bg-crisis-bg/50 border border-crisis/30 text-crisis text-xs font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Archive
          </button>
        </div>
      </nav>

      {/* Behind Schedule Warning Banner */}
      {isBehindSchedule && !countdown?.isExpired && (
        <div className="bg-crisis-bg/40 border-b border-crisis px-6 py-3 flex items-center justify-center gap-3 text-sm font-bold text-crisis animate-border-pulse">
          <AlertTriangle className="w-5 h-5 text-crisis flex-shrink-0 animate-bounce" />
          <span>
            ⚠️ BEHIND SCHEDULE: You have only {formatDuration(totalTimeLeftMinutes)} remaining before the deadline, but need an estimated {formatDuration(incompleteMinutes)} to complete incomplete steps. Accel or Snooze!
          </span>
        </div>
      )}

      {/* Main content grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* LEFT COLUMN: Mission Control & Steps List */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Hero Countdown Card */}
          <div
            className={cn(
              'rounded-3xl border p-8 flex flex-col items-center justify-center text-center space-y-4 transition-all duration-500',
              thresholds.bgColor,
              thresholds.borderColor,
              task.urgency_score >= 9 ? 'shadow-urgency-critical animate-border-pulse' : 'shadow-lg'
            )}
          >
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded bg-bg-base/60 text-xs font-bold tracking-widest uppercase text-text-secondary border border-border-subtle/50">
                {task.urgency_score}/10 Urgency Level
              </span>
              <h1 className="text-3xl font-black text-white leading-tight mt-2">{task.task_name}</h1>
            </div>

            {/* Huge timer display */}
            {countdown ? (
              <div className="flex flex-col items-center">
                <span className="font-mono text-5xl md:text-7xl font-black tracking-widest tabular-nums text-white neon-text-urgency">
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
                  Remaining until {new Date(task.true_deadline).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-urgency border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Quick Extension Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSnooze}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bg-base hover:bg-bg-hover text-xs font-bold text-urgency border border-urgency/40 transition-all active:scale-95"
              >
                ⏰ Snooze +30m
              </button>
              <button
                onClick={handleMarkAllComplete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mint-bg hover:bg-mint-bg/80 text-xs font-bold text-mint border border-mint/40 transition-all active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark All Done
              </button>
            </div>
          </div>

          {/* Segmented Time Budget Bar */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-bold uppercase tracking-wider">Time Budget Segment Timeline</span>
              <span>Total Estimated Focus: {formatDuration(totalMinutes)}</span>
            </div>
            
            <div className="h-4 bg-bg-base rounded-full overflow-hidden flex divide-x divide-bg-card">
              {task.action_steps.map((step, idx) => (
                <div
                  key={step.step_id}
                  className={cn(
                    'h-full transition-all duration-300 relative group cursor-pointer',
                    step.completed ? 'bg-mint hover:bg-mint/80' : 
                      task.urgency_score >= 9 ? 'bg-crisis hover:bg-crisis/80' : 'bg-urgency hover:bg-urgency/80'
                  )}
                  style={{ flexGrow: step.duration_minutes }}
                  title={`${step.title} (${step.duration_minutes}m)`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-secondary/50">
              <span>Start</span>
              <span>Deadline</span>
            </div>
          </div>

          {/* Action Step Sequencing & Editing */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border-subtle bg-bg-base/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-urgency" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Action Steps</h2>
              </div>
              <span className="text-xs text-text-secondary/80">
                {completedSteps}/{task.action_steps.length} Steps Completed ({progress}%)
              </span>
            </div>

            <div className="divide-y divide-border-subtle/30">
              {task.action_steps.map((step, idx) => {
                const isEditing = editingStepId === step.step_id;
                
                return (
                  <div
                    key={step.step_id}
                    className={cn(
                      'group flex items-center justify-between px-6 py-4 transition-colors',
                      step.completed ? 'bg-bg-base/20 opacity-60' : 'hover:bg-bg-hover/20',
                      activeStep?.step_id === step.step_id && 'bg-urgency-bg/10 border-l-2 border-urgency'
                    )}
                  >
                    {/* Left Checklist and Title */}
                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                      {/* Checkbox button */}
                      <button
                        onClick={() => handleToggleStep(step)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                          step.completed
                            ? 'bg-mint-bg/40 border-mint text-mint'
                            : 'border-border-subtle text-text-secondary/40 hover:border-text-primary'
                        )}
                      >
                        {step.completed && <CheckCircle className="w-4 h-4" />}
                      </button>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-bg-base border border-border-subtle rounded px-2.5 py-1 text-sm text-text-primary focus:outline-none flex-1 min-w-0"
                          />
                          <input
                            type="number"
                            value={editDuration}
                            onChange={(e) => setEditDuration(parseInt(e.target.value) || 1)}
                            className="bg-bg-base border border-border-subtle rounded px-2 py-1 text-sm text-text-primary focus:outline-none w-16"
                          />
                          <button
                            onClick={() => saveEditStep(step.step_id)}
                            className="px-2.5 py-1 bg-mint text-bg-base text-xs font-bold rounded"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div
                          className="min-w-0 cursor-pointer"
                          onClick={() => {
                            if (!step.completed) {
                              setActiveStep(step);
                            }
                          }}
                        >
                          <p
                            className={cn(
                              'text-sm font-semibold truncate',
                              step.completed ? 'line-through text-text-secondary/60' : 'text-text-primary'
                            )}
                          >
                            {step.title}
                          </p>
                          <p className="text-[10px] text-text-secondary/50 mt-0.5">
                            {formatDuration(step.duration_minutes)} focus duration
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Reorder and Edit triggers */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-1 rounded text-text-secondary/50 hover:text-text-primary hover:bg-bg-raised disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === task.action_steps.length - 1}
                          className="p-1 rounded text-text-secondary/50 hover:text-text-primary hover:bg-bg-raised disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEditStep(step)}
                          className="p-1 rounded text-text-secondary/50 hover:text-text-primary hover:bg-bg-raised text-xs font-bold"
                        >
                          Edit
                        </button>
                        {!step.completed && (
                          <button
                            onClick={() => setActiveStep(step)}
                            className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded bg-urgency-bg border border-urgency/40 text-[10px] font-bold text-urgency hover:bg-urgency-bg/80"
                          >
                            <Play className="w-2.5 h-2.5" />
                            Run
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cool" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Activity Timeline Audit Log</h3>
            </div>
            <div className="space-y-3.5 pl-2 max-h-48 overflow-y-auto scrollbar-thin">
              {activityEvents.map((event, idx) => (
                <div key={idx} className="relative pl-5 border-l border-border-subtle/50 text-[11px] leading-tight space-y-1">
                  <div className="absolute -left-[4.5px] top-[3.5px] w-2 h-2 rounded-full bg-border-strong" />
                  <p className="text-text-primary font-medium">{event.label}</p>
                  <p className="text-text-secondary/40">{new Date(event.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Docked Execution Workspace */}
        <section className="lg:col-span-2 flex flex-col h-full min-h-[450px]">
          {activeStep ? (
            <div className="flex-1">
              <InlineWorkspace
                step={activeStep}
                taskId={task.id}
                taskName={task.task_name}
                onStepComplete={(stepId) => {
                  handleToggleStep(activeStep);
                  setActiveStep(null);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-border-subtle border-dashed bg-bg-card/30">
              <div className="w-12 h-12 rounded-2xl bg-bg-raised border border-border-subtle flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-text-secondary/40" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">Execution Workspace</h3>
              <p className="text-xs text-text-secondary max-w-[240px] leading-relaxed">
                Select an active step on the left and click &quot;Run&quot; to initialize Gemini execution drafts inline.
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
