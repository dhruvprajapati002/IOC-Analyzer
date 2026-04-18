'use client';

import { useMemo, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import {
  APP_COLORS,
  CHART_COLORS,
  RISK_COLORS,
  STATUS_BADGE,
  BUTTON_STYLES,
  INPUT_STYLES,
  SHADOWS,
  LOADING_STYLES,
} from '@/lib/colors';
import { CardShell } from '@/app/analyze/components/cards/CardShell';
import { CinematicPieChart } from '@/app/analyze/components/cards/CinematicPieChart';
import { formatDateTime } from '@/app/analyze/utils/analyzeFormatters';

interface ThreatOverviewCardProps {
  totalAnalyzed: number;
  maliciousDetections: number;
  suspiciousDetections: number;
  cleanDetections: number;
  undetectedDetections: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  timestamp: string;
}

function riskColor(level: ThreatOverviewCardProps['riskLevel']) {
  if (level === 'critical') return RISK_COLORS.critical.primary;
  if (level === 'high') return RISK_COLORS.high.primary;
  if (level === 'medium') return RISK_COLORS.medium.primary;
  if (level === 'low') return RISK_COLORS.low.primary;
  return APP_COLORS.textMuted;
}

export function ThreatOverviewCard({
  totalAnalyzed,
  maliciousDetections,
  suspiciousDetections,
  cleanDetections,
  undetectedDetections,
  riskLevel,
  timestamp,
}: ThreatOverviewCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(
    () => [
      {
        name: 'Malicious Detections',
        value: maliciousDetections,
        color: RISK_COLORS.critical.primary,
      },
      {
        name: 'Suspicious Detections',
        value: suspiciousDetections,
        color: APP_COLORS.warning,
      },
      {
        name: 'Clean Detections',
        value: cleanDetections,
        color: APP_COLORS.success,
      },
      {
        name: 'Undetected',
        value: undetectedDetections,
        color: APP_COLORS.neutral,
      },
    ].filter((item) => item.value > 0),
    [cleanDetections, maliciousDetections, suspiciousDetections, undetectedDetections]
  );

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <CardShell
      title="Threat Detection Overview"
      icon={<BarChart2 className="h-4 w-4" />}
      iconColor={riskColor(riskLevel)}
      badge={
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{
            backgroundColor: `${riskColor(riskLevel)}16`,
            color: riskColor(riskLevel),
          }}
        >
          {riskLevel}
        </span>
      }
      meta={
        <span>
          {totalAnalyzed} IOCs analyzed · {formatDateTime(timestamp)}
        </span>
      }
      sectionLabel="Executive Threat Snapshot"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <CinematicPieChart
          data={chartData}
          total={total}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        />

        <div className="space-y-2">
          <div
            className="grid grid-cols-[1.8fr_1fr_1fr] gap-2 border-b pb-2 text-xs font-bold uppercase"
            style={{ borderColor: APP_COLORS.border, color: APP_COLORS.textMuted }}
          >
            <span>Category</span>
            <span className="text-right">Share</span>
            <span className="text-right">Count</span>
          </div>

          {chartData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div
                key={item.name}
                className="grid grid-cols-[1.8fr_1fr_1fr] items-center gap-2 rounded-lg px-2 py-2"
                style={{
                  backgroundColor:
                    activeIndex === index ? APP_COLORS.backgroundSoft : 'transparent',
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm" style={{ color: APP_COLORS.textSecondary }}>
                    {item.name}
                  </span>
                </div>
                <span className="text-right text-sm" style={{ color: APP_COLORS.textMuted }}>
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-right font-bold" style={{ color: APP_COLORS.textPrimary }}>
                  {item.value.toLocaleString()}
                </span>
              </div>
            );
          })}

          <div
            className="mt-3 flex items-center justify-between border-t pt-3"
            style={{ borderColor: APP_COLORS.border }}
          >
            <span className="text-sm" style={{ color: APP_COLORS.textSecondary }}>
              Total Analyzed
            </span>
            <span className="text-xl font-black" style={{ color: APP_COLORS.textPrimary }}>
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}
