'use client';

/**
 * History Page — Completed & Archived tasks
 * Supports filtering by urgency tier and search queries.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Zap, ArrowLeft, Inbox, Clock, Calendar, CheckCircle2, Eye, Filter } from 'lucide-react';
import {
  cn,
  calculateProgress,
  formatDuration,
  calculateTotalTime,
} from '@/lib/utils';
import type { FirestoreTask } from '@/types/task';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth Gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Load ALL tasks for the user (both active and archived)
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
        console.error('[History] Error loading tasks:', error);
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

  // A task is historical if it is archived OR fully completed (100% progress)
  const historyTasks = tasks.filter((t) => {
    const progress = calculateProgress(t.action_steps);
    return t.archived || progress === 100;
  });

  // Apply filters
  const filteredTasks = historyTasks.filter((t) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.task_name.toLowerCase().includes(q) && !t.raw_input.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      const score = t.urgency_score;
      if (urgencyFilter === 'critical' && score < 9) return false;
      if (urgencyFilter === 'high' && (score < 7 || score >= 9)) return false;
      if (urgencyFilter === 'medium' && (score < 4 || score >= 7)) return false;
      if (urgencyFilter === 'low' && score >= 4) return false;
    }

    return true;
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
        <span className="text-sm font-black text-white">Archives & History</span>
      </nav>

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/40 pb-4">
          <div>
            <h1 className="text-xl font-black text-white">Task Archive</h1>
            <p className="text-xs text-text-secondary">Review your completed plans, panic briefs, and historical action metrics.</p>
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search panics..."
                className="bg-bg-card border border-border-subtle rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none w-44 focus:border-border-strong"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-bg-card border border-border-subtle rounded-xl px-2 py-1">
              <Filter className="w-3.5 h-3.5 text-text-secondary/70 ml-1" />
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as any)}
                className="bg-transparent text-xs text-text-secondary focus:outline-none py-1 px-1.5 cursor-pointer font-semibold"
              >
                <option value="all" className="bg-bg-card text-text-primary">All Urgency</option>
                <option value="critical" className="bg-bg-card text-text-primary">Critical (9+)</option>
                <option value="high" className="bg-bg-card text-text-primary">High (7-8)</option>
                <option value="medium" className="bg-bg-card text-text-primary">Medium (4-6)</option>
                <option value="low" className="bg-bg-card text-text-primary">Low (&lt;4)</option>
              </select>
            </div>
          </div>
        </div>

        {/* History List */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border-subtle rounded-3xl bg-bg-card/20">
            <Inbox className="w-12 h-12 text-text-secondary/30 mb-4" />
            <h3 className="text-sm font-bold text-text-primary mb-1">No Archive Found</h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              No matching completed or archived tasks found. Start creating plans on the dashboard!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((t) => {
              const progress = calculateProgress(t.action_steps);
              const totalTime = calculateTotalTime(t.action_steps);
              
              return (
                <div
                  key={t.id}
                  className="bg-gradient-to-r from-bg-card to-bg-hover border border-border-subtle rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border-strong transition-all duration-300"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-[9px] font-bold px-2 py-0.5 rounded border uppercase',
                          t.urgency_score >= 9 ? 'bg-crisis-bg/30 text-crisis border-crisis/40' :
                          t.urgency_score >= 7 ? 'bg-urgency-bg/20 text-urgency border-urgency/30' :
                          'bg-bg-raised text-text-secondary border-border-subtle'
                        )}
                      >
                        Urgency {t.urgency_score}
                      </span>
                      <span className="text-[10px] text-text-secondary/50 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white truncate">{t.task_name}</h3>
                    <p className="text-xs text-text-secondary truncate italic">&quot;{t.raw_input}&quot;</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-text-primary">{progress}% completed</p>
                      <p className="text-[10px] text-text-secondary/60 mt-0.5">{t.action_steps.length} steps · {formatDuration(totalTime)}</p>
                    </div>

                    <button
                      onClick={() => router.push(`/task/${t.id}`)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bg-raised hover:bg-bg-active border border-border-subtle text-xs font-bold text-text-primary transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
