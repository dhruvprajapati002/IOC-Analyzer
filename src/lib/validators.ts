import { z } from 'zod';

// IOC Types
export type IOCType = 'ip' | 'domain' | 'url' | 'hash';
export type Verdict = 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown' | 'pending';

// Request Schemas
export const SubmitIOCRequestSchema = z.object({
  iocs: z.array(z.string().trim().min(1)).min(1).max(1000),
  label: z.string().optional(),
});

export type SubmitIOCRequest = z.infer<typeof SubmitIOCRequestSchema>;

// 🔥 NEW: Detection Schema
export const DetectionSchema = z.object({
  engine: z.string(),
  category: z.string(),
  result: z.string(),
  method: z.string().optional(),
});

export type Detection = z.infer<typeof DetectionSchema>;

// VirusTotal Response Normalization
export const VTNormalizedSchema = z.object({
  verdict: z.enum(['malicious', 'suspicious', 'harmless', 'undetected', 'unknown', 'pending']),
  stats: z.object({
    malicious: z.number().default(0),
    suspicious: z.number().default(0),
    harmless: z.number().default(0),
    undetected: z.number().default(0),
    timeout: z.number().optional(),
  }),
  reputation: z.number().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  last_analysis_date: z.string().optional(),
  providers: z.array(z.object({
    engine: z.string(),
    category: z.string(),
    result: z.string().optional(),
    method: z.string().optional(),
  })).optional(),
  // 🔥 NEW: Threat intelligence fields
  threatTypes: z.array(z.string()).optional(),
  detections: z.array(DetectionSchema).optional(),
});

export type VTNormalized = z.infer<typeof VTNormalizedSchema>;

// 🔥 NEW: Threat Intelligence Schema
export const ThreatIntelSchema = z.object({
  threatTypes: z.array(z.string()).default([]),
  detections: z.array(DetectionSchema).default([]),
  malwareFamily: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'unknown']).optional(),
  firstSeen: z.date().optional(),
  lastSeen: z.date().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type ThreatIntel = z.infer<typeof ThreatIntelSchema>;

// IOC Record Schema (for MongoDB)
export const IOCRecordSchema = z.object({
  _id: z.string(),
  ioc: z.string(),
  type: z.enum(['ip', 'domain', 'url', 'hash']),
  label: z.string().optional(),
  vt: z.object({
    raw: z.record(z.any()),
    normalized: VTNormalizedSchema,
  }),
  // 🔥 NEW: Threat intelligence field
  threat_intel: ThreatIntelSchema.optional(),
  // 🔥 NEW: Reputation data
  reputation_data: z.object({
    sources: z.array(z.string()).default([]),
    abuseipdb: z.any().optional(),
    greynoise: z.any().optional(),
    ipqs: z.any().optional(),
  }).optional(),
  fetchedAt: z.date(),
  updatedAt: z.date(),
  cacheTtlSec: z.number(),
  meta: z.object({
    createdBy: z.string().optional(),
    caseId: z.string().optional(),
  }).optional(),
});

export type IOCRecord = z.infer<typeof IOCRecordSchema>;

// 🔥 NEW: Enhanced API Response with Threat Intelligence
export const SubmitIOCResponseSchema = z.object({
  success: z.boolean(),
  total: z.number(),
  analyzed: z.number(),
  results: z.array(z.object({
    ioc: z.string(),
    type: z.enum(['ip', 'domain', 'url', 'hash']),
    verdict: z.enum(['malicious', 'suspicious', 'harmless', 'undetected', 'unknown', 'error']),
    stats: z.object({
      malicious: z.number().default(0),
      suspicious: z.number().default(0),
      harmless: z.number().default(0),
      undetected: z.number().default(0),
    }).optional(),
    // 🔥 NEW: Include threat intelligence in response
    threatIntel: z.object({
      threatTypes: z.array(z.string()).default([]),
      detections: z.array(DetectionSchema).default([]),
      severity: z.enum(['critical', 'high', 'medium', 'low', 'unknown']).optional(),
    }).optional(),
    fetchedAt: z.date().optional(),
    cached: z.boolean().optional(),
    error: z.string().optional(),
  })),
  timestamp: z.string(),
});

export type SubmitIOCResponse = z.infer<typeof SubmitIOCResponseSchema>;

// Query Schemas
export const IOCQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['ip', 'domain', 'url', 'hash']).optional(),
  verdict: z.enum(['malicious', 'suspicious', 'harmless', 'undetected', 'unknown']).optional(),
  label: z.string().optional(),
  // 🔥 NEW: Filter by threat type
  threatType: z.string().optional(),
  // 🔥 NEW: Filter by severity
  severity: z.enum(['critical', 'high', 'medium', 'low', 'unknown']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(50),
  export: z.enum(['csv', 'json']).optional(),
});

export type IOCQuery = z.infer<typeof IOCQuerySchema>;

// 🔥 NEW: Helper function to detect IOC type
export function detectIOCType(ioc: string): IOCType {
  const trimmed = ioc.trim().toLowerCase();
  
  // Hash detection (MD5: 32, SHA1: 40, SHA256: 64)
  if (/^[a-f0-9]{32}$/.test(trimmed)) return 'hash';
  if (/^[a-f0-9]{40}$/.test(trimmed)) return 'hash';
  if (/^[a-f0-9]{64}$/.test(trimmed)) return 'hash';
  
  // URL detection
  if (/^https?:\/\//.test(trimmed)) return 'url';
  
  // IP detection (IPv4)
  if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(trimmed)) {
    return 'ip';
  }
  
  // Domain detection (default)
  return 'domain';
}

// 🔥 NEW: Validate IOC format
export function validateIOC(ioc: string, type?: IOCType): { valid: boolean; error?: string } {
  const trimmed = ioc.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'IOC cannot be empty' };
  }
  
  const detectedType = type || detectIOCType(trimmed);
  
  switch (detectedType) {
    case 'ip':
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(trimmed)) {
        return { valid: false, error: 'Invalid IP address format' };
      }
      break;
      
    case 'domain':
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!domainRegex.test(trimmed)) {
        return { valid: false, error: 'Invalid domain format' };
      }
      break;
      
    case 'url':
      try {
        new URL(trimmed);
      } catch {
        return { valid: false, error: 'Invalid URL format' };
      }
      break;
      
    case 'hash':
      const hashRegex = /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/;
      if (!hashRegex.test(trimmed.toLowerCase())) {
        return { valid: false, error: 'Invalid hash format (must be MD5, SHA1, or SHA256)' };
      }
      break;
  }
  
  return { valid: true };
}

// 🔥 NEW: Get verdict severity score (for sorting)
export function getVerdictScore(verdict: Verdict): number {
  const scores: Record<Verdict, number> = {
    'malicious': 5,
    'suspicious': 4,
    'unknown': 3,
    'pending': 2,
    'undetected': 1,
    'harmless': 0,
  };
  return scores[verdict] || 0;
}

// 🔥 NEW: Get threat severity score (for sorting)
export function getSeverityScore(severity?: string): number {
  const scores: Record<string, number> = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
    'unknown': 0,
  };
  return scores[severity || 'unknown'] || 0;
}
