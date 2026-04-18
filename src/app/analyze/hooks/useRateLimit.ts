import { useCallback, useEffect, useMemo, useState } from 'react';

export interface RateLimitState {
  minuteRemaining: number;
  minuteReset: number;
  dayRemaining: number;
  dayReset: number;
  isLimited: boolean;
  limitType: 'minute' | 'day' | null;
  retryAfterSeconds: number;
  countdown: number;
}

const DEFAULT_STATE: RateLimitState = {
  minuteRemaining: 4,
  minuteReset: Date.now() + 60_000,
  dayRemaining: 100,
  dayReset: Date.now() + 86_400_000,
  isLimited: false,
  limitType: null,
  retryAfterSeconds: 0,
  countdown: 0,
};

function parseHeaderNumber(headers: Headers, key: string, fallback: number): number {
  const value = headers.get(key);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useRateLimit() {
  const [state, setState] = useState<RateLimitState>(DEFAULT_STATE);

  const updateFromHeaders = useCallback(
    (
      headers: Headers,
      limitInfo?: {
        type?: 'minute' | 'day';
        retryAfter?: number;
      }
    ) => {
      setState((prev) => {
        const minuteLimit = parseHeaderNumber(headers, 'X-RateLimit-Limit-Minute', 4);
        const dayLimit = parseHeaderNumber(headers, 'X-RateLimit-Limit-Day', 100);

        const minuteRemaining = parseHeaderNumber(
          headers,
          'X-RateLimit-Remaining-Minute',
          Math.min(prev.minuteRemaining, minuteLimit)
        );
        const dayRemaining = parseHeaderNumber(
          headers,
          'X-RateLimit-Remaining-Day',
          Math.min(prev.dayRemaining, dayLimit)
        );

        const minuteResetSeconds = parseHeaderNumber(
          headers,
          'X-RateLimit-Reset-Minute',
          Math.floor(prev.minuteReset / 1000)
        );
        const dayResetSeconds = parseHeaderNumber(
          headers,
          'X-RateLimit-Reset-Day',
          Math.floor(prev.dayReset / 1000)
        );

        const minuteReset = minuteResetSeconds * 1000;
        const dayReset = dayResetSeconds * 1000;
        const now = Date.now();

        const inferredType: 'minute' | 'day' | null =
          limitInfo?.type ||
          (minuteRemaining <= 0 ? 'minute' : dayRemaining <= 0 ? 'day' : null);

        const retryAfterSeconds =
          limitInfo?.retryAfter ??
          (inferredType === 'minute'
            ? Math.max(0, Math.ceil((minuteReset - now) / 1000))
            : inferredType === 'day'
              ? Math.max(0, Math.ceil((dayReset - now) / 1000))
              : 0);

        const isLimited = inferredType !== null;

        return {
          minuteRemaining,
          minuteReset,
          dayRemaining,
          dayReset,
          isLimited,
          limitType: inferredType,
          retryAfterSeconds,
          countdown: isLimited ? retryAfterSeconds : 0,
        };
      });
    },
    []
  );

  const setLimited = useCallback((type: 'minute' | 'day', retryAfterSeconds: number) => {
    setState((prev) => ({
      ...prev,
      isLimited: true,
      limitType: type,
      retryAfterSeconds,
      countdown: retryAfterSeconds,
      minuteRemaining: type === 'minute' ? 0 : prev.minuteRemaining,
      dayRemaining: type === 'day' ? 0 : prev.dayRemaining,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  useEffect(() => {
    if (!state.isLimited) return undefined;

    const timer = window.setInterval(() => {
      setState((prev) => {
        if (!prev.isLimited) return prev;
        const nextCountdown = Math.max(0, prev.countdown - 1);

        if (nextCountdown === 0) {
          return {
            ...prev,
            isLimited: false,
            limitType: null,
            retryAfterSeconds: 0,
            countdown: 0,
          };
        }

        return {
          ...prev,
          countdown: nextCountdown,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.isLimited]);

  const minuteUsage = useMemo(() => 4 - state.minuteRemaining, [state.minuteRemaining]);

  return {
    state,
    updateFromHeaders,
    setLimited,
    reset,
    minuteUsage,
  };
}
