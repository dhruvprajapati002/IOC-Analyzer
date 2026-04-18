// types.ts

export interface IOCStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}

// ✅ Updated IOCRecord - list view
export interface IOCRecord {
  id: string;
  ioc: string;
  type: string;
  verdict: string;
  stats: IOCStats;
  searchedAt: string; // ✅ Changed from fetchedAt
  threatTypes: string[];
  severity: string;
  popularThreatLabel: string | null;
  familyLabels: string[];
  label: string | null;
  source: string; // ✅ Required now: 'ip_search', 'domain_search', 'url_search', 'hash_search', 'file_analysis'
  metadata?: { // ✅ Optional file metadata
    filename?: string;
    filesize?: number;
    filetype?: string;
    riskScore?: number;
    riskLevel?: string;
  } | null;
  // ❌ REMOVED: isPublic, sharedAt, username, isOwner, fetchedAt
}

export interface HistoryStats {
  total: number;
  byVerdict: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
  };
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean; // ✅ Added
  hasPrevPage: boolean; // ✅ Added
  limit: number; // ✅ Added
}

// ✅ Full IOC details for detail panel
export interface IOCDetails {
  id: string;
  ioc: string;
  type: string;
  verdict: string;
  label: string | null;
  stats: IOCStats;
  reputation: number;
  riskScore: number | null;
  riskLevel: string | null;
  
  threatIntel: {
    threatTypes: string[];
    severity: string;
    confidence: number;
    firstSeen: string | null;
    lastSeen: string | null;
    popularThreatLabel: string | null;
    familyLabels: string[];
    threatCategories: string[];
    suggestedThreatLabel: string | null;
  };
  
  detections: Array<{
    engine: string;
    category: string;
    result: string;
    method: string | null;
  }>;
  
  // Type-specific data
  fileInfo: {
    name: string;
    size: number;
    type: string;
    md5: string;
    sha1: string;
    sha256: string;
    firstSeen: string;
    lastAnalysis: string;
    uploadDate: string;
  } | null;
  
  sandboxAnalysis: any | null;
  codeInsights: any | null;
  mitreAttack: any | null;
  
  abuseIPDB: {
    abuseConfidenceScore: number;
    usageType: string;
    isp: string;
    isWhitelisted: boolean;
    totalReports: number;
  } | null;
  
  geolocation: {
    countryCode: string | null;
    countryName: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
    timezone: string | null;
    isp: string;
    org: string | null;
    asn: string;
    asnName: string | null;
  } | null;
  
  whois: any | null;
  
  shodan: {
    country: string;
    org: string;
    isp: string;
    asn: string | null;
    ports: number[];
    vulns: string[];
    tags: string[];
  } | null;
  
  metadata: {
    searchedAt: string; // ✅ Changed from fetchedAt
    createdAt: string;
    updatedAt: string;
    lastAnalysisDate: string | null;
    username: string;
    cacheTtl: number;
    userNotes: string | null;
    userVerdict: string | null;
    source: string; // ✅ Added source
    filename: string | null;
    filesize: number | null;
    filetype: string | null;
    entropy: number | null;
    isPacked: boolean | null;
  };
}

// ✅ API Response types
export interface HistoryResponse {
  success: boolean;
  data: {
    records: IOCRecord[];
    pagination: Pagination;
  };
}

export interface IOCDetailsResponse {
  success: boolean;
  data: IOCDetails;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}
