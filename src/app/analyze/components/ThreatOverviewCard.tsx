'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ShieldCheck, AlertCircle } from 'lucide-react';
import { CinematicPieChart } from './CinematicPieChart';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { 
  APP_COLORS, 
  CARD_STYLES, 
  STATUS_BADGE, 
  LOADING_STYLES,
  RISK_COLORS
} from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography'; // ✅ Import typography

interface ThreatOverviewCardProps {
  threatOverview: {
    query: string;
    timestamp: Date;
    totalAnalyzed: number;
    malicious: number;
    suspicious: number;
    clean: number;
    riskScore?: number;
    riskLevel?: 'critical' | 'high' | 'medium' | 'low';
  } | null;
  overviewLoading: boolean;
  pieChartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function ThreatOverviewCard({
  threatOverview,
  overviewLoading,
  pieChartData,
}: ThreatOverviewCardProps) {
  const getThreatLevel = () => {
    if (!threatOverview || threatOverview.totalAnalyzed === 0) return null;

    // 1) Prefer backend riskLevel mapping to RISK_COLORS
    if (threatOverview.riskLevel) {
      const level = threatOverview.riskLevel;
      if (level === 'critical') return RISK_COLORS.critical;
      if (level === 'high') return RISK_COLORS.high;
      if (level === 'medium') return RISK_COLORS.medium;
      return RISK_COLORS.low;
    }

    // 2) Next, prefer backend riskScore
    if (typeof threatOverview.riskScore === 'number') {
      const score = threatOverview.riskScore;
      if (score >= 75) return RISK_COLORS.critical;
      if (score >= 50) return RISK_COLORS.high;
      if (score >= 25) return RISK_COLORS.medium;
      return RISK_COLORS.low;
    }

    // 3) Fallback: percentage-based logic
    const threatPercent =
      ((threatOverview.malicious + threatOverview.suspicious) /
        threatOverview.totalAnalyzed) *
      100;

    if (threatPercent > 70) return RISK_COLORS.critical;
    if (threatPercent > 40) return RISK_COLORS.high;
    if (threatPercent > 20) return RISK_COLORS.medium;
    return RISK_COLORS.low;
  };

  const threatLevel = getThreatLevel();

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft, // ✅ Clean solid background
        borderColor: APP_COLORS.border,
      }}
    >
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          {/* LEFT: Icon + Title + Threat Level */}
          <div className="flex items-center space-x-3">
            <div
              className="p-3 rounded-xl border"
              style={{
                backgroundColor: `${APP_COLORS.primary}10`,
                borderColor: `${APP_COLORS.primary}40`,
              }}
            >
              <BarChart3
                className="h-5 w-5"
                style={{ color: APP_COLORS.primary }}
              />
            </div>
            <div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Threat Detection Overview
              </CardTitle>

              {threatLevel && (
                <div
                  className="flex items-center space-x-2 px-2.5 py-1 rounded-lg mt-2 inline-flex"
                  style={{
                    backgroundColor: threatLevel.bg,
                    border: `1px solid ${threatLevel.border}`,
                  }}
                >
                  <AlertCircle
                    className="h-3.5 w-3.5"
                    style={{ color: threatLevel.primary }}
                  />
                  <span
                    className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wider`}
                    style={{ color: threatLevel.primary }}
                  >
                    {threatLevel.level}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: IOC Query + Date */}
          {threatOverview && (
            <div className="flex flex-col items-end space-y-1 text-right shrink-0">
              <div
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium} ${TYPOGRAPHY.fontFamily.mono} truncate max-w-[220px]`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                {threatOverview.query}
              </div>
              <div
                className={`flex items-center gap-1.5 ${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                <ShieldCheck
                  className="h-3.5 w-3.5"
                  style={{ color: APP_COLORS.primary }}
                />
                <span>
                  {new Date(threatOverview.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Loading state in header */}
        {overviewLoading && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg mt-4 border"
            style={{
              backgroundColor: APP_COLORS.surfaceSoft,
              borderColor: APP_COLORS.border,
            }}
          >
            <div
              className={LOADING_STYLES.spinner}
              style={{
                borderTopColor: APP_COLORS.primary,
                borderColor: `${APP_COLORS.surfaceSoft}cc`,
              }}
            />
            <span
              className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              Analyzing cyber intelligence...
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {overviewLoading ? (
          <ChartSkeleton height="h-80" />
        ) : pieChartData.length > 0 ? (
          <CinematicPieChart data={pieChartData} />
        ) : (
          <div
            className="h-80 flex flex-col items-center justify-center space-y-6 p-8 rounded-xl border"
            style={{
              backgroundColor: APP_COLORS.surfaceSoft,
              borderColor: APP_COLORS.border,
            }}
          >
            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: APP_COLORS.backgroundSoft,
                borderColor: APP_COLORS.border,
              }}
            >
              <BarChart3
                className="h-12 w-12 mx-auto"
                style={{ color: APP_COLORS.textSecondary }}
              />
            </div>
            <div className="text-center space-y-3 max-w-md">
              <h3
                className={`${TYPOGRAPHY.heading.h4} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                No threat data available
              </h3>
              
            </div>
            <div
              className={LOADING_STYLES.dots}
              style={{ gap: '0.5rem' }}
            >
              <div
                className={LOADING_STYLES.dot}
                style={{ backgroundColor: APP_COLORS.textMuted }}
              />
              <div
                className={LOADING_STYLES.dot}
                style={{
                  backgroundColor: APP_COLORS.textMuted,
                  animationDelay: '150ms',
                }}
              />
              <div
                className={LOADING_STYLES.dot}
                style={{
                  backgroundColor: APP_COLORS.textMuted,
                  animationDelay: '300ms',
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
