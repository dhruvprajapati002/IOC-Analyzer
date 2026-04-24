'use client';

import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, style } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import type { ThreatVectorItem } from './dashboard.types';

interface TopThreatsGraphProps {
  data: ThreatVectorItem[];
}

export function TopThreatsGraph({ data }: TopThreatsGraphProps) {
  const rows = data.slice(0, 8);

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border  p-6 `} style={style.card}>
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-t-danger" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            Top Threat Vectors
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!rows || rows.length === 0 ? (
          <NoGraphData title="No threat vectors" subtitle="No threat-intel vectors in this range" />
        ) : (
          <>
            <div className="h-70">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={APP_COLORS.borderSoft} vertical={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }}
                    axisLine={{ stroke: APP_COLORS.border }}
                    tickLine={false}
                  />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, key) => [Number(value ?? 0).toLocaleString(), String(key)]}
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
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {rows.map((row) => (
                      <Cell key={row.name} fill={row.color || APP_COLORS.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5">
              {rows.map((row) => (
                <div key={row.name} className="rounded-lg border border-t-border px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`${TYPOGRAPHY.caption.sm} text-t-textSecondary`}>{row.name}</span>
                    <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-t-primary`}>
                      {row.count.toLocaleString()} ({row.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <p className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>{row.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
