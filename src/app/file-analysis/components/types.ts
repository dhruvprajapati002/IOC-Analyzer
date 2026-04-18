// components/FileAnalysis/types.ts

// ============================================================================
// API RESPONSE WRAPPER
// ============================================================================

export interface FileAnalysisAPIResponse {
  success: boolean;
  results: FileAnalysisResult[];
  requestId: string;
  timestamp: string;
  analysisTimeMs: number;
}

// ============================================================================
// NESTED TYPES
// ============================================================================

export interface VTStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  extension: string;
  md5: string;
  sha1: string;
  sha256: string;
  firstSeen: string;
  lastAnalysis: string;
  uploadDate: string;
  entropy: number;
  isPacked: boolean;
}

export interface FileHashes {
  md5: string;
  sha1: string;
  sha256: string;
}

export interface Detection {
  engine: string;
  category: string;
  result: string;
}

export interface ThreatType {
  type: string;
  severity: string;
  description: string;
  confidence: number;
}

// ============================================================================
// MITRE ATT&CK
// ============================================================================

export interface MitreTactic {
  id: string;
  name: string;
  description?: string;
  link?: string;
  techniques?: MitreTechnique[];
}

export interface MitreTechnique {
  id: string;
  name: string;
  description?: string;
  link?: string;
  signatures?: MitreSignature[];
}

export interface MitreSignature {
  severity: string;
  description: string;
  match_data?: string[];
}

export interface MitreAttackData {
  tactics?: MitreTactic[];
  techniques?: MitreTechnique[];
}

// Nested structure from API (by sandbox name)
export interface MitreAttackNested {
  [sandboxName: string]: {
    tactics: MitreTactic[];
  };
}

// ============================================================================
// CODE INSIGHTS
// ============================================================================

export interface CodeInsights {
  verdict?: string;
  tags?: string[];
  capabilities?: string[];
  analysis?: string;
}

// ============================================================================
// YARA ANALYSIS
// ============================================================================

export interface YaraPatternMatch {
  pattern: string;
  weight: number;
  description: string;
  count: number;
}

export interface YaraRuleMatch {
  ruleName: string;
  description: string;
  risk: string;
  score: number;
  matches: YaraPatternMatch[];
}

export interface YaraAnalysis {
  totalMatches: number;
  rules: YaraRuleMatch[];
  totalScore: number;
}

// ============================================================================
// IP REPUTATION (Optional - only if file contains IPs)
// ============================================================================

export interface IPReputationEntry {
  ip: string;
  verdict: string;
  confidence: number;
  reason: string;
  details?: {
    source?: string;
  };
}

export interface IPReputation {
  totalIps: number;
  maliciousIps: number;
  suspiciousIps: number;
  ips: IPReputationEntry[];
}

// ============================================================================
// THREAT PATTERNS
// ============================================================================

export interface ThreatPattern {
  type: string;
  description: string;
  risk: string;
  count: number;
  samples: string[];
}

// ============================================================================
// ADVANCED METADATA
// ============================================================================

export interface AdvancedMetadata {
  fileStructure: {
    type?: string;
  };
  executionInfo: {
    isExecutable?: boolean;
    platform?: string;
    containsScript?: boolean;
    scriptType?: string;
  };
  documentProperties: {
    isOfficeDoc?: boolean;
  };
}

// ============================================================================
// VT DATA
// ============================================================================

export interface VTNormalized {
  verdict: string;
  stats: VTStats;
  reputation: number;
  last_analysis_date: string;
  threatTypes: string[];
}

export interface VTData {
  // Basic VT data
  popular_threat_label?: string | null;
  threat_categories?: string[];
  suggested_threat_label?: string | null;
  family_labels?: string[];
  stats?: VTStats;
  reputation?: number | null;
  
  // File-specific VT data
  trid?: any;
  elf_info?: any;
  detectiteasy?: any;
  type_tag?: string;
  type_description?: string;
  meaningful_name?: string;
  names?: string[];
  size?: number;
  first_submission_date?: number;
  last_submission_date?: number;
  
  // Analysis data
  last_analysis_stats?: {
    malicious?: number;
    suspicious?: number;
    undetected?: number;
    harmless?: number;
    timeout?: number;
    'confirmed-timeout'?: number;
    failure?: number;
    'type-unsupported'?: number;
  };
  sandbox_verdicts?: Record<string, {
    category: string;
    sandbox_name: string;
    confidence?: number;
    malware_classification?: string[];
    malware_names?: string[];
  }>;
  last_analysis_results?: Record<string, {
    category: string;
    engine_name: string;
    result: string | null;
    method: string;
  }>;
  
  // Legacy
  normalized?: any;
  vtAnalysisId?: string;
  sandboxAnalysis?: any;
  raw?: any;
}

// ============================================================================
// VT INTELLIGENCE
// ============================================================================

export interface VTIntelligence {
  popular_threat_label: string | null;
  threat_categories: string[];
  family_labels: string[];
  mitre_attack: MitreAttackNested | null;
  code_insights: CodeInsights | null;
}

// ============================================================================
// THREAT INTEL (Simplified - no duplicates)
// ============================================================================

export interface ThreatIntel {
  threatTypes: string[];
  detections: Detection[];
  severity: string;
  confidence: number;
}

// ============================================================================
// OTHER TYPES
// ============================================================================

export interface ThreatOverview {
  malicious: number;
  suspicious: number;
  clean: number;
  totalAnalyzed: number;
}

export interface EngineStats {
  total: number;
  detected: number;
}

export interface FileMetadata {
  entropy: number;
  strings: number;
  imports: number;
  sections: number;
}

// ============================================================================
// MAIN FILE ANALYSIS RESULT (Cleaned - No Duplicates)
// ============================================================================

export interface FileAnalysisResult {
  // ✅ Basic Info
  ioc: string;
  type: 'hash' | 'file';
  verdict: 'harmless' | 'suspicious' | 'malicious' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  cached: boolean;
  timestamp: string;

  // ✅ Stats (ONLY at root level)
  stats: VTStats;

  // ✅ File Info (ONLY at root level)
  fileInfo: FileInfo;

  // ✅ Hashes (convenient access)
  hashes: FileHashes;

  // ✅ VT Data (cleaned - no duplicates)
  vtData: VTData;

  // ✅ VT Intelligence (ONLY place for MITRE, code insights, labels)
  vtIntelligence: VTIntelligence;

  // ✅ Threat Intelligence (ONLY threatTypes and detections)
  threatIntel: ThreatIntel;

  // ✅ Additional Data
  threats: ThreatType[];
  vendorConfidence: number;
  engines: EngineStats;
  metadata: FileMetadata;
  threatOverview: ThreatOverview;

  // ✅ Optional Fields (only included if data exists)
  yaraAnalysis?: YaraAnalysis;
  patterns?: ThreatPattern[];
  indicators?: string[];

  // ✅ Multi-Source Intelligence (NEW)
  threatfoxData?: {
    available: boolean;
    verdict: string;
    score: number;
    threat_type?: string;
    malware_families?: string[];
    confidence_level?: number;
    first_seen?: string;
    tags?: string[];
  };
  malwarebazaarData?: {
    available: boolean;
    verdict: string;
    score: number;
    signature?: string;
    file_type?: string;
    file_name?: string;
    file_size?: number;
    first_seen?: string;
    tags?: string[];
    malware_families?: string[];
  };

  // ✅ Legacy/Optional Fields
  vtAnalysisId?: string | null;
  analysisTime?: string;
  analysisTimeMs?: number;
}
