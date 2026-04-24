'use client';

import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, style } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { ThreatTypeItem } from './dashboard.types';

interface ThreatTypePieChartProps {
  data: ThreatTypeItem[];
}

type LooseThreatTypeRow = ThreatTypeItem & {
  value?: number | string;
  name?: string;
};

const VERDICT_COLORS: Record<string, string> = {
  malicious: APP_COLORS.danger,
  suspicious: APP_COLORS.warning,
  harmless: APP_COLORS.success,
  clean: APP_COLORS.success,
  undetected: APP_COLORS.neutral,
  unknown: APP_COLORS.accentPurple,
};

function toNumber(value: unknown): number {
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeVerdictLabel(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'harmless') return 'Clean';
  if (normalized === 'undetected') return 'Undetected';
  if (normalized === 'malicious') return 'Malicious';
  if (normalized === 'suspicious') return 'Suspicious';
  if (normalized === 'unknown') return 'Unknown';
  if (!normalized) return 'Unknown';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function ThreatTypePieChart({ data }: ThreatTypePieChartProps) {
  const rows = (Array.isArray(data) ? data : []).map((rawItem) => {
    const item = rawItem as LooseThreatTypeRow;
    const rawType = String(item.type ?? item.name ?? '').toLowerCase().trim();
    const count = toNumber(item.count ?? item.value ?? 0);
    const fill = typeof item.color === 'string' && item.color ? item.color : VERDICT_COLORS[rawType] ?? APP_COLORS.neutral;
    return {
      ...item,
      type: normalizeVerdictLabel(String(item.type ?? item.name ?? 'Unknown')),
      count,
      fill,
    };
  }).filter((item) => item.count > 0);
  const total = rows.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border p-6`} style={style.card}>

      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-t-primary" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            Threat Classification
          </CardTitle>
        </div> 
      </CardHeader>

      <CardContent className="p-0">
        {!rows || rows.length === 0 || total === 0 ? (
          <NoGraphData title="No verdict data" subtitle="No classified IOC verdicts for this range" />
        ) : (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rows} dataKey="count" nameKey="type" innerRadius={48} outerRadius={78}>
                    {rows.map((item) => (
                      <Cell key={item.type} fill={item.fill} />
                    ))}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5">
              {rows.map((item) => (
                <div key={item.type} className="flex items-center justify-between rounded-lg border border-t-border px-2 py-1.5">
                  <span className={`${TYPOGRAPHY.caption.sm} text-t-textSecondary`}>{item.type}</span>
                  <span
                    className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                    style={{ color: item.fill ?? APP_COLORS.textPrimary }}
                  >
                    {item.count.toLocaleString()} ({total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0'}%)
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
