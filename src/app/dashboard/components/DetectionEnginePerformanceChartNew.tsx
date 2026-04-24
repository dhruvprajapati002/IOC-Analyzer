'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, style } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { DetectionEngineItem } from './dashboard.types';

interface DetectionEnginePerformanceChartProps {
  data: DetectionEngineItem[];
}

export function DetectionEnginePerformanceChart({ data }: DetectionEnginePerformanceChartProps) {
  const rows = Array.isArray(data) ? data : [];

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border  p-6 `}
    style={
      style.card
    }>
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-t-success" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            Detection Engines
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!rows || rows.length === 0 ? (
          <NoGraphData title="No engine data" subtitle="No detection-engine telemetry found" />
        ) : (
          <>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={APP_COLORS.borderSoft} vertical={false} />
                  <XAxis
                    dataKey="engine"
                    tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }}
                    axisLine={{ stroke: APP_COLORS.border }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: APP_COLORS.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: APP_COLORS.surface,
                      border: `1px solid ${APP_COLORS.border}`,
                      borderRadius: 12,
                      color: APP_COLORS.textPrimary,
                      fontSize: 12,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    }}
                    labelStyle={{ color: APP_COLORS.textSecondary, fontWeight: 600 }}
                    itemStyle={{ color: APP_COLORS.textPrimary }}
                    cursor={{ fill: APP_COLORS.borderSoft }}
                  />
                  <Bar dataKey="totalDetections" name="Total Detections" fill={APP_COLORS.accentBlue} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="maliciousDetections" name="Malicious" fill={APP_COLORS.danger} radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="detectionRate"
                    name="Detection Rate"
                    stroke={APP_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5">
              {rows.map((entry) => (
                <div key={entry.engine} className="flex items-center justify-between rounded-lg border border-t-border px-2 py-1.5">
                  <span className={`${TYPOGRAPHY.caption.sm} text-t-textSecondary`}>{entry.engine}</span>
                  <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-[#3b82f6]`}>
                    {entry.totalDetections.toLocaleString()} / {entry.maliciousDetections.toLocaleString()} ({entry.detectionRate.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
