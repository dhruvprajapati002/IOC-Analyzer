/**
 * Cache TTL Management for Threat Intelligence Platform
 * 
 * Industry-standard TTL configurations for different IOC types
 * based on SOC best practices and data volatility patterns.
 * 
 * @module cache-ttl
 */

export type IOCType = 'hash' | 'ip' | 'domain' | 'url' | 'file';

export interface CacheTTLConfig {
  /** TTL in seconds */
  ttl: number;
  /** Human-readable description */
  description: string;
  /** Rationale for this TTL */
  rationale: string;
}

/**
 * Industry-standard TTL configurations by IOC type
 * 
 * Based on:
 * - NIST SP 800-150 (Guide to Cyber Threat Information Sharing)
 * - MISP Threat Sharing best practices
 * - OpenCTI cache recommendations
 * - Enterprise SOC operational requirements
 */
const TTL_CONFIGS: Record<IOCType, CacheTTLConfig> = {
  /**
   * File Hashes (MD5, SHA1, SHA256)
   * TTL: 7 days (604800 seconds)
   * 
   * Rationale:
   * - File signatures are immutable (hash never changes)
   * - Malware classification is relatively stable
   * - AV vendors update detection regularly but not hourly
   * - 7 days balances freshness with API quota conservation
   * - Can extend to 30 days for known-good hashes (future enhancement)
   */
  hash: {
    ttl: 7 * 24 * 60 * 60, // 7 days
    description: 'File hash (SHA256/MD5/SHA1)',
    rationale: 'File signatures are immutable; AV detections stable over days'
  },

  /**
   * IP Addresses
   * TTL: 7 days (604800 seconds)
   * 
   * Rationale:
   * - Standardized to 7 days for consistency across all IOC types
   * - Balances freshness with API quota conservation
   * - Reduces unnecessary re-analysis of same IOCs
   */
  ip: {
    ttl: 7 * 24 * 60 * 60, // 7 days
    description: 'IP address',
    rationale: 'Standardized 7-day cache for API efficiency'
  },

  /**
   * Domains
   * TTL: 7 days (604800 seconds)
   * 
   * Rationale:
   * - Standardized to 7 days for consistency across all IOC types
   * - Balances freshness with API quota conservation
   * - Reduces unnecessary re-analysis of same IOCs
   */
  domain: {
    ttl: 7 * 24 * 60 * 60, // 7 days
    description: 'Domain name',
    rationale: 'Standardized 7-day cache for API efficiency'
  },

  /**
   * URLs
   * TTL: 7 days (604800 seconds)
   * 
   * Rationale:
   * - Standardized to 7 days for consistency across all IOC types
   * - Balances freshness with API quota conservation
   * - Reduces unnecessary re-analysis of same IOCs
   */
  url: {
    ttl: 7 * 24 * 60 * 60, // 7 days
    description: 'Full URL',
    rationale: 'Standardized 7-day cache for API efficiency'
  },

  /**
   * File Upload Analysis
   * TTL: Permanent (max safe integer)
   * 
   * Rationale:
   * - User-submitted files are analyzed once, results are permanent
   * - Hash-based deduplication prevents re-analysis of same file
   * - Users expect consistent results for uploaded files
   * - Forces re-analysis only when explicitly requested
   * - Reduces API costs dramatically for duplicate file submissions
   */
  file: {
    ttl: Number.MAX_SAFE_INTEGER, // Effectively permanent
    description: 'Uploaded file analysis',
    rationale: 'User-submitted files never expire; hash-based deduplication'
  }
};

/**
 * Get cache TTL for an IOC type
 * 
 * @param iocType - Type of IOC (hash, ip, domain, url, file)
 * @param source - Optional source context (e.g., 'file_analysis' → permanent)
 * @returns TTL in seconds
 * 
 * @example
 * ```typescript
 * const ttl = getCacheTTL('ip'); // 86400 (24 hours)
 * const fileTTL = getCacheTTL('hash', 'file_analysis'); // Permanent
 * ```
 */
export function getCacheTTL(iocType: IOCType, source?: string): number {
  // Special handling: file uploads should never expire
  if (source === 'file_analysis') {
    return TTL_CONFIGS.file.ttl;
  }

  const config = TTL_CONFIGS[iocType];
  if (!config) {
    console.warn(`[CacheTTL] Unknown IOC type: ${iocType}, defaulting to 24h`);
    return TTL_CONFIGS.ip.ttl; // Safe default
  }

  return config.ttl;
}

/**
 * Get cache TTL configuration details
 * 
 * @param iocType - Type of IOC
 * @returns Full TTL configuration with rationale
 */
export function getCacheTTLConfig(iocType: IOCType): CacheTTLConfig {
  return TTL_CONFIGS[iocType] || TTL_CONFIGS.ip;
}

/**
 * Check if cached data is expired
 * 
 * @param lastAnalyzedAt - ISO timestamp of last analysis
 * @param ttlSeconds - TTL in seconds
 * @returns Object with expiry status and time details
 * 
 * @example
 * ```typescript
 * const result = isCacheExpired('2026-01-21T10:00:00Z', 86400);
 * if (result.expired) {
 *   console.log(`Cache expired ${result.ageHours}h ago`);
 * }
 * ```
 */
