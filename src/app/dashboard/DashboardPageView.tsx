'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ProtectedPage } from '@/components/ProtectedPage';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { getSystemToken } from '@/lib/system-user';

import { DashboardHeader } from './components/DashboardHeader';
import { ThreatTrendChart } from './components/ThreatTrendChart';
import { ThreatSeverityChart } from './components/ThreatSeverityChart';
import { IOCTypeDistributionChart } from './components/IOCTypeDistributionChartNew';
import { ThreatTypePieChart } from './components/ThreatTypePieChartModern';
import { GeographicDistributionChart } from './components/GeographicDistributionChartNew';
import { MalwareFamiliesChart } from './components/MalwareFamiliesChartNew';
import { TopThreatsGraph } from './components/TopThreatsGraph';
import { FileAnalysisGraph } from './components/FileAnalysisGraphCompact';
import { DetectionEnginePerformanceChart } from './components/DetectionEnginePerformanceChartNew';
import { RiskScoreTrend } from './components/RiskScoreTrend';
import { RealTimeThreatFeed } from './components/RealTimeThreatFeed';

import type {
  DashboardPayload,
  DashboardStats,
  DailyTrendPoint,
  DetectionEngineItem,
  FileAnalysisSummary,
  GeoDistributionItem,
  IocTypeDistributionItem,
  MalwareFamilyItem,
  ThreatFeedItem,
  ThreatIntelligenceSummary,
  ThreatTypeItem,
  ThreatVectorItem,
  TimeRange,
} from './components/dashboard.types';

const POLL_INTERVAL_MS = 2 * 60 * 1000;
const MAX_RETRIES = 3;

const EMPTY_PAYLOAD: DashboardPayload = {
  stats: {
    totalIOCs: 0,
    maliciousIOCs: 0,
    cleanIOCs: 0,
    suspiciousIOCs: 0,
    pendingIOCs: 0,
    detectionRate: 0,
    trends: {
      totalIOCs: 0,
      threatsDetected: 0,
    },
  },
  dailyTrends: [],
  threatTypes: [],
  iocTypeDistribution: [],
  threatIntelligence: {
    bySeverity: [],
    totalCritical: 0,
    totalHigh: 0,
    totalMedium: 0,
    totalLow: 0,
  },
  geoDistribution: [],
  threatVectors: [],
  fileAnalysis: {
    totalFiles: 0,
    avgFileSize: 0,
    maliciousFiles: 0,
    cleanFiles: 0,
    detectionRate: 0,
    topFileTypes: [],
  },
  malwareFamilies: [],
  detectionEngines: [],
  threatFeed: [],
  timeRange: 'weekly',
  daysIncluded: 0,
  startDate: '',
  endDate: '',
  cachedAt: '',
  dataVersion: '2.1-mongo',
  privacyMode: 'history-only',
};

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5" style={{ color: APP_COLORS.danger }} />
        <div className="space-y-2">
          <p className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} text-red-600`}>
            Failed to load dashboard data
          </p>
          <p className={`${TYPOGRAPHY.caption.sm} text-slate-600`}>
            {message}
          </p>
          <button type="button" onClick={onRetry} className="rounded-md border border-red-400 bg-white px-3 py-2 text-xs font-semibold text-red-600">
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPageView() {
  const { token } = useAuth();
  const [globalTimeRange, setGlobalTimeRange] = useState<TimeRange>('weekly');
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasData = useMemo(() => Boolean(payload), [payload]);
  const hasDataRef = useRef(false);

  useEffect(() => {
    hasDataRef.current = hasData;
  }, [hasData]);

  const fetchDashboardData = useCallback(async (foreground = false) => {
    const activeToken = token || getSystemToken();

    if (foreground || !hasDataRef.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await apiFetch(`/api/dashboard-v2?range=${globalTimeRange}`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorJson = (await response.json()) as { error?: string; message?: string };
          errorMessage = errorJson?.message || errorJson?.error || errorMessage;
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const result = (await response.json()) as DashboardPayload;
      setPayload(result);
      setLastUpdated(new Date());
      setError(null);
      setRetryCount(0);
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [globalTimeRange, token]);

  useEffect(() => {
    void fetchDashboardData(true);
  }, [fetchDashboardData]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchDashboardData(false);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!error || retryCount >= MAX_RETRIES) return;

    const delay = 2000 * Math.pow(2, retryCount);
    const timeout = window.setTimeout(() => {
      setRetryCount((prev) => prev + 1);
      void fetchDashboardData(false);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [error, retryCount, fetchDashboardData]);

  const safePayload = useMemo(() => payload ?? EMPTY_PAYLOAD, [payload]);

  const stats: DashboardStats | null = safePayload.stats;
  const dailyTrends: DailyTrendPoint[] = safePayload.dailyTrends;
  const threatTypes: ThreatTypeItem[] = safePayload.threatTypes;
  const iocTypeDistribution: IocTypeDistributionItem[] = safePayload.iocTypeDistribution;
  const threatIntelligence: ThreatIntelligenceSummary | null = safePayload.threatIntelligence;
  const geoDistribution: GeoDistributionItem[] = safePayload.geoDistribution;
  const threatVectors: ThreatVectorItem[] = safePayload.threatVectors;
  const fileAnalysis: FileAnalysisSummary | null = safePayload.fileAnalysis;
  const malwareFamilies: MalwareFamilyItem[] = safePayload.malwareFamilies;
  const detectionEngines: DetectionEngineItem[] = safePayload.detectionEngines;
  const threatFeed: ThreatFeedItem[] = safePayload.threatFeed;

  const isBusy = loading || refreshing;
  const isInitialLoading = loading && !hasData;
  const showCharts = hasData || isInitialLoading;

  const handleRetry = () => {
    setRetryCount(0);
    void fetchDashboardData(true);
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen w-full bg-[#faf9f5]">
        <div className="mx-auto max-w-screen-2xl bg-[#faf9f5] px-3 py-4 sm:px-4 lg:px-6">
          <DashboardHeader
            timeRange={globalTimeRange}
            onTimeRangeChange={setGlobalTimeRange}
            stats={stats}
            loading={isBusy}
            error={error}
            onRetry={handleRetry}
            lastUpdated={lastUpdated}
            refreshing={refreshing}
          />

          {!showCharts && error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

          {showCharts ? (
            <div className="space-y-6">
              {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

              <ThreatTrendChart data={dailyTrends} loading={isInitialLoading} />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <ThreatTypePieChart data={threatTypes} loading={isInitialLoading} />
                <IOCTypeDistributionChart data={iocTypeDistribution} loading={isInitialLoading} />
                <ThreatSeverityChart data={threatIntelligence} loading={isInitialLoading} />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <GeographicDistributionChart data={geoDistribution} loading={isInitialLoading} />
                <MalwareFamiliesChart data={malwareFamilies} loading={isInitialLoading} />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <TopThreatsGraph data={threatVectors} loading={isInitialLoading} />
                <FileAnalysisGraph data={fileAnalysis} loading={isInitialLoading} />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <RiskScoreTrend data={dailyTrends} loading={isInitialLoading} />
                <RealTimeThreatFeed items={threatFeed} loading={isInitialLoading} />
              </div>

              <DetectionEnginePerformanceChart data={detectionEngines} loading={isInitialLoading} />
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedPage>
  );
}
