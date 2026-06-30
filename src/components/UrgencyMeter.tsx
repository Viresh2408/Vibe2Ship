'use client';

/**
 * UrgencyMeter — Visual urgency score indicator (1-10)
 *
 * Displays a dynamic ring/bar visualization tied to urgency_score.
 * Higher scores trigger pulse animations and warning states.
 */

import React from 'react';
import { cn, getUrgencyThresholds } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface UrgencyMeterProps {
  score: number; // 1–10
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function UrgencyMeter({
  score,
  showLabel = true,
  size = 'md',
}: UrgencyMeterProps) {
  const clampedScore = Math.max(1, Math.min(10, Math.round(score)));
  const thresholds = getUrgencyThresholds(clampedScore);

  const percentage = (clampedScore / 10) * 100;

  // SVG circle dimensions
  const dims = { sm: 60, md: 90, lg: 120 }[size];
  const strokeWidth = { sm: 6, md: 8, lg: 10 }[size];
  const radius = (dims - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const strokeColor = {
    low: '#44dfab',       // mint (resolution/success)
    medium: '#c2c6db',    // cool (trust)
    high: '#ffb3b0',      // urgency
    critical: '#ffb4ab',  // crisis
  }[thresholds.level];

  const textSize = { sm: 'text-sm', md: 'text-xl', lg: 'text-2xl' }[size];
  const labelSize = { sm: 'text-[8px]', md: 'text-[10px]', lg: 'text-xs' }[size];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* SVG Ring */}
      <div
        className={cn(
          'relative flex items-center justify-center',
          thresholds.level === 'critical' && 'animate-pulse-ring'
        )}
        style={{
          filter:
            thresholds.level === 'critical' || thresholds.level === 'high'
              ? `drop-shadow(0 0 8px ${strokeColor}80)`
              : undefined,
        }}
      >
        <svg width={dims} height={dims} className="-rotate-90">
          {/* Track */}
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease-in-out' }}
          />
        </svg>

        {/* Center Score */}
        <div className="absolute flex flex-col items-center">
          <span
            className={cn('font-black tabular-nums', textSize)}
            style={{ color: strokeColor }}
          >
            {clampedScore}
          </span>
          <span className={cn('font-semibold text-text-secondary uppercase tracking-widest', labelSize)}>
            /10
          </span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex items-center gap-1">
          {thresholds.level === 'critical' && (
            <Zap className="w-3 h-3 text-crisis animate-pulse" />
          )}
          <span
            className={cn(
              'text-xs font-bold uppercase tracking-widest',
              thresholds.color
            )}
          >
            {thresholds.label}
          </span>
        </div>
      )}

      {/* Score bar (10 pips) */}
      {size !== 'sm' && (
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                size === 'lg' ? 'w-3 h-2' : 'w-2 h-1.5',
                i < clampedScore
                  ? cn(
                      {
                        'bg-mint': thresholds.level === 'low',
                        'bg-cool': thresholds.level === 'medium',
                        'bg-urgency': thresholds.level === 'high',
                        'bg-crisis': thresholds.level === 'critical',
                      }
                    )
                  : 'bg-border-subtle'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

