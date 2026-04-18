'use client';

import { Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, LOADING_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { GeoDistributionItem } from './dashboard.types';

interface GeographicDistributionChartProps {
  data: GeoDistributionItem[];
  loading?: boolean;
}

export function GeographicDistributionChart({ data, loading = false }: GeographicDistributionChartProps) {
  const rows = data.slice(0, 8);

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border border-[#dad9d4] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]`}>
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-t-primary" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            Geographic Distribution
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className={`${LOADING_STYLES.skeleton} h-60`} />
        ) : !rows || rows.length === 0 ? (
          <NoGraphData title="No geolocation data" subtitle="No IP geolocation entries in this range" />
        ) : (
          <>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={APP_COLORS.borderSoft} vertical={false} />
                  <XAxis
                    dataKey="country"
                    tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }}
                    axisLine={{ stroke: APP_COLORS.border }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, name) => [Number(value ?? 0).toLocaleString(), String(name)]}
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
                  <Bar dataKey="maliciousCount" stackId="a" fill={APP_COLORS.danger} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="suspiciousCount" stackId="a" fill={APP_COLORS.warning} />
                  <Bar dataKey="harmlessCount" stackId="a" fill={APP_COLORS.success} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5">
              {rows.map((row) => (
                <div key={row.country} className="flex items-center justify-between rounded-lg border border-t-border px-2 py-1.5">
                  <span className={`${TYPOGRAPHY.caption.sm} text-t-textSecondary`}>
                    {row.countryName}
                  </span>
                  <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-t-warning`}>
                    {row.count.toLocaleString()} ({row.threatPercentage.toFixed(1)}%)
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
