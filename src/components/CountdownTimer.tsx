'use client';

/**
 * CountdownTimer — Real-time deadline countdown
 *
 * Updates every second. Changes visual state based on urgency level.
 * Triggers alarm animation when under 60 minutes.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateCountdown, formatCountdownDisplay, formatDeadline, pad2 } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CountdownState } from '@/types/task';

interface CountdownTimerProps {
  deadlineISO: string;
  taskName: string;
  compact?: boolean;
}

export default function CountdownTimer({
  deadlineISO,
  taskName,
  compact = false,
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    calculateCountdown(deadlineISO)
  );
  const [tick, setTick] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(calculateCountdown(deadlineISO));
      // Trigger tick animation
      setTick((t) => !t);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deadlineISO]);

  const { urgencyLevel, isExpired } = countdown;

  const containerStyles = cn(
    'rounded-2xl border transition-all duration-500',
    compact ? 'p-3' : 'p-6',
    {
      'border-mint/50 bg-mint-bg/20 shadow-urgency-low': urgencyLevel === 'low',
      'border-cool/50 bg-bg-raised/20 shadow-urgency-medium': urgencyLevel === 'medium',
      'border-urgency/60 bg-urgency-bg/25 shadow-urgency-high': urgencyLevel === 'high',
      'border-crisis/70 bg-crisis-bg/30 shadow-urgency-critical animate-border-pulse':
        urgencyLevel === 'critical',
      'border-border-subtle bg-bg-card': isExpired,
    }
  );

  const digitStyles = cn(
    'font-mono font-black tabular-nums transition-transform duration-100',
    compact ? 'text-2xl' : 'text-5xl md:text-6xl',
    {
      'text-mint': urgencyLevel === 'low',
      'text-cool': urgencyLevel === 'medium',
      'text-urgency': urgencyLevel === 'high',
      'text-crisis animate-glow-pulse': urgencyLevel === 'critical',
      'text-text-secondary/60': isExpired,
    }
  );

  if (compact) {
    return (
      <div className={containerStyles}>
        <div className="flex items-center gap-2">
          <Timer
            className={cn('w-4 h-4', {
              'text-mint': urgencyLevel === 'low',
              'text-cool': urgencyLevel === 'medium',
              'text-urgency': urgencyLevel === 'high',
              'text-crisis': urgencyLevel === 'critical',
            })}
          />
          <span className={cn('font-mono font-bold text-lg', digitStyles)}>
            {isExpired ? 'EXPIRED' : formatCountdownDisplay(countdown)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <CheckCircle2 className="w-5 h-5 text-text-secondary/60" />
          ) : urgencyLevel === 'critical' ? (
            <AlertTriangle className="w-5 h-5 text-crisis animate-pulse" />
          ) : (
            <Timer className="w-5 h-5 text-text-secondary/70" />
          )}
          <span className="text-sm font-medium text-text-secondary/60 uppercase tracking-widest">
            {isExpired ? 'Deadline Passed' : 'Time Remaining'}
          </span>
        </div>
        <span className="text-xs text-text-secondary/60 hidden sm:block">
          Due: {formatDeadline(deadlineISO)}
        </span>
      </div>

      {/* Countdown Digits */}
      {isExpired ? (
        <div className="text-center py-4">
          <p className="text-3xl font-black text-text-secondary/60">DEADLINE PASSED</p>
          <p className="text-sm text-text-secondary/50 mt-1">Submit what you have</p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1 md:gap-3">
          {countdown.days > 0 && (
            <>
              <DigitBlock
                value={countdown.days}
                label="DAYS"
                digitClass={digitStyles}
                tick={tick}
              />
              <Separator />
            </>
          )}
          <DigitBlock
            value={countdown.hours}
            label="HRS"
            digitClass={digitStyles}
            tick={tick}
          />
          <Separator />
          <DigitBlock
            value={countdown.minutes}
            label="MIN"
            digitClass={digitStyles}
            tick={tick}
          />
          <Separator />
          <DigitBlock
            value={countdown.seconds}
            label="SEC"
            digitClass={cn(digitStyles, 'opacity-90')}
            tick={tick}
          />
        </div>
      )}

      {/* Urgency bar */}
      {!isExpired && (
        <div className="mt-4">
          <div className="h-1 bg-bg-base rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                {
                  'bg-mint': urgencyLevel === 'low',
                  'bg-cool': urgencyLevel === 'medium',
                  'bg-urgency': urgencyLevel === 'high',
                  'bg-crisis': urgencyLevel === 'critical',
                }
              )}
              style={{
                width: urgencyLevel === 'critical'
                  ? '95%'
                  : urgencyLevel === 'high'
                  ? '75%'
                  : urgencyLevel === 'medium'
                  ? '45%'
                  : '15%',
              }}
            />
          </div>
          {urgencyLevel === 'critical' && (
            <p className="text-xs text-crisis font-bold mt-2 text-center animate-pulse uppercase tracking-widest">
              ⚡ Under 2 hours — Execute immediately
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DigitBlock({
  value,
  label,
  digitClass,
  tick,
}: {
  value: number;
  label: string;
  digitClass: string;
  tick: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[3rem] md:min-w-[4.5rem]">
      <span
        className={cn(digitClass, tick && label === 'SEC' ? 'scale-105' : '')}
        style={{ transition: 'transform 0.1s ease-out' }}
      >
        {pad2(value)}
      </span>
      <span className="text-[9px] md:text-[11px] font-semibold tracking-[0.2em] text-text-secondary/50 mt-1">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return <span className="text-3xl md:text-5xl font-black text-text-secondary/30 mb-4 select-none">:</span>;
}

