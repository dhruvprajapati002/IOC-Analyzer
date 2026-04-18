export interface IOCDetailStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}

export interface IOCDetectionItem {
  engine: string;
  category: string;
  result: string;
  method?: string | null;
}

export interface IOCThreatIntel {
  threatTypes?: string[];
  severity?: string;
  confidence?: number;
  firstSeen?: string | null;
  lastSeen?: string | null;
  popularThreatLabel?: string | null;
  familyLabels?: string[];
  threatCategories?: string[];
  suggestedThreatLabel?: string | null;
}

export interface IOCDetailMetadata {
  searchedAt?: string;
  source?: string | null;
  filename?: string | null;
  filesize?: number | null;
  filetype?: string | null;
}

export interface IOCDetailData {
  id?: string;
  ioc: string;
  type: string;
  verdict?: string;
  label?: string | null;
  stats?: IOCDetailStats;
  reputation?: number;
  riskScore?: number | null;
  riskLevel?: string | null;
  threatIntel?: IOCThreatIntel;
  detections?: IOCDetectionItem[];
  fileInfo?: Record<string, any> | null;
  sandboxAnalysis?: Record<string, any> | null;
  mitreAttack?: Record<string, any> | null;
  abuseIPDB?: Record<string, any> | null;
  geolocation?: Record<string, any> | null;
  metadata?: IOCDetailMetadata;
  reputationData?: Record<string, any> | null;
  threatIntelData?: Record<string, any> | null;
}

export function toSafeStats(stats?: IOCDetailStats): IOCDetailStats {
  return {
    malicious: Number(stats?.malicious ?? 0) || 0,
    suspicious: Number(stats?.suspicious ?? 0) || 0,
    harmless: Number(stats?.harmless ?? 0) || 0,
    undetected: Number(stats?.undetected ?? 0) || 0,
  };
}
