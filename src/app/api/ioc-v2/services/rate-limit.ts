// app/api/ioc-v2/services/rate-limit.ts

interface WindowCounter {
  count: number;
  resetAt: number;
}

interface ClientRateLimit {
  minute: WindowCounter;
  day: WindowCounter;
}

export interface RateLimitResult {
  allowed: boolean;
  limitType: 'minute' | 'day' | null;
  retryAfter: number;
  minute: {
    limit: number;
    remaining: number;
    resetAt: number;
  };
  day: {
    limit: number;
    remaining: number;
    resetAt: number;
  };
}

const rateLimits = new Map<string, ClientRateLimit>();

const MINUTE_LIMIT = 4;
const DAY_LIMIT = 100;
const MINUTE_WINDOW_MS = 60_000;
const DAY_WINDOW_MS = 86_400_000;

function createCounter(now: number, windowMs: number): WindowCounter {
  return {
    count: 0,
    resetAt: now + windowMs,
  };
}

function refreshCounter(counter: WindowCounter, now: number, windowMs: number): WindowCounter {
  if (now >= counter.resetAt) {
    return createCounter(now, windowMs);
  }
  return counter;
}

function toResult(
  allowed: boolean,
  minute: WindowCounter,
  day: WindowCounter,
  limitType: 'minute' | 'day' | null,
  retryAfter: number
): RateLimitResult {
  return {
    allowed,
    limitType,
    retryAfter,
    minute: {
      limit: MINUTE_LIMIT,
      remaining: Math.max(0, MINUTE_LIMIT - minute.count),
      resetAt: minute.resetAt,
    },
    day: {
      limit: DAY_LIMIT,
      remaining: Math.max(0, DAY_LIMIT - day.count),
      resetAt: day.resetAt,
    },
  };
}

export function checkRateLimit(clientKey: string): RateLimitResult {
  const now = Date.now();
  const key = clientKey || 'unknown';
  const existing = rateLimits.get(key);

  let minute = refreshCounter(existing?.minute || createCounter(now, MINUTE_WINDOW_MS), now, MINUTE_WINDOW_MS);
  let day = refreshCounter(existing?.day || createCounter(now, DAY_WINDOW_MS), now, DAY_WINDOW_MS);

  if (minute.count >= MINUTE_LIMIT) {
    rateLimits.set(key, { minute, day });
    const retryAfter = Math.max(1, Math.ceil((minute.resetAt - now) / 1000));
    return toResult(false, minute, day, 'minute', retryAfter);
  }

  if (day.count >= DAY_LIMIT) {
    rateLimits.set(key, { minute, day });
    const retryAfter = Math.max(1, Math.ceil((day.resetAt - now) / 1000));
    return toResult(false, minute, day, 'day', retryAfter);
  }

  minute = { ...minute, count: minute.count + 1 };
  day = { ...day, count: day.count + 1 };

  rateLimits.set(key, { minute, day });

  return toResult(true, minute, day, null, 0);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    const minuteExpired = now >= entry.minute.resetAt;
    const dayExpired = now >= entry.day.resetAt;

    if (minuteExpired && dayExpired) {
      rateLimits.delete(key);
      continue;
    }

    if (minuteExpired || dayExpired) {
      rateLimits.set(key, {
        minute: minuteExpired ? createCounter(now, MINUTE_WINDOW_MS) : entry.minute,
        day: dayExpired ? createCounter(now, DAY_WINDOW_MS) : entry.day,
      });
    }
  }
}, 300_000);

export const RATE_LIMIT_CONFIG = {
  MINUTE_LIMIT,
  DAY_LIMIT,
  MINUTE_WINDOW_MS,
  DAY_WINDOW_MS,
};
