'use client';

import { Clock } from 'lucide-react';
import {
  APP_COLORS,
} from '@/lib/colors';
import type { RateLimitState } from '@/app/analyze/hooks/useRateLimit';

interface RateLimitIndicatorProps {
  state: RateLimitState;
}

export function RateLimitIndicator({ state }: RateLimitIndicatorProps) {
  const minuteLimit = 4;
  const used = Math.max(0, minuteLimit - state.minuteRemaining);
  const percentage = Math.min(100, (used / minuteLimit) * 100);

  const fillColor =
    state.minuteRemaining >= 2 ? APP_COLORS.success : state.minuteRemaining === 1 ? APP_COLORS.warning : APP_COLORS.danger;

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{
        backgroundColor: state.isLimited ? 'rgba(239,68,68,0.06)' : APP_COLORS.surface,
        borderColor: state.isLimited ? 'rgba(239,68,68,0.25)' : APP_COLORS.border,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-xs" style={{ color: APP_COLORS.textMuted }}>
            <span>
              [{used} / {minuteLimit}] searches this minute
            </span>
            <span>{state.minuteRemaining} remaining</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: APP_COLORS.borderSoft }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${percentage}%`, backgroundColor: fillColor }}
            />
          </div>
        </div>

        <div className="text-right text-xs" style={{ color: APP_COLORS.textMuted }}>
          <p>{state.dayRemaining} searches today</p>
          {state.isLimited ? (
            <p className="mt-1 inline-flex items-center gap-1 font-bold" style={{ color: APP_COLORS.danger }}>
              <Clock className="h-3.5 w-3.5" />
              Rate limit reached - resets in {state.countdown}s
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
