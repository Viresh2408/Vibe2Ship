'use client';

/**
 * PanicIntake — Emergency Deadline Input Component
 *
 * Full-width, natural-language textarea for dump-typing deadline panic.
 * Features: auto-resize, deadline detection hint, character counter,
 * example prompts, and submission to /api/panic.
 */

import React, { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react';
import { Zap, AlertCircle, Loader2, ChevronDown, ChevronUp, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import type { FirestoreTask } from '@/types/task';
import toast from 'react-hot-toast';

interface PanicIntakeProps {
  onTaskCreated: (task: FirestoreTask) => void;
  disabled?: boolean;
}

const EXAMPLE_PROMPTS = [
  "I have an engineering research paper due at 8 AM tomorrow and I haven't started. I still need an abstract, 3 body sections, references, and to format it in IEEE style.",
  "Client presentation in 4 hours, slides aren't done, need to cover Q2 metrics, product roadmap, and competitive analysis. Help!",
  "Final exam at 2 PM today, haven't studied chapters 5-9. I understand chapters 1-4 well. It's 9 AM now.",
  "Project code due tonight at midnight, I've only built the UI. Backend API, database, and testing are all missing.",
  "MBA assignment due in 6 hours — 2000 word case study analysis on Apple's supply chain strategy. Just started.",
];

export default function PanicIntake({ onTaskCreated, disabled = false }: PanicIntakeProps) {
  const { getIdToken, user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_CHARS = 5000;

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput((prev) => {
            const combined = (prev + ' ' + transcript).trim();
            setCharCount(combined.length);
            return combined;
          });
        };

        rec.onerror = (e: any) => {
          console.error('[Speech] Error:', e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success('Voice input stopped.');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Listening... Speak your panic now.', {
        icon: '🎙️',
        style: { background: '#68000f', color: '#ffb3b0', border: '1px solid #ffb3b0' }
      });
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setInput(value);
      setCharCount(value.length);
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading || !user) return;

    if (trimmedInput.length < 20) {
      toast.error('Please describe your deadline situation in more detail');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('🧠 Analyzing your deadline...', {
      style: { background: '#1c1b1b', color: '#e5e2e1', border: '1px solid #46464c' },
    });

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/panic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // NOTE: user_id is intentionally omitted from the body.
        // The server reads userId from the verified JWT Bearer token only.
        body: JSON.stringify({
          raw_input: trimmedInput,
        }),
      });

      const data = (await response.json()) as { task?: FirestoreTask; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? `Server error: ${response.status}`);
      }

      if (!data.task) {
        throw new Error('No task returned from server');
      }

      toast.dismiss(loadingToast);
      toast.success(`⚡ Action plan created — ${data.task.action_steps.length} steps`, {
        duration: 4000,
        style: { background: '#003827', color: '#44dfab', border: '1px solid #44dfab' },
      });

      onTaskCreated(data.task);
      setInput('');
      setCharCount(0);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err instanceof Error ? err.message : 'Failed to analyze deadline', {
        duration: 6000,
        style: { background: '#690005', color: '#ffb4ab', border: '1px solid #ffb4ab' },
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, user, getIdToken, onTaskCreated]);

  const applyExample = (example: string) => {
    setInput(example);
    setCharCount(example.length);
    setShowExamples(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const hasInput = input.trim().length >= 20;

  return (
    <div className="w-full space-y-3">
      {/* Main Input Container */}
      <div
        className={cn(
          'relative rounded-2xl border-2 transition-all duration-300',
          'bg-bg-card/85 backdrop-blur-sm',
          loading
            ? 'border-urgency/60 shadow-glow-urgency'
            : hasInput
            ? 'border-urgency/60 shadow-[0_0_20px_rgba(255,179,176,0.15)]'
            : 'border-border-subtle hover:border-border-strong',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        {/* Header label */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <div className="w-2 h-2 rounded-full bg-crisis animate-pulse" />
          <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Emergency Deadline Input
          </span>
          <span className="ml-auto text-xs text-text-secondary/70">
            {charCount > 0 && `${charCount}/${MAX_CHARS}`}
          </span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="panic-intake"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe your deadline panic in plain English...&#10;&#10;e.g., &quot;Engineering paper due 8 AM tomorrow, haven't started, need abstract, 3 body sections, and references. It's 11 PM right now.&quot;"
          disabled={loading || disabled}
          rows={4}
          className={cn(
            'w-full bg-transparent px-4 pb-3 text-text-primary',
            'placeholder:text-text-secondary/40 resize-none focus:outline-none',
            'text-base leading-relaxed min-h-[120px] max-h-[400px]',
            'scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent'
          )}
        />

        {/* Footer bar */}
        <div className="flex items-center justify-between px-4 pb-4 pt-1 border-t border-border-subtle/50">
          <div className="flex items-center gap-3">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  'p-2 rounded-xl border transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-bold',
                  isListening
                    ? 'bg-crisis-bg text-crisis border-crisis animate-pulse'
                    : 'bg-bg-raised text-text-secondary/80 border-border-subtle hover:text-text-primary'
                )}
                title={isListening ? 'Stop listening' : 'Start voice transcription'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Stop Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Input</span>
                  </>
                )}
              </button>
            )}
            <span className="text-xs text-text-secondary/40 hidden sm:inline-block">
              <kbd className="px-1.5 py-0.5 rounded bg-bg-raised text-text-secondary border border-border-subtle/60 text-[10px]">
                ⌘
              </kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 rounded bg-bg-raised text-text-secondary border border-border-subtle/60 text-[10px]">
                Enter
              </kbd>
              {' to submit'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            id="panic-submit-btn"
            onClick={handleSubmit}
            disabled={!hasInput || loading || disabled}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm border',
              'transition-all duration-200 transform active:scale-95',
              hasInput && !loading
                ? 'bg-urgency-bg border-urgency hover:bg-urgency-bg/85 text-urgency shadow-glow-urgency hover:shadow-[0_0_25px_rgba(255,179,176,0.5)] cursor-pointer'
                : 'bg-bg-raised/50 text-text-secondary/40 border-border-subtle/30 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generate Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example Prompt Chips (visible when input is empty) */}
      {input.length === 0 && !loading && (
        <div className="flex flex-wrap items-center gap-2.5 animate-slide-up pt-1.5">
          <span className="text-[10px] text-text-secondary/40 uppercase tracking-widest font-bold">Quick Try:</span>
          <button
            onClick={() => applyExample(EXAMPLE_PROMPTS[0])}
            className="px-3.5 py-1.5 rounded-full bg-bg-card/50 hover:bg-bg-hover border border-border-subtle hover:border-urgency/50 text-xs text-text-secondary hover:text-text-primary transition-all duration-200"
          >
            Research Paper Due 📝
          </button>
          <button
            onClick={() => applyExample(EXAMPLE_PROMPTS[1])}
            className="px-3.5 py-1.5 rounded-full bg-bg-card/50 hover:bg-bg-hover border border-border-subtle hover:border-urgency/50 text-xs text-text-secondary hover:text-text-primary transition-all duration-200"
          >
            Slides for Client 🎤
          </button>
          <button
            onClick={() => applyExample(EXAMPLE_PROMPTS[3])}
            className="px-3.5 py-1.5 rounded-full bg-bg-card/50 hover:bg-bg-hover border border-border-subtle hover:border-urgency/50 text-xs text-text-secondary hover:text-text-primary transition-all duration-200"
          >
            Code due tonight 💻
          </button>
        </div>
      )}


      {/* AI Analysis Loading State */}
      {loading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-urgency-bg/30 border border-urgency/40 animate-slide-up">
          <Loader2 className="w-4 h-4 text-urgency animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-urgency">
              Gemini 1.5 Flash is analyzing your deadline...
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Calculating urgency, building micro-steps, generating AI prompts
            </p>
          </div>
        </div>
      )}

      {/* Example Prompts Toggle */}
      {!loading && (
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center gap-2 text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Not sure what to type? See examples</span>
          {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      {/* Example Prompts List */}
      {showExamples && !loading && (
        <div className="space-y-2 animate-slide-up">
          {EXAMPLE_PROMPTS.map((example, idx) => (
            <button
              key={idx}
              onClick={() => applyExample(example)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl text-sm text-text-secondary',
                'bg-bg-card/50 border border-border-subtle hover:border-urgency/50',
                'hover:bg-bg-hover/50 hover:text-text-primary transition-all duration-200',
                'line-clamp-2'
              )}
            >
              <span className="text-urgency font-bold mr-2">#{idx + 1}</span>
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

