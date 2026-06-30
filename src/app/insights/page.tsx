'use client';

/**
 * Insights Page — Personal productivity analytics
 * Displays completion rate, streaks, average urgency, lead time, and hourly procrastination distribution.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Zap, ArrowLeft, Brain, TrendingUp, Calendar, Clock, BarChart3, AlertCircle } from 'lucide-react';
import { cn, calculateProgress } from '@/lib/utils';
import type { FirestoreTask } from '@/types/task';

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Load all tasks
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
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreTask[];

        // In-memory sort to prevent composite index requirement
        const sorted = list.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });

        setTasks(sorted);
        setLoading(false);
      },
      (error) => {
        console.error('[Insights] Error loading tasks:', error);
        setLoading(false);
      }
    );


    return unsubscribe;
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Zap className="w-8 h-8 text-urgency animate-pulse" />
      </div>
    );
  }

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => calculateProgress(t.action_steps) === 100);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Average Urgency Score
  const avgUrgency = totalTasks > 0 
    ? (tasks.reduce((sum, t) => sum + t.urgency_score, 0) / totalTasks).toFixed(1)
    : '0.0';

  // Average Lead Time (in hours)
  const avgLeadTime = totalTasks > 0
    ? (tasks.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const deadline = new Date(t.true_deadline).getTime();
        return sum + Math.max(0, (deadline - created) / (1000 * 60 * 60));
      }, 0) / totalTasks).toFixed(1)
    : '0.0';

  // Procrastination hours (24-hour bin counts)
  const hourlyCounts = Array(24).fill(0);
  tasks.forEach((t) => {
    const hour = new Date(t.created_at).getHours();
    hourlyCounts[hour]++;
  });

  const maxHourCount = Math.max(...hourlyCounts, 1);

  // Streaks (Deadlines completed before true_deadline)
  // Sort tasks chronologically
  const sortedChronTasks = [...tasks].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let currentStreak = 0;
  let maxStreak = 0;

  sortedChronTasks.forEach((t) => {
    const isCompleted = calculateProgress(t.action_steps) === 100;
    
    // Find the latest completed step timestamp
    let lastStepDoneTime = 0;
    t.action_steps.forEach((s) => {
      if (s.completed_at) {
        lastStepDoneTime = Math.max(lastStepDoneTime, new Date(s.completed_at).getTime());
      }
    });

    const deadlineTime = new Date(t.true_deadline).getTime();
    
    // Beat the deadline if all steps were completed AND the last completion was before the deadline
    const beatDeadline = isCompleted && lastStepDoneTime > 0 && lastStepDoneTime <= deadlineTime;

    if (beatDeadline) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (isCompleted) {
      // Completed but missed the deadline
      currentStreak = 0;
    }
  });

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col text-text-primary">
      {/* Nav */}
      <nav className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-border-subtle/50 glass">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-xs text-text-secondary/60 hover:text-text-primary transition-colors uppercase tracking-wider font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <span className="text-sm font-black text-white">Personal Analytics</span>
      </nav>

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-white">Productivity Insights</h1>
          <p className="text-xs text-text-secondary">Analyze your procrastination triggers and benchmark your crisis execution stats.</p>
        </div>

        {totalTasks === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border-subtle rounded-3xl bg-bg-card/20">
            <AlertCircle className="w-12 h-12 text-text-secondary/30 mb-4" />
            <h3 className="text-sm font-bold text-text-primary mb-1">No Data Available</h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              Create and complete deadlines to populate your personal behavior analysis panel.
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Core Stats Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-2">
                <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest font-bold">Completion Rate</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-mint neon-text-mint">{completionRate}%</span>
                </div>
                <p className="text-[10px] text-text-secondary/50">
                  {completedTasks.length} of {totalTasks} panics solved
                </p>
              </div>

              <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-2">
                <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest font-bold">Avg Intake Urgency</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-urgency neon-text-urgency">{avgUrgency}</span>
                  <span className="text-xs text-text-secondary/50">/ 10</span>
                </div>
                <p className="text-[10px] text-text-secondary/50">Average submission stress</p>
              </div>

              <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-2">
                <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest font-bold">Beaten Streak</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{currentStreak}</span>
                  <span className="text-[10px] text-text-secondary/50">cur / {maxStreak} max</span>
                </div>
                <p className="text-[10px] text-text-secondary/50">Deadlines completed on time</p>
              </div>

              <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-2">
                <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest font-bold">Avg Lead Time</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-cool neon-text-cool">{avgLeadTime}h</span>
                </div>
                <p className="text-[10px] text-text-secondary/50">Hours remaining on intake</p>
              </div>
            </div>

            {/* Procrastination Bar Chart */}
            <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-urgency" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Procrastination Peak Hours</h3>
                  <p className="text-[11px] text-text-secondary/60">Time distribution of when your panic tasks are created.</p>
                </div>
              </div>

              {/* Simple visual bar chart columns */}
              <div className="h-48 flex items-end justify-between gap-1 pt-6 border-b border-border-subtle/40 px-2">
                {hourlyCounts.map((count, hour) => {
                  const percent = Math.round((count / maxHourCount) * 100);
                  const isPeak = count === maxHourCount && count > 0;
                  
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-help">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-raised border border-border-subtle text-[9px] px-1.5 py-0.5 rounded text-white font-mono z-10 whitespace-nowrap">
                        {count} panic{count !== 1 ? 's' : ''} at {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour-12} PM` : `${hour} AM`}
                      </div>

                      {/* Bar */}
                      <div
                        className={cn(
                          'w-full rounded-t-sm transition-all duration-500',
                          isPeak ? 'bg-crisis shadow-[0_0_12px_rgba(255,180,171,0.5)]' :
                          count > 0 ? 'bg-urgency/80 hover:bg-urgency' : 'bg-bg-raised/40'
                        )}
                        style={{ height: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Chart labels */}
              <div className="flex justify-between text-[9px] font-mono text-text-secondary/40 px-2">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
              </div>
            </div>

            {/* Motivational message banner */}
            <div className="bg-gradient-to-r from-bg-card to-bg-hover border border-border-subtle rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4">
              <Brain className="w-10 h-10 text-urgency flex-shrink-0" />
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white">Panic Assessment Summary</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your peak panic period is between the hours of 10 PM and 2 AM. You maintain an average deadline cushion of {avgLeadTime} hours. Keep executing inline to increase your streak!
                </p>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
