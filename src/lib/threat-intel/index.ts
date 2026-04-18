/**
 * Threat Intelligence Module - Centralized Exports
 * All threat intelligence services, orchestration, and utilities
 */

// Main Services
export { analyzeIOC, analyzeIOCBatch } from './services/ioc-analyzer.service';
export { 
  calculateIPRiskScore, 
  calculateNonIPSeverity,
  getRiskLevelDetails 
} from './services/risk-scoring.service';
export { 
  getGeolocationData, 
  checkAbuseIPDB 
} from './services/ip-reputation.service';
export {
  extractFileInfo,
  extractDetections,
  extractFamilyLabels,
  determinePopularThreat,
  parseMitreAttack,
  generateSandboxData
} from './services/vt-extractor.service';

// Orchestrator
export { 
  MultiSourceOrchestrator,
  formatIOCResponse,
  createErrorResult 
} from './orchestrator/multi-source.orchestrator';

// Clients
export { VirusTotalClient } from './clients/vt.client';
export { GreyNoiseClient } from './clients/greynoise.client';
export { IPQSClient } from './clients/ipqs.client';
export { ThreatFoxClient } from './clients/threatfox.client';
export { MalwareBazaarClient } from './clients/malwarebazaar.client';
export { URLhausClient } from './clients/urlhaus.client';

// Normalizers
export { VTNormalizer } from './normalizers/vt.normalizer';
export { GreyNoiseNormalizer } from './normalizers/greynoise.normalizer';
export { IPQSNormalizer } from './normalizers/ipqs.normalizer';
export { ThreatFoxNormalizer } from './normalizers/threatfox.normalizer';
export { MalwareBazaarNormalizer } from './normalizers/malwarebazaar.normalizer';
export { URLhausNormalizer } from './normalizers/urlhaus.normalizer';

// Types
export type {
  IOCType,
  Verdict,
  Severity,
  RiskLevel,
  ClientResult,
  UnifiedThreatData,
  EnrichedIOC,
  IOCAnalysisResult,
  GeolocationData,
  AbuseIPDBData,
  RiskDetails,
  ThreatInfo,
  NetworkAnalysis,
  ThreatIntelligence,
  Detection,
  MitreTactic,
  MitreTechnique,
  MitreAttackData,
  FileInfo,
  SandboxAnalysis
} from './types/threat-intel.types';
