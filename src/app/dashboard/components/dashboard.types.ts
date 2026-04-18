export type TimeRange = 'daily' | 'weekly' | 'monthly';

export interface DashboardStats {
  totalIOCs: number;
  maliciousIOCs: number;
  cleanIOCs: number;
  suspiciousIOCs: number;
  pendingIOCs: number;
  detectionRate: string | number;
  trends: {
    totalIOCs: number;
    threatsDetected: number;
  };
}

export interface DailyTrendPoint {
  day: string;
  dateLabel: string;
  displayDate: string;
  threats: number;
  suspicious?: number;
  clean: number;
  total: number;
}

export interface ThreatTypeItem {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IocTypeDistributionItem {
  type: string;
  rawType?: string;
  count: number;
  percentage?: number;
  color: string;
  icon?: string;
}

export interface ThreatSeverityItem {
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
}

export interface ThreatIntelligenceSummary {
  bySeverity: ThreatSeverityItem[];
  totalCritical: number;
  totalHigh: number;
  totalMedium: number;
  totalLow: number;
}

export interface GeoDistributionItem {
  country: string;
  countryName: string;
  count: number;
  maliciousCount: number;
  suspiciousCount: number;
  harmlessCount: number;
  undetectedCount: number;
  threatCount: number;
  threatPercentage: number;
  verdictBreakdown: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
  };
}

export interface ThreatVectorItem {
  name: string;
  count: number;
  severity: 'high' | 'low' | string;
  detectionRate: number;
  riskLevel: string;
  color: string;
  description: string;
  percentage: number;
}

export interface FileAnalysisSummary {
  totalFiles: number;
  avgFileSize: number;
  maliciousFiles: number;
  cleanFiles: number;
  detectionRate: number;
  topFileTypes: Array<{
    type: string;
    count: number;
  }>;
}

export interface MalwareFamilyItem {
  name: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
}

export interface DetectionEngineItem {
  engine: string;
  totalDetections: number;
  maliciousDetections: number;
  detectionRate: number;
}

export interface ThreatFeedItem {
  ioc: string;
  type: string;
  verdict: string;
  source: string;
  timestamp: string;
}

export interface DashboardPayload {
  stats: DashboardStats;
  dailyTrends: DailyTrendPoint[];
  threatTypes: ThreatTypeItem[];
  iocTypeDistribution: IocTypeDistributionItem[];
  threatIntelligence: ThreatIntelligenceSummary;
  geoDistribution: GeoDistributionItem[];
  threatVectors: ThreatVectorItem[];
  fileAnalysis: FileAnalysisSummary;
  malwareFamilies: MalwareFamilyItem[];
  detectionEngines: DetectionEngineItem[];
  threatFeed: ThreatFeedItem[];
  timeRange: TimeRange;
  daysIncluded: number;
  startDate: string;
  endDate: string;
  cachedAt: string;
  dataVersion: string;
  privacyMode: string;
}
