'use client';

/**
 * Demo Page — Judge / Pitch Sandbox Mode
 *
 * Pre-seeded task, simulated streaming, fast-forward timer controls.
 * Eliminates API network risks during pitch presentations.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowLeft,
  Clock,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Code,
  Sparkles,
} from 'lucide-react';
import {
  cn,
  getUrgencyThresholds,
  calculateCountdown,
  formatDuration,
  calculateProgress,
  calculateTotalTime,
} from '@/lib/utils';
import type { ActionStep, FirestoreTask } from '@/types/task';
import toast from 'react-hot-toast';

// Seed task data
const INITIAL_DEMO_TASK: FirestoreTask = {
  id: 'demo_task_pitch',
  user_id: 'demo_judge',
  task_name: 'Vibe2Ship Deck & Demo Pitch',
  true_deadline: new Date(Date.now() + 8.5 * 60 * 60 * 1000).toISOString(), // 8.5 hours left (urgency high)
  urgency_score: 8,
  archived: false,
  raw_input: 'Vibe2Ship hackathon due tonight. Need pitch slides, demo animations, working code, and to record a 2 minute pitch video.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  action_steps: [
    {
      step_id: 'demo_step_1',
      title: 'Outline Problem & Solution slides',
      duration_minutes: 15,
      action_type: 'write',
      ai_starter_prompt: 'Draft problem and solution statements for Vibe2Ship deck.',
      completed: false,
      started_at: null,
      completed_at: null,
    },
    {
      step_id: 'demo_step_2',
      title: 'Design interactive interface frames',
      duration_minutes: 30,
      action_type: 'design',
      ai_starter_prompt: 'Generate design tokens and spacing specs for cyberpunk theme.',
      completed: false,
      started_at: null,
      completed_at: null,
    },
    {
      step_id: 'demo_step_3',
      title: 'Code mock API endpoints & state hooks',
      duration_minutes: 45,
      action_type: 'code',
      ai_starter_prompt: 'Write clean next.js real-time state hooks.',
      completed: false,
      started_at: null,
      completed_at: null,
    },
    {
      step_id: 'demo_step_4',
      title: 'Practice speech & record video',
      duration_minutes: 15,
      action_type: 'present',
      ai_starter_prompt: 'Create a structure for a 2 minute pitch video.',
      completed: false,
      started_at: null,
      completed_at: null,
    },
    {
      step_id: 'demo_step_5',
      title: 'Submit package to Devpost portal',
      duration_minutes: 15,
      action_type: 'submit',
      ai_starter_prompt: 'Write a developer submission log.',
      completed: false,
      started_at: null,
      completed_at: null,
    },
  ],
};

const MOCK_STREAM_ANSWERS: Record<string, string> = {
  demo_step_1: `## Problem Statement\n\n- Students and professionals experience severe anxiety under tight deadlines.\n- Existing planners require complex setup and data entries.\n\n### The Solution\n\n- Natural language panic intake.\n- Real-time segmented countdown times.\n- Direct inline AI drafts to execute steps immediately.`,
  demo_step_2: `## Design Elements\n\n- **Theme**: Cyberpunk Tactical Dark Mode\n- **Typography**: Inter (modern, premium sans-serif)\n- **Accents**:\n  - HSL Urgency Orange/Red (#ffb3b0)\n  - HSL Mint Success (#44dfab)\n  - HSL Deep Slate Backgrounds (#131313)`,
  demo_step_3: `\`\`\`typescript\n// Client-side real-time listener\nexport function useLiveDeadline(taskId: string) {\n  const [timeLeft, setTimeLeft] = useState(0);\n  useEffect(() => {\n    const unsub = onSnapshot(doc(db, 'tasks', taskId), (snap) => {\n      setTimeLeft(snap.data().true_deadline);\n    });\n    return unsub;\n  }, [taskId]);\n}\n\`\`\``,
  demo_step_4: `## Pitch Video Sequence\n\n1. **Hook (0:00 - 0:15)**: Show empty screen, describe 2 AM panic.\n2. **Demo (0:15 - 1:15)**: Dictate panic into intake. Generate plan instantly.\n3. **Inline Workspace (1:15 - 1:45)**: Stream Gemini draft slides live.\n4. **Conclusion (1:45 - 2:00)**: Deliver team value prop.`,
  demo_step_5: `## Submission Checklist\n\n- [x] Push all code to main branch on GitHub.\n- [x] Record and upload the 2-minute video walk-through.\n- [x] Finalize README.md and PROJECT_DOCUMENTATION.md.\n- [x] Submit link to the hackathon devpost portal.`,
};

export default function DemoPage() {
  const router = useRouter();
  const [task, setTask] = useState<FirestoreTask>(INITIAL_DEMO_TASK);
  const [activeStep, setActiveStep] = useState<ActionStep | null>(null);
  
  // Timer state
  const [countdown, setCountdown] = useState<any>(null);
  const [deadlineOffsetMs, setDeadlineOffsetMs] = useState(0);

  // Simulated streaming states
  const [streamedContent, setStreamedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Tick calculation based on manual offset
  useEffect(() => {
    const tick = () => {
      const adjustedDeadline = new Date(new Date(INITIAL_DEMO_TASK.true_deadline).getTime() - deadlineOffsetMs).toISOString();
      const state = calculateCountdown(adjustedDeadline);
      setCountdown(state);

      // Adjust urgency score based on time remaining to demo color-shifting
      const hoursRemaining = state.totalSeconds / 3600;
      let newScore = 5;
      if (hoursRemaining <= 2) newScore = 10;
      else if (hoursRemaining <= 4) newScore = 9;
      else if (hoursRemaining <= 8) newScore = 8;
      else if (hoursRemaining <= 24) newScore = 6;
      
      setTask((prev) => ({
        ...prev,
        true_deadline: adjustedDeadline,
        urgency_score: newScore,
      }));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadlineOffsetMs]);

  // Handle mock step execution stream
  useEffect(() => {
    if (!activeStep) return;

    setStreamedContent('');
    setIsStreaming(true);
    setIsDone(false);

    const fullText = MOCK_STREAM_ANSWERS[activeStep.step_id] || 'Generating draft details...';
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx < fullText.length) {
        setStreamedContent(fullText.slice(0, currentIdx + 3));
        currentIdx += 3;
      } else {
        setIsStreaming(false);
        setIsDone(true);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [activeStep]);

  // Time manipulation buttons (Fast Forward)
  const adjustDeadline = (hoursToSubtract: number) => {
    setDeadlineOffsetMs((prev) => prev + hoursToSubtract * 60 * 60 * 1000);
    toast.success(`⏰ Fast-forwarded time by -${hoursToSubtract} hours!`);
  };

  const resetDeadline = () => {
    setDeadlineOffsetMs(0);
    setTask((prev) => ({
      ...prev,
      action_steps: INITIAL_DEMO_TASK.action_steps,
    }));
    setActiveStep(null);
    toast.success('🔄 Demo reset to initial states.');
  };

  const handleToggleStep = (stepId: string) => {
    setTask((prev) => ({
      ...prev,
      action_steps: prev.action_steps.map((s) =>
        s.step_id === stepId
          ? {
              ...s,
              completed: !s.completed,
              completed_at: !s.completed ? new Date().toISOString() : null,
            }
          : s
      ),
    }));
    toast.success('Step status toggled.');
  };

  const handleMarkComplete = () => {
    if (!activeStep) return;
    handleToggleStep(activeStep.step_id);
    setActiveStep(null);
  };

  const thresholds = getUrgencyThresholds(task.urgency_score);
  const progress = calculateProgress(task.action_steps);
  const totalMinutes = calculateTotalTime(task.action_steps);
  const completedSteps = task.action_steps.filter((s) => s.completed).length;

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col text-text-primary">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-border-subtle/50 glass">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-xs text-text-secondary/60 hover:text-text-primary transition-colors uppercase tracking-wider font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-urgency animate-pulse" />
          <span className="text-xs font-black uppercase text-urgency tracking-wider">Sandbox Judge Mode</span>
        </div>
      </nav>

      {/* Demo Controls Bar */}
      <div className="bg-bg-raised border-b border-border-subtle/50 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-mint" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Judge Sandbox Simulation Tools:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => adjustDeadline(4)}
            className="px-3 py-1 rounded bg-bg-card hover:bg-bg-hover border border-border-subtle text-[10px] font-bold text-text-secondary transition-colors"
          >
            ⏩ Subtract 4 hours (Color Shift)
          </button>
          <button
            onClick={() => adjustDeadline(7)}
            className="px-3 py-1 rounded bg-bg-card hover:bg-bg-hover border border-border-subtle text-[10px] font-bold text-crisis transition-colors"
          >
            🚨 Subtract 7 hours (Critical Alert)
          </button>
          <button
            onClick={resetDeadline}
            className="px-3 py-1 rounded bg-urgency-bg/10 hover:bg-urgency-bg/30 border border-urgency/30 text-[10px] font-bold text-urgency transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset State
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left pane: Mission control */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Countdown Hero */}
          <div
            className={cn(
              'rounded-3xl border p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-lg transition-all duration-500',
              thresholds.bgColor,
              thresholds.borderColor
            )}
          >
            <div>
              <span className="px-2.5 py-0.5 rounded bg-bg-base/60 text-xs font-bold tracking-widest uppercase text-text-secondary border border-border-subtle/50">
                Urgency Score: {task.urgency_score}/10
              </span>
              <h1 className="text-3xl font-black text-white leading-tight mt-2">{task.task_name}</h1>
            </div>

            {countdown && (
              <div className="flex flex-col items-center">
                <span className="font-mono text-5xl md:text-7xl font-black tracking-widest tabular-nums text-white neon-text-urgency animate-pulse">
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
                <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">
                  Remaining Time Window (Reactive Favicon Trigger)
                </span>
              </div>
            )}
          </div>

          {/* Time Budget */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-3">
            <div className="flex justify-between text-xs text-text-secondary">
              <span className="font-bold uppercase tracking-wider">Time Budget Segment Timeline</span>
              <span>Total Estimated Focus: {formatDuration(totalMinutes)}</span>
            </div>
            
            <div className="h-4 bg-bg-base rounded-full overflow-hidden flex divide-x divide-bg-card">
              {task.action_steps.map((step) => (
                <div
                  key={step.step_id}
                  className={cn(
                    'h-full transition-all duration-300',
                    step.completed ? 'bg-mint hover:bg-mint/80' : 
                      task.urgency_score >= 9 ? 'bg-crisis hover:bg-crisis/80' : 'bg-urgency hover:bg-urgency/80'
                  )}
                  style={{ flexGrow: step.duration_minutes }}
                  title={`${step.title} (${step.duration_minutes}m)`}
                />
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border-subtle bg-bg-base/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-mint" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Action Steps</h2>
              </div>
              <span className="text-xs text-text-secondary">
                {completedSteps}/{task.action_steps.length} Completed
              </span>
            </div>

            <div className="divide-y divide-border-subtle/30">
              {task.action_steps.map((step) => (
                <div
                  key={step.step_id}
                  className={cn(
                    'group flex items-center justify-between px-6 py-4 transition-colors',
                    step.completed ? 'bg-bg-base/20 opacity-60' : 'hover:bg-bg-hover/20',
                    activeStep?.step_id === step.step_id && 'bg-urgency-bg/10 border-l-2 border-urgency'
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                    <button
                      onClick={() => handleToggleStep(step.step_id)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        step.completed
                          ? 'bg-mint-bg/40 border-mint text-mint'
                          : 'border-border-subtle text-text-secondary/40 hover:border-text-primary'
                      )}
                    >
                      {step.completed && <CheckCircle className="w-4 h-4" />}
                    </button>

                    <div
                      className="min-w-0 cursor-pointer"
                      onClick={() => {
                        if (!step.completed) setActiveStep(step);
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
                        Duration: {formatDuration(step.duration_minutes)} · Prompt: &quot;{step.ai_starter_prompt}&quot;
                      </p>
                    </div>
                  </div>

                  {!step.completed && (
                    <button
                      onClick={() => setActiveStep(step)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-urgency-bg border border-urgency/40 text-[10px] font-bold text-urgency hover:bg-urgency-bg/80"
                    >
                      <Play className="w-2.5 h-2.5" />
                      Simulate Execute
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* Right pane: Docked inline workspace simulator */}
        <section className="lg:col-span-2 flex flex-col h-full min-h-[450px]">
          {activeStep ? (
            <div className="w-full h-full flex flex-col bg-bg-card border border-border-subtle rounded-3xl overflow-hidden">
              <div className="flex items-start justify-between p-5 border-b border-border-subtle bg-bg-base/30">
                <div>
                  <span className="text-xs text-text-secondary">Simulated Gemini 1.5 Flash Execution</span>
                  <h2 className="text-base font-black text-white leading-tight mt-1">{activeStep.title}</h2>
                </div>
                {isDone && (
                  <button
                    onClick={handleMarkComplete}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-mint-bg hover:bg-mint-bg/85 border border-mint text-xs font-bold text-mint"
                  >
                    Done
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-bg-base/10 min-h-[300px]">
                {streamedContent ? (
                  <div className="prose prose-invert prose-xs leading-relaxed font-mono whitespace-pre-wrap text-text-primary">
                    {streamedContent}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-text-secondary py-10">
                    <div className="w-4 h-4 border-2 border-urgency border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Initializing mock local stream...</span>
                  </div>
                )}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-urgency animate-pulse align-middle ml-1" />
                )}
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle bg-bg-base/20">
                <span className="text-[10px] text-text-secondary/60">
                  {isStreaming ? 'Typing output...' : isDone ? 'Finished rendering.' : ''}
                </span>
                {isDone && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(streamedContent);
                      toast.success('Copied text!');
                    }}
                    className="px-2.5 py-1 rounded bg-bg-raised text-[10px] text-text-secondary border border-border-subtle"
                  >
                    Copy Mock Data
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-border-subtle border-dashed bg-bg-card/30">
              <Zap className="w-8 h-8 text-text-secondary/30 mb-4" />
              <h3 className="text-sm font-bold text-text-primary mb-1">Sandbox Execution Panel</h3>
              <p className="text-xs text-text-secondary max-w-[200px] leading-relaxed">
                Click &quot;Simulate Execute&quot; on any step to test real-time AI stream rendering without invoking the cloud APIs.
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
