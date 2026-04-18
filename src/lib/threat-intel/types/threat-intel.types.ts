// IOC types supported
export type IOCType = 'ip' | 'domain' | 'url' | 'hash';

// Verdict types
export type Verdict = 'malicious' | 'suspicious' | 'clean' | 'unknown' | 'whitelisted';

// Severity levels
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'clean' | 'unknown';

// Risk levels (for IPs)
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

// Client query result
export interface ClientResult {
  available: boolean;
  data?: any;
  error?: string;
  reason?: string;
  response_time_ms?: number;
}

// Normalized threat data from any source
export interface UnifiedThreatData {
  available: boolean;
  score: number;  // 0-100
  verdict: Verdict;
  confidence: number;  // 0-1.0
  source: string;
  malware_families?: string[];
  threat_types?: string[];
  details?: Record<string, any>;
  raw_data?: any;
}

// Final enriched IOC result
export interface EnrichedIOC {
  ioc_value: string;
  ioc_type: IOCType;
  
  // Overall assessment
  threat_score: number;
  verdict: Verdict;
  confidence: number;
  
  // Context
  malware_families: string[];
  threat_types: string[];
  first_seen?: string;
  last_seen?: string;
  
  // Source tracking
  sources_available: string[];
  sources_failed: string[];
  sources_data: Record<string, UnifiedThreatData>;
  
  // Metadata
  metadata: {
    service_level: 'full' | 'degraded' | 'minimal';
    data_completeness: number;  // 0-1.0
    response_time_ms: number;
    cached: boolean;
    vt_available: boolean;
    vt_contribution: number;  // 0-1.0
    free_sources_contribution: number;  // 0-1.0
  };
}

// Source configuration
export interface SourceConfig {
  name: string;
  displayName: string;
  enabled: boolean;
  weight: number;  // Contribution to final score (0-1.0)
  supports: IOCType[];
  quota?: {
    daily?: number;
    monthly?: number;
  };
  required: boolean;  // Platform must have this working
  priority: number;   // Lower = higher priority (1 = highest)
  apiKeyRequired: boolean;
}

// ============================================================================
// IP REPUTATION TYPES
// ============================================================================

/**
 * Geolocation data for IPs
 */
export interface GeolocationData {
  countryCode: string;
  countryName: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org: string;
  asn: string;
  asnName: string;
}

/**
 * AbuseIPDB data
 */
export interface AbuseIPDBData {
  abuseConfidenceScore: number;  // 0-100
  usageType: string;
  isWhitelisted: boolean;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
}

/**
 * Risk details for UI display
 */
export interface RiskDetails {
  level: string;
  color: string;
  badge: string;
  label: string;
  description: string;
  recommendation: string;
  action: string;
}

/**
 * Threat information
 */
export interface ThreatInfo {
  categories: string[];
  tags: string[];
  malwareFamilies: string[];
  lastAnalysisDate: string;
}

/**
 * Network analysis data
 */
export interface NetworkAnalysis {
  whois: {
    registrar: string;
    status: string;
  };
  dnsRecords: Array<{
    type: string;
    value: string;
    ttl: number;
  }>;
  openPorts: number[];
  services: string[];
}

/**
 * Threat intelligence data
 */
export interface ThreatIntelligence {
  blacklists: string[];
  feeds: string[];
  reports: number;
  firstSeen: string;
  lastSeen: string;
}

// ============================================================================
// DETECTION & ANALYSIS TYPES
// ============================================================================

/**
 * Detection from AV engine
 */
export interface Detection {
  engine: string;
  category: string;
  result: string;
  method?: string;
}

/**
 * MITRE ATT&CK Tactic
 */
export interface MitreTactic {
  id: string;
  name: string;
  description?: string;
  link: string;
}

/**
 * MITRE ATT&CK Technique
 */
export interface MitreTechnique {
  id: string;
  name: string;
  description?: string;
  link: string;
}

/**
 * MITRE ATT&CK data
 */
export interface MitreAttackData {
  tactics: MitreTactic[];
  techniques: MitreTechnique[];
}

/**
 * File information
 */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  md5: string;
  sha1: string;
  sha256: string;
  firstSeen: string;
  lastAnalysis: string;
  uploadDate: string;
}

/**
 * Sandbox analysis result
 */
export interface SandboxAnalysis {
  verdicts: Array<{
    sandbox: string;
    verdict: string;
    malware_classification: string[];
    confidence: number;
    sandbox_name: string;
  }>;
  summary: {
    malicious: number;
    suspicious: number;
    clean: number;
    total?: number;
  };
  status?: string;
  runtime?: string;
  environment?: string;
  behaviorAnalysis?: Record<string, any>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Complete IOC analysis result (for API responses)
 */
export interface IOCAnalysisResult {
  ioc: string;
  type: IOCType;
  verdict: Verdict;
  severity: Severity;
  
  // IP-specific fields
  riskScore?: number;
  riskLevel?: RiskLevel;
  riskDetails?: RiskDetails;
  
  // Statistics
  stats: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
  };
  
  // Threat intelligence
  threatIntel: {
    threatTypes: string[];
    detections: Detection[];
    severity: Severity;
    riskLevel?: RiskLevel;
    riskScore?: number;
    confidence: number;
  };
  
  // Source data
  vtData?: any;
  ipqsData?: any;
  malwarebazaarData?: any;
  threatfoxData?:any;
  urlhausData?: any;
  greynoiseData?: any;
  multiSourceData?: Record<string, any>;
  
  // Additional data
  fileInfo?: FileInfo;
  sandboxAnalysis?: SandboxAnalysis;
  mitreAttack?: MitreAttackData;
  reputation?: {
    geolocation: GeolocationData;
    abuseipdb: AbuseIPDBData;
    riskScore: number;
    riskLevel: RiskLevel;
  };
  
  // Metadata
  fetchedAt: string;
  cached: boolean;
  sources_available?: string[];
  sources_failed?: string[];
  error?: string;
}



/**
 * Result from orchestrator after querying all sources
 * This is the INTERNAL format before transformation to storage
 */
export interface ThreatIntelResult {
  ioc: string;
  type: IOCType;
  verdict: Verdict;
  severity: Severity;
  confidence: number;
  
  threatTypes: string[];
  detections: Detection[];
  
  sources: {
    virustotal?: {
      available: boolean;
      data?: any;
      response_time_ms?: number;
    };
    malwarebazaar?: {
      available: boolean;
      data?: any;
      response_time_ms?: number;
    };
    greynoise?: {
      available: boolean;
      data?: any;
      response_time_ms?: number;
    };
    ipqs?: {
      available: boolean;
      data?: any;
      response_time_ms?: number;
    };
  };
  
  sources_available: string[];
  sources_failed: string[];
  
  timestamp: Date;
  analysis_time_ms: number;
}
