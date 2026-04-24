'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, LOADING_STYLES, style } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import type { DailyTrendPoint } from './dashboard.types';

interface RiskScoreTrendProps {
  data: DailyTrendPoint[];
  loading?: boolean;
}

export function RiskScoreTrend({ data, loading = false }: RiskScoreTrendProps) {
  const rows = data.map((item) => ({
    date: item.displayDate,
    score: item.total > 0 ? Number(((item.threats / item.total) * 100).toFixed(1)) : 0,
    iocVolume: item.total,
  }));

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border  p-6 `}
    style={
      style.card
    }>
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-t-primary" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            Risk Score Trend
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className={`${LOADING_STYLES.skeleton} h-60`} />
        ) : !rows || rows.length === 0 ? (
          <NoGraphData title="No risk trend data" subtitle="No daily trend records available" />
        ) : (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke={APP_COLORS.borderSoft} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }}
                  axisLine={{ stroke: APP_COLORS.border }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
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
                <ReferenceLine y={70} stroke={APP_COLORS.danger} strokeDasharray="4 4" />
                <ReferenceLine y={40} stroke={APP_COLORS.warning} strokeDasharray="4 4" />
                <Bar dataKey="iocVolume" name="IOC Volume" fill={APP_COLORS.surfaceMuted} opacity={0.7} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Risk Score"
                  stroke={APP_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
