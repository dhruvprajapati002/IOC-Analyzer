export interface HistoryRecord {
  id: string;
  ioc: string;
  type: string;
  verdict: string;
  severity: string;
  riskScore: number | null;
  riskLevel: string | null;
  stats: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
  };
  threatTypes: string[];
  familyLabels: string[];
  popularThreatLabel: string | null;
  confidence: number | null;
  label: string | null;
  source: string | null;
  searchedAt: string;
  metadata: {
    filename?: string;
    filesize?: number;
    filetype?: string;
    riskScore?: number;
    riskLevel?: string;
  };
  hasData: Record<string, boolean>;
  sources_available: string[];
}

function normalizeVerdict(verdict: string | null | undefined): string {
  const value = String(verdict ?? 'unknown').toLowerCase().trim();
  if (value === 'clean') return 'harmless';
  if (!value) return 'unknown';
  return value;
}

function normalizeType(type: string | null | undefined): string {
  return String(type ?? 'unknown').toLowerCase().trim() || 'unknown';
}

function safeStats(stats: any) {
  return {
    malicious: Number(stats?.malicious ?? 0) || 0,
    suspicious: Number(stats?.suspicious ?? 0) || 0,
    harmless: Number(stats?.harmless ?? 0) || 0,
    undetected: Number(stats?.undetected ?? 0) || 0,
  };
}

export function mapAPIRecordToViewModel(record: any): HistoryRecord {
  const stats = safeStats(record?.stats);
  const metadata = record?.metadata && typeof record.metadata === 'object' ? record.metadata : {};
  const sourcesAvailable = Array.isArray(record?.sources_available) ? record.sources_available : [];
  const hasData = record?.hasData && typeof record.hasData === 'object'
    ? record.hasData
    : {
        virustotal: sourcesAvailable.includes('virustotal'),
        greynoise: sourcesAvailable.includes('greynoise'),
        ipqs: sourcesAvailable.includes('ipqs'),
        threatfox: sourcesAvailable.includes('threatfox'),
        malwarebazaar: sourcesAvailable.includes('malwarebazaar'),
        urlhaus: sourcesAvailable.includes('urlhaus'),
      };

  const riskScoreRaw = record?.riskScore ?? metadata?.riskScore;
  const riskLevelRaw = record?.riskLevel ?? metadata?.riskLevel;
  const confidenceRaw = record?.confidence ?? record?.threatIntel?.confidence ?? null;

  return {
    id: String(record?.id ?? record?._id ?? `${record?.ioc ?? 'unknown'}-${record?.type ?? 'unknown'}`),
    ioc: String(record?.ioc ?? ''),
    type: normalizeType(record?.type),
    verdict: normalizeVerdict(record?.verdict),
    severity: String(record?.severity ?? 'unknown').toLowerCase(),
    riskScore: Number.isFinite(Number(riskScoreRaw)) ? Number(riskScoreRaw) : null,
    riskLevel: riskLevelRaw ? String(riskLevelRaw).toLowerCase() : null,
    stats,
    threatTypes: Array.isArray(record?.threatTypes) ? record.threatTypes : [],
    familyLabels: Array.isArray(record?.familyLabels) ? record.familyLabels : [],
    popularThreatLabel: record?.popularThreatLabel ? String(record.popularThreatLabel) : null,
    confidence: Number.isFinite(Number(confidenceRaw)) ? Number(confidenceRaw) : null,
    label: record?.label ? String(record.label) : null,
    source: record?.source ? String(record.source) : null,
    searchedAt: String(record?.searchedAt ?? record?.searched_at ?? ''),
    metadata: {
      filename: metadata?.filename,
      filesize: Number.isFinite(Number(metadata?.filesize)) ? Number(metadata.filesize) : undefined,
      filetype: metadata?.filetype,
      riskScore: Number.isFinite(Number(metadata?.riskScore)) ? Number(metadata.riskScore) : undefined,
      riskLevel: metadata?.riskLevel,
    },
    hasData,
    sources_available: sourcesAvailable,
  };
}
