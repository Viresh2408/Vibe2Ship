'use client';

/**
 * ExecutionWorkspace — Inline Gemini AI Execution Modal
 *
 * A fullscreen overlay that pre-loads the step's ai_starter_prompt
 * and streams live Gemini output directly in the UI.
 * Supports copy-to-clipboard and markdown export.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Loader2,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn, getActionTypeIcon, getActionTypeColor } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import type { ActionStep } from '@/types/task';
import toast from 'react-hot-toast';

interface ExecutionWorkspaceProps {
  step: ActionStep;
  taskId: string;
  taskName: string;
  onClose: () => void;
  onStepComplete: (stepId: string) => void;
}

export default function ExecutionWorkspace({
  step,
  taskId,
  taskName,
  onClose,
  onStepComplete,
}: ExecutionWorkspaceProps) {
  const { getIdToken } = useAuth();
  const [streamedContent, setStreamedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [marked, setMarked] = useState<typeof import('marked') | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Lazy-load marked for markdown rendering
  useEffect(() => {
    import('marked').then((m) => setMarked(m));
  }, []);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (contentRef.current && isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamedContent, isStreaming]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const startExecution = useCallback(async () => {
    setStreamedContent('');
    setIsStreaming(true);
    setIsDone(false);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          step_id: step.step_id,
          task_id: taskId,
          ai_starter_prompt: step.ai_starter_prompt,
          user_id: '',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = (await response.json()) as { error: string };
        throw new Error(errData.error ?? 'Execution failed');
      }

      if (!response.body) throw new Error('No response stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const parsed = JSON.parse(data) as { type: string; content: string };
            if (parsed.type === 'text') {
              setStreamedContent((prev) => prev + parsed.content);
            } else if (parsed.type === 'done') {
              setIsDone(true);
              setIsStreaming(false);
            } else if (parsed.type === 'error') {
              throw new Error(parsed.content);
            }
          } catch (parseErr) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setIsStreaming(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Execution failed');
      setIsStreaming(false);
    }
  }, [step, taskId, getIdToken]);

  // Auto-start on mount
  useEffect(() => {
    startExecution();
    return () => { abortRef.current?.abort(); };
  }, [startExecution]);

  const handleCopy = async () => {
    if (!streamedContent) return;
    await navigator.clipboard.writeText(streamedContent);
    setCopied(true);
    toast.success('Copied to clipboard!', {
      duration: 2000,
      style: { background: '#003827', color: '#44dfab', border: '1px solid #44dfab' },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!streamedContent) return;
    const filename = `${step.title.replace(/\s+/g, '_').toLowerCase()}.md`;
    const blob = new Blob(
      [`# ${step.title}\n\n*Task: ${taskName}*\n\n---\n\n${streamedContent}`],
      { type: 'text/markdown' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkComplete = () => {
    onStepComplete(step.step_id);
    toast.success(`✅ Step marked complete!`, {
      style: { background: '#003827', color: '#44dfab', border: '1px solid #44dfab' },
    });
    onClose();
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  // Render markdown safely
  const renderMarkdown = (text: string): string => {
    if (!marked || !text) return text.replace(/\n/g, '<br/>');
    try {
      return marked.parse(text) as string;
    } catch {
      return text.replace(/\n/g, '<br/>');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-bg-card border border-border-subtle rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 p-6 border-b border-border-subtle bg-bg-base/50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getActionTypeIcon(step.action_type)}</span>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border',
                  getActionTypeColor(step.action_type)
                )}
              >
                {step.action_type}
              </span>
              <span className="text-xs text-text-secondary">• {step.duration_minutes}m estimated</span>
            </div>
            <h2 className="text-xl font-black text-text-primary leading-tight">{step.title}</h2>
            <p className="text-sm text-text-secondary mt-0.5 truncate">{taskName}</p>
          </div>

          <div className="flex items-center gap-2">
            {isDone && (
              <button
                id={`complete-step-${step.step_id}`}
                onClick={handleMarkComplete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mint-bg hover:bg-mint-bg/80 text-mint border border-mint text-sm font-bold transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark Done
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── AI Starter Prompt ── */}
        <div className="px-6 py-3 bg-bg-base/30 border-b border-border-subtle">
          <button
            onClick={() => setPromptExpanded(!promptExpanded)}
            className="flex items-center gap-2 text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-urgency" />
            <span className="font-medium">AI Starter Prompt</span>
            {promptExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {promptExpanded && (
            <div className="mt-2 p-3 rounded-xl bg-bg-raised border border-border-subtle">
              <p className="text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
                {step.ai_starter_prompt}
              </p>
            </div>
          )}
        </div>

        {/* ── Streaming Content ── */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6 min-h-0"
          style={{ maxHeight: '50vh' }}
        >
          {error ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-crisis font-medium">{error}</p>
              <button
                onClick={startExecution}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-urgency-bg hover:bg-urgency-bg/80 text-urgency border border-urgency text-sm font-bold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : streamedContent ? (
            <div
              className="prose prose-invert prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-code:text-mint prose-code:bg-bg-raised prose-pre:bg-bg-raised"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(streamedContent) }}
            />
          ) : (
            <div className="flex items-center gap-3 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin text-urgency" />
              <span className="text-sm">Gemini is generating your execution plan...</span>
            </div>
          )}

          {/* Streaming cursor */}
          {isStreaming && streamedContent && (
            <span className="inline-block w-0.5 h-4 bg-urgency animate-pulse ml-0.5 align-middle" />
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-bg-base/50">
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <>
                <div className="w-2 h-2 rounded-full bg-urgency animate-pulse" />
                <span className="text-xs text-text-secondary">Gemini is writing...</span>
                <button
                  onClick={handleStop}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-bg-raised hover:bg-bg-active text-xs text-text-secondary border border-border-subtle transition-colors"
                >
                  Stop
                </button>
              </>
            ) : isDone ? (
              <>
                <div className="w-2 h-2 rounded-full bg-mint" />
                <span className="text-xs text-text-secondary">Generation complete</span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {streamedContent && !isStreaming && (
              <>
                <button
                  onClick={startExecution}
                  title="Regenerate"
                  className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  title="Download as Markdown"
                  className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  id={`copy-step-${step.step_id}`}
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-raised hover:bg-bg-active text-xs text-text-secondary border border-border-subtle transition-colors"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-mint" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

