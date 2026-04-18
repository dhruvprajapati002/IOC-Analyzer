// app/api/file-analysis-v2/services/rate-limit.ts

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 10;
const WINDOW = 3600000; // 1 hour

export function checkRateLimit(userId: string) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + WINDOW });
    return { 
      allowed: true, 
      remaining: MAX_REQUESTS - 1, 
      resetAt: now + WINDOW,
      maxRequests: MAX_REQUESTS
    };
  }

  if (userLimit.count < MAX_REQUESTS) {
    userLimit.count++;
    return { 
      allowed: true, 
      remaining: MAX_REQUESTS - userLimit.count, 
      resetAt: userLimit.resetAt,
      maxRequests: MAX_REQUESTS
    };
  }

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