export function isCacheExpired(
  lastAnalyzedAt: string | Date,
  ttlSeconds: number
): {
  expired: boolean;
  ageSeconds: number;
  ageHours: number;
  ttlHours: number;
  remainingHours: number;
  remainingSeconds: number;
} {
  const now = new Date();
  const lastAnalyzed = new Date(lastAnalyzedAt);
  const ageSeconds = (now.getTime() - lastAnalyzed.getTime()) / 1000;
  const ageHours = ageSeconds / 3600;
  const ttlHours = ttlSeconds / 3600;
  const remainingSeconds = Math.max(0, ttlSeconds - ageSeconds);
  const remainingHours = remainingSeconds / 3600;

  return {
    expired: ageSeconds > ttlSeconds,
    ageSeconds,
    ageHours: parseFloat(ageHours.toFixed(1)),
    ttlHours: parseFloat(ttlHours.toFixed(1)),
    remainingHours: parseFloat(remainingHours.toFixed(1)),
    remainingSeconds: Math.floor(remainingSeconds)
  };
}

/**
 * Format cache status log message
 * 
 * @param ioc - IOC value
 * @param status - Cache status (HIT, MISS, EXPIRED)
 * @param details - Optional details about age/TTL
 * @returns Formatted log message
 */
export function formatCacheLog(
  ioc: string,
  status: 'HIT' | 'MISS' | 'EXPIRED',
  details?: {
    ageHours?: number;
    ttlHours?: number;
    remainingHours?: number;
  }
): string {
  const maskedIOC = ioc.length > 20 ? `${ioc.substring(0, 20)}...` : ioc;

  switch (status) {
    case 'HIT':
      if (details) {
        return `[Cache] ✅ HIT: ${maskedIOC} (age: ${details.ageHours}h / ${details.ttlHours}h TTL, ${details.remainingHours}h remaining)`;
      }
      return `[Cache] ✅ HIT: ${maskedIOC}`;

    case 'EXPIRED':
      if (details) {
        return `[Cache] ⏰ EXPIRED: ${maskedIOC} (age: ${details.ageHours}h, TTL: ${details.ttlHours}h) - refreshing`;
      }
      return `[Cache] ⏰ EXPIRED: ${maskedIOC}`;

    case 'MISS':
      return `[Cache] ❌ MISS: ${maskedIOC} - performing fresh analysis`;

    default:
      return `[Cache] ${status}: ${maskedIOC}`;
  }
}

/**
 * Get human-readable TTL duration
 * 
 * @param seconds - TTL in seconds
 * @returns Human-readable string (e.g., "24 hours", "7 days")
 */
export function formatTTLDuration(seconds: number): string {
  if (seconds >= Number.MAX_SAFE_INTEGER) {
    return 'permanent';
  }

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / 3600);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days} days`;
  }
  return `${hours} hours`;
}

/**
 * Validate and sanitize TTL value
 * 
 * @param ttl - Proposed TTL value
 * @param min - Minimum allowed TTL (default: 1 hour)
 * @param max - Maximum allowed TTL (default: 30 days)
 * @returns Validated TTL within bounds
 */
export function validateTTL(
  ttl: number,
  min: number = 3600, // 1 hour
  max: number = 30 * 24 * 3600 // 30 days
): number {
  if (ttl === Number.MAX_SAFE_INTEGER) {
    return ttl; // Allow permanent cache
  }

  if (ttl < min) {
    console.warn(`[CacheTTL] TTL ${ttl}s below minimum ${min}s, using minimum`);
    return min;
  }

  if (ttl > max) {
    console.warn(`[CacheTTL] TTL ${ttl}s above maximum ${max}s, using maximum`);
    return max;
  }

  return ttl;
}

/**
 * Get TTL from environment variable with fallback
 * 
 * @param iocType - Type of IOC
 * @returns TTL from env or default
 * 
 * Environment variables:
 * - IOC_CACHE_TTL_HASH
 * - IOC_CACHE_TTL_IP
 * - IOC_CACHE_TTL_DOMAIN
 * - IOC_CACHE_TTL_URL
 * - IOC_CACHE_TTL_FILE
 */
export function getTTLFromEnv(iocType: IOCType): number {
  const envVar = `IOC_CACHE_TTL_${iocType.toUpperCase()}`;
  const envValue = process.env[envVar];

  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed)) {
      console.log(`[CacheTTL] Using ${envVar}=${parsed}s from environment`);
      return validateTTL(parsed);
    }
  }

  return getCacheTTL(iocType);
}

// Export TTL constants for direct use
export const TTL = {
  HASH: TTL_CONFIGS.hash.ttl,
  IP: TTL_CONFIGS.ip.ttl,
  DOMAIN: TTL_CONFIGS.domain.ttl,
  URL: TTL_CONFIGS.url.ttl,
  FILE: TTL_CONFIGS.file.ttl,
  
  // Convenience values
  ONE_HOUR: 3600,
  SIX_HOURS: 6 * 3600,
  TWELVE_HOURS: 12 * 3600,
  ONE_DAY: 24 * 3600,
  TWO_DAYS: 48 * 3600,
  SEVEN_DAYS: 7 * 24 * 3600,
  THIRTY_DAYS: 30 * 24 * 3600,
  PERMANENT: Number.MAX_SAFE_INTEGER
} as const;
