'use client';

/**
 * Dashboard Page — The Last-Minute Life Saver
 *
 * Main workspace: Panic Intake + Intervention Timelines.
 * Real-time Firestore subscriptions for live task updates.
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  LogOut,
  Plus,
  ChevronDown,
  ChevronUp,
  Inbox,
  Loader2,
  Activity,
  Bell,
  Settings,
  BarChart3,
  History,
  Sparkles,
  BookOpen,
} from 'lucide-react';

import Image from 'next/image';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import PanicIntake from '@/components/PanicIntake';
import InterventionTimeline from '@/components/InterventionTimeline';
import NotificationBanner from '@/components/NotificationBanner';
import { cn, getUrgencyThresholds } from '@/lib/utils';
import type { FirestoreTask } from '@/types/task';
import toast from 'react-hot-toast';

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function DashboardContent() {
  const { user, loading: authLoading, signOut, getIdToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [intakeExpanded, setIntakeExpanded] = useState(true);

  // ── Auth Gate & Onboarding Check ───────────────────────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    const checkOnboarding = async () => {
      try {
        let localOnboarded = null;
        try {
          localOnboarded = localStorage.getItem(`v2s_onboarded_${user.uid}`);
        } catch (e) {
          console.warn('localStorage read blocked:', e);
        }

        if (localOnboarded === 'true') {
          return;
        }

        const db = getFirebaseDb();
        const { getDoc, doc } = await import('firebase/firestore');
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        
        if (userSnap.exists() && userSnap.data()?.onboarded === true) {
          try {
            localStorage.setItem(`v2s_onboarded_${user.uid}`, 'true');
          } catch (e) {
            console.warn('localStorage write blocked:', e);
          }
          return;
        }

        router.push('/onboarding');
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      }
    };

    checkOnboarding();
  }, [user, authLoading, router]);



  // ── Firestore Real-time Subscription ──────────────────────
  useEffect(() => {
    if (!user) return;

    const db = getFirebaseDb();
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('user_id', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const rawTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreTask[];
        
        // Filter, sort, and slice in-memory to prevent index requirements
        const processedTasks = rawTasks
          .filter((t) => t.archived === false)
          .sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 20);

        setTasks(processedTasks);
        setTasksLoading(false);
      },
      (error) => {
        console.error('[Dashboard] Firestore subscription error:', error);
        setTasksLoading(false);
        // Fallback: fetch via API
        fetchTasksViaAPI();
      }
    );

    return unsubscribe;
  }, [user]);


  // ── Scroll to task if task param in URL ───────────────────
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId) {
      setTimeout(() => {
        document.getElementById(`task-${taskId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 500);
    }
  }, [searchParams, tasks]);

  // ── API Fallback ───────────────────────────────────────────
  const fetchTasksViaAPI = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = (await res.json()) as { tasks: FirestoreTask[] };
      setTasks(data.tasks ?? []);
    } catch (err) {
      console.error('[Dashboard] API fallback failed:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [getIdToken]);

  // ── Task Created Handler ───────────────────────────────────
  const handleTaskCreated = useCallback((newTask: FirestoreTask) => {
    setTasks((prev) => [newTask, ...prev]);
    setIntakeExpanded(false);
    // Smooth scroll to new task
    setTimeout(() => {
      document.getElementById(`task-${newTask.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 300);
  }, []);

  // ── Task Deleted Handler ───────────────────────────────────
  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // ── Step Updated Handler ──────────────────────────────────
  const handleStepUpdated = useCallback(
    (taskId: string, stepId: string, completed: boolean) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                action_steps: task.action_steps.map((step) =>
                  step.step_id === stepId
                    ? {
                        ...step,
                        completed,
                        completed_at: completed ? new Date().toISOString() : null,
                      }
                    : step
                ),
              }
            : task
        )
      );
    },
    []
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      toast.error('Sign out failed');
    }
  };

  // Sort tasks by urgency score (highest first)
  const sortedTasks = [...tasks].sort((a, b) => b.urgency_score - a.urgency_score);

  const criticalCount = tasks.filter((t) => t.urgency_score >= 9).length;
  const activeCount = tasks.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-urgency animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col">
      {/* ── Critical Alert Banner ── */}
      {criticalCount > 0 && (
        <div className="bg-crisis-bg/30 border-b border-crisis/50 px-4 py-2 flex items-center justify-center gap-2 animate-border-pulse">
          <Activity className="w-4 h-4 text-crisis animate-pulse" />
          <span className="text-sm font-bold text-crisis animate-glow-pulse">
            {'\ud83d\udea8'} {criticalCount} CRITICAL DEADLINE{criticalCount > 1 ? 'S' : ''} — Immediate action required
          </span>

        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between border-b border-border-subtle/50 glass">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-urgency to-urgency-bg flex items-center justify-center shadow-glow-urgency">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-none">Last-Minute Life Saver</h1>
            <p className="text-[10px] text-text-secondary/60 mt-0.5 leading-none">AI Deadline Engine</p>
          </div>
        </div>


        {/* Navigation links group (Desktop) */}
        <div className="hidden md:flex items-center gap-5 text-xs font-bold text-text-secondary">
          <Link href="/demo" className="flex items-center gap-1 text-urgency bg-urgency-bg/25 px-2.5 py-1 rounded-lg border border-urgency/30 hover:bg-urgency-bg/40 transition-colors uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Judge Mode</span>
          </Link>
          <Link href="/insights" className="hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Insights</span>
          </Link>
          <Link href="/history" className="hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
            <History className="w-3.5 h-3.5" />
            <span>Archive</span>
          </Link>
          <Link href="/settings" className="hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Page Links (Mobile) */}
          <div className="flex md:hidden items-center gap-1">
            <Link href="/demo" title="Judge Mode" className="p-1.5 rounded text-urgency hover:bg-bg-hover">
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
            <Link href="/insights" title="Insights" className="p-1.5 rounded text-text-secondary hover:bg-bg-hover hover:text-white">
              <BarChart3 className="w-3.5 h-3.5" />
            </Link>
            <Link href="/history" title="History" className="p-1.5 rounded text-text-secondary hover:bg-bg-hover hover:text-white">
              <History className="w-3.5 h-3.5" />
            </Link>
            <Link href="/settings" title="Settings" className="p-1.5 rounded text-text-secondary hover:bg-bg-hover hover:text-white">
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Task count badges */}
          <div className="hidden sm:flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-crisis-bg/50 text-crisis text-xs font-bold border border-crisis/50 animate-pulse">
                {criticalCount} Critical
              </span>
            )}
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-bg-raised text-text-secondary text-xs border border-border-subtle">
                {activeCount} Active
              </span>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                width={28}
                height={28}
                className="rounded-full border border-border-subtle"
              />
            )}
            <span className="hidden sm:block text-sm text-text-secondary max-w-[120px] truncate">
              {user.displayName ?? user.email}
            </span>
          </div>

          <button
            id="signout-btn"
            onClick={handleSignOut}
            className="p-2 rounded-xl text-text-secondary/60 hover:text-text-secondary hover:bg-bg-hover transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Notification Banner */}
        <NotificationBanner />

        {/* ── Panic Intake Section ── */}
        <section id="panic-intake-section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-urgency" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest">
                New Deadline
              </h2>
            </div>
            <button
              onClick={() => setIntakeExpanded(!intakeExpanded)}
              className="flex items-center gap-1 text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
            >
              {intakeExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Expand
                </>
              )}
            </button>
          </div>

          {intakeExpanded && (
            <div className="animate-slide-up">
              <PanicIntake
                onTaskCreated={handleTaskCreated}
                disabled={false}
              />
            </div>
          )}
        </section>

        {/* ── Intervention Timelines ── */}
        <section id="timelines-section">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-urgency" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest">
              Active Interventions
            </h2>
            {!tasksLoading && activeCount > 0 && (
              <span className="ml-auto text-xs text-text-secondary/60">
                Sorted by urgency ↓
              </span>
            )}
          </div>

          {tasksLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-urgency animate-spin" />
                <p className="text-sm text-text-secondary">Loading your active deadlines...</p>
              </div>
            </div>
          ) : sortedTasks.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {sortedTasks.map((task) => (
                <div key={task.id} id={`task-${task.id}`}>
                  <InterventionTimeline
                    task={task}
                    onTaskDeleted={handleTaskDeleted}
                    onStepUpdated={handleStepUpdated}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="px-6 py-4 border-t border-border-subtle/30 text-center">
        <p className="text-xs text-text-secondary/40">
          Last-Minute Life Saver · Powered by Gemini 1.5 Flash · Google Vibe2Ship Hackathon
        </p>
      </footer>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-raised border border-border-subtle flex items-center justify-center mb-6">
        <Inbox className="w-8 h-8 text-text-secondary/60" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">No Active Deadlines</h3>
      <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
        Describe your deadline situation above and Gemini will instantly create an action plan.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-mint">
          <Bell className="w-3.5 h-3.5" />
          <span>You&apos;re all clear — no active emergencies</span>
        </div>
        <Link
          href="/demo"
          className="text-xs text-urgency hover:underline font-bold mt-1 block"
        >
          {'\u26a1'} Launch Simulated Judge Mode to test reactive states instantly {'\u2794'}
        </Link>

      </div>

    </div>
  );
}

// ─── Page Export with Suspense ────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-base flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-urgency animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

