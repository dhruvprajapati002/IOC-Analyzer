'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, CHART_COLORS, LOADING_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyTrendPoint } from './dashboard.types';

interface ThreatTrendChartProps {
  data: DailyTrendPoint[];
  loading?: boolean;
}

type LooseDailyTrendPoint = DailyTrendPoint & {
  totalThreats?: number | string;
  suspiciousCount?: number | string;
  cleanCount?: number | string;
  total?: number | string;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ThreatTrendChart({ data, loading = false }: ThreatTrendChartProps) {
  const rows = Array.isArray(data)
    ? data
        .map((rawItem) => {
          const item = rawItem as LooseDailyTrendPoint;
          const threats = toNumber(item.threats ?? item.totalThreats ?? item.total ?? 0);
          const clean = toNumber(item.clean ?? item.cleanCount ?? 0);
          const suspicious = toNumber(item.suspicious ?? item.suspiciousCount ?? Math.max(0, threats - clean));
          const displayDate = String(item.displayDate ?? item.dateLabel ?? item.day ?? '').trim();

          return {
            ...item,
            threats,
            clean,
            suspicious,
            displayDate,
          };
        })
        .filter((item) => item.displayDate.length > 0)
    : [];

  return (
    <Card
      className={`${CARD_STYLES.base} h-full`}
      style={{
        background: APP_COLORS.surface,
        border: `1px solid ${APP_COLORS.border}`,
        borderRadius: 16,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <CardHeader className="p-0 pb-4">
        <CardTitle
          className={TYPOGRAPHY.heading.h5}
          style={{
            color: APP_COLORS.textSecondary,
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Threat Activity Timeline
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className={`${LOADING_STYLES.skeleton} h-80`} />
        ) : !rows || rows.length === 0 ? (
          <NoGraphData title="No trend data" subtitle="No IOC activity found for this time range" />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke={APP_COLORS.borderSoft} vertical={false} />
                <XAxis
                  dataKey="displayDate"
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
                <Area
                  type="monotone"
                  dataKey="threats"
                  name="Threats"
                  stroke={APP_COLORS.danger}
                  fill={APP_COLORS.danger}
                  fillOpacity={0.2}
                  strokeWidth={2.2}
                />
                <Area
                  type="monotone"
                  dataKey="suspicious"
                  name="Suspicious"
                  stroke={APP_COLORS.warning}
                  fill={APP_COLORS.warning}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="clean"
                  name="Clean"
                  stroke={CHART_COLORS.clean}
                  fill={APP_COLORS.success}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
