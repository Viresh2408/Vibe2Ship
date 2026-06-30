'use client';

/**
 * InlineWorkspace — Docked Gemini AI Execution Panel
 *
 * Renders the active step's execution workspace inline within the page layout.
 * Streams Gemini AI output directly, handles copy/download, and marks steps complete.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
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

interface InlineWorkspaceProps {
  step: ActionStep;
  taskId: string;
  taskName: string;
  onStepComplete: (stepId: string) => void;
}

export default function InlineWorkspace({
  step,
  taskId,
  taskName,
  onStepComplete,
}: InlineWorkspaceProps) {
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

  // Lazy-load marked
  useEffect(() => {
    import('marked').then((m) => setMarked(m));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (contentRef.current && isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamedContent, isStreaming]);

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
            // Ignore parse errors
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

  // Auto-start on step change
  useEffect(() => {
    startExecution();
    return () => { abortRef.current?.abort(); };
  }, [step.step_id, startExecution]);

  const handleCopy = async () => {
    if (!streamedContent) return;
    await navigator.clipboard.writeText(streamedContent);
    setCopied(true);
    toast.success('Copied to clipboard!');
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
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const renderMarkdown = (text: string): string => {
    if (!marked || !text) return text.replace(/\n/g, '<br/>');
    try {
      return marked.parse(text) as string;
    } catch {
      return text.replace(/\n/g, '<br/>');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-bg-card border border-border-subtle rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-border-subtle bg-bg-base/30">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{getActionTypeIcon(step.action_type)}</span>
            <span
              className={cn(
                'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border',
                getActionTypeColor(step.action_type)
              )}
            >
              {step.action_type}
            </span>
            <span className="text-xs text-text-secondary">{step.duration_minutes}m estimated</span>
          </div>
          <h2 className="text-lg font-black text-white leading-tight">{step.title}</h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isDone && (
            <button
              onClick={handleMarkComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mint-bg hover:bg-mint-bg/80 text-mint border border-mint text-xs font-bold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark Done
            </button>
          )}
        </div>
      </div>

      {/* AI Prompt */}
      <div className="px-5 py-2.5 bg-bg-base/10 border-b border-border-subtle">
        <button
          onClick={() => setPromptExpanded(!promptExpanded)}
          className="flex items-center gap-1.5 text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-urgency" />
          <span className="font-semibold">AI Starter Prompt</span>
          {promptExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {promptExpanded && (
          <div className="mt-2 p-3 rounded-xl bg-bg-raised border border-border-subtle">
            <p className="text-[11px] text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
              {step.ai_starter_prompt}
            </p>
          </div>
        )}
      </div>

      {/* Stream Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px]"
      >
        {error ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-crisis font-medium">{error}</p>
            <button
              onClick={startExecution}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-urgency-bg hover:bg-urgency-bg/80 text-urgency border border-urgency text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : streamedContent ? (
          <div
            className="prose prose-invert prose-xs max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-code:text-mint prose-code:bg-bg-raised prose-pre:bg-bg-raised"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(streamedContent) }}
          />
        ) : (
          <div className="flex items-center gap-2.5 text-text-secondary py-10">
            <Loader2 className="w-4 h-4 animate-spin text-urgency" />
            <span className="text-xs">Gemini is generating execution plans...</span>
          </div>
        )}

        {isStreaming && streamedContent && (
          <span className="inline-block w-0.5 h-4 bg-urgency animate-pulse ml-0.5 align-middle" />
        )}
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle bg-bg-base/20">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-urgency animate-pulse" />
              <span className="text-[10px] text-text-secondary">Writing...</span>
              <button
                onClick={handleStop}
                className="ml-2 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-active text-[10px] text-text-secondary border border-border-subtle transition-colors"
              >
                Stop
              </button>
            </>
          ) : isDone ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-mint" />
              <span className="text-[10px] text-text-secondary">Ready</span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {streamedContent && !isStreaming && (
            <>
              <button
                onClick={startExecution}
                title="Regenerate"
                className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDownload}
                title="Download as Markdown"
                className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-bg-raised hover:bg-bg-active text-[10px] text-text-secondary border border-border-subtle transition-colors"
              >
                {copied ? (
                  <><Check className="w-3 h-3 text-mint" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
