// app/api/ioc-v2/services/rate-limit.ts

const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Configuration
const MAX_REQUESTS = 100; // 100 IOC lookups per hour
const WINDOW = 3600000; // 1 hour in milliseconds

export function checkRateLimit(userId: string) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  // First request or expired window
  if (!userLimit || now > userLimit.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + WINDOW });
    return { 
      allowed: true, 
      remaining: MAX_REQUESTS - 1, 
      resetAt: now + WINDOW,
      maxRequests: MAX_REQUESTS
    };
  }

  // Within limit
  if (userLimit.count < MAX_REQUESTS) {
    userLimit.count++;
    return { 
      allowed: true, 
      remaining: MAX_REQUESTS - userLimit.count, 
      resetAt: userLimit.resetAt,
      maxRequests: MAX_REQUESTS
    };
  }

  // Rate limit exceeded
  return { 
    allowed: false, 
    remaining: 0, 
    resetAt: userLimit.resetAt,
    maxRequests: MAX_REQUESTS
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimits.entries()) {
    if (now > limit.resetAt) {
      rateLimits.delete(userId);
    }
  }
}, 300000);

export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS,
  WINDOW,
  WINDOW_MINUTES: WINDOW / 60000
};
