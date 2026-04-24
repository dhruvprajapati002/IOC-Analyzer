'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, RISK_COLORS, style } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import type { ThreatIntelligenceSummary } from './dashboard.types';

interface ThreatSeverityChartProps {
  data: ThreatIntelligenceSummary | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: RISK_COLORS.critical.primary,
  high: RISK_COLORS.high.primary,
  medium: RISK_COLORS.medium.primary,
  low: RISK_COLORS.low.primary,
};

export function ThreatSeverityChart({ data }: ThreatSeverityChartProps) {
  const rows = data?.bySeverity ?? [];
  const total = rows.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border  p-6 `}
    style={
           style.card
        }>
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-t-danger" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            Threat Severity
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!data || !rows || total === 0 ? (
          <NoGraphData title="No severity data" subtitle="No cached severity results for this range" />
        ) : (
          <>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={APP_COLORS.borderSoft} vertical={false} />
                  <XAxis
                    dataKey="severity"
                    tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }}
                    axisLine={{ stroke: APP_COLORS.border }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
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
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {rows.map((entry) => (
                      <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {rows.map((entry) => (
                <div key={entry.severity} className="rounded-lg border border-t-border px-2 py-1.5">
                  <p className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>{entry.severity}</p>
                  <p className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-t-primary`}>
                    {entry.count.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
