'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Database, RefreshCw } from 'lucide-react';
import { TYPOGRAPHY } from '@/lib/typography';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import type { DashboardStats, TimeRange } from './dashboard.types';
import { APP_COLORS } from '@/lib/colors';

interface DashboardHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  stats: DashboardStats | null;
  loading: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRetry: () => void;
  lastUpdated: Date | null;
}

function formatDelta(delta: number): string {
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta.toFixed(1)}%`;
}

function metricColorClass(label: string): string {
  if (label === 'Malicious') return 'text-t-danger';
  if (label === 'Suspicious') return 'text-t-warning';
  if (label === 'Clean') return 'text-t-success';
  if (label === 'Detection Rate') return 'text-t-primary';
  return 'text-t-textPrimary';
}

export function DashboardHeader({
  timeRange,
  onTimeRangeChange,
  stats,
  loading,
  refreshing = false,
  error,
  onRetry,
  lastUpdated,
}: DashboardHeaderProps) {
  const [now, setNow] = useState(() => new Date());
  const isBusy = loading || refreshing;
  const clockLabel = useMemo(
    () => now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    [now]
  );
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const detectionRate = Number(stats?.detectionRate ?? 0);
  const safeRate = Math.max(0, Math.min(100, detectionRate));
  const ringRadius = 16;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (safeRate / 100) * ringCircumference;
  const refreshLabel = error ? 'Retry' : isBusy ? 'Refreshing' : 'Refresh';

  const metricCards = [
    { label: 'Total IOCs', value: (stats?.totalIOCs ?? 0).toLocaleString() },
    { label: 'Malicious', value: (stats?.maliciousIOCs ?? 0).toLocaleString() },
    { label: 'Suspicious', value: (stats?.suspiciousIOCs ?? 0).toLocaleString() },
    { label: 'Clean', value: (stats?.cleanIOCs ?? 0).toLocaleString() },
    { label: 'Pending', value: (stats?.pendingIOCs ?? 0).toLocaleString() },
    { label: 'Detection Rate', value: `${safeRate.toFixed(1)}%` },
  ];

  return (
    <div className="mb-6 border-b  pt-6 pb-5"
    style={{
      backgroundColor: APP_COLORS.background,
    }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className={`${TYPOGRAPHY.heading.h3} text-2xl font-extrabold text-t-textPrimary`}>
            Threat Intelligence Dashboard
          </h1>
          <p className="text-sm text-t-textMuted">
            Real-time security monitoring built from MongoDB IOC history and cache intelligence.
          </p>
          <p className={`${TYPOGRAPHY.caption.sm} text-t-textMuted`}>
            {lastUpdated ? `Last updated at ${updatedLabel}` : 'Waiting for data...'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dad9d4] bg-white px-2.5 py-1 text-xs font-semibold text-t-textSecondary">
            <Clock className="h-3.5 w-3.5 text-t-primary" />
            <span className="tabular-nums text-t-textPrimary">{clockLabel}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dad9d4] bg-white px-2.5 py-1 text-xs font-semibold text-t-textSecondary">
            <span
              className={`h-2 w-2 rounded-full ${isBusy ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: isBusy ? APP_COLORS.warning : APP_COLORS.success }}
            />
            {isBusy ? 'Syncing' : 'Live'}
          </span>
          <TimeFilterDropdown value={timeRange} onChange={onTimeRangeChange} />
          <button
            type="button"
            onClick={onRetry}
            disabled={isBusy}
            aria-busy={isBusy}
            className="inline-flex items-center gap-2 rounded-md border border-[#dad9d4] bg-white px-3 py-2 text-xs font-semibold text-t-textSecondary shadow-sm transition hover:border-[#c96442]/40 hover:text-t-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
            {refreshLabel}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-t-danger bg-t-danger/10 px-3 py-2 text-t-danger">
          <p className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold}`}>Error: {error}</p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 bg-[#faf9f5] md:grid-cols-3 xl:grid-cols-7">
        {metricCards.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-[#dad9d4] bg-white p-4">
            <p className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>{metric.label}</p>
            <p className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${metricColorClass(metric.label)}`}>
              {metric.value}
            </p>
          </div>
        ))}

        <div className="rounded-2xl border border-[#dad9d4] bg-white p-4">
          <p className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>Health Ring</p>
          <div className="mt-2 flex items-center gap-3">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40" role="img" aria-label="Detection rate ring">
              <circle cx="20" cy="20" r={ringRadius} className="stroke-[#dad9d4]" strokeWidth="4" fill="none" />
              <circle
                cx="20"
                cy="20"
                r={ringRadius}
                className="stroke-t-primary"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold} text-t-textPrimary`}>
              {safeRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#dad9d4] px-2 py-1 text-xs text-t-textSecondary">
          <Database className="h-3.5 w-3.5" />
          IOC trend: {formatDelta(stats?.trends.totalIOCs ?? 0)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#dad9d4] px-2 py-1 text-xs text-t-textSecondary">
          <AlertTriangle className="h-3.5 w-3.5" />
          Threat trend: {formatDelta(stats?.trends.threatsDetected ?? 0)}
        </span>
      </div>
    </div>
  );
}
