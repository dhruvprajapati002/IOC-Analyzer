'use client';

import { Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, LOADING_STYLES, style } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { IocTypeDistributionItem } from './dashboard.types';

interface IOCTypeDistributionChartProps {
  data: IocTypeDistributionItem[];
  loading?: boolean;
}

type LooseIocTypeRow = IocTypeDistributionItem & {
  value?: number | string;
  name?: string;
};

const IOC_COLORS: Record<string, string> = {
  ip: APP_COLORS.accentBlue,
  domain: APP_COLORS.primary,
  url: APP_COLORS.warning,
  hash: APP_COLORS.accentPurple,
};

function toRawType(item: IocTypeDistributionItem): string {
  const raw = String(item.rawType ?? item.type ?? '').toLowerCase().trim();
  if (raw === 'file_hash' || raw === 'filehash') return 'hash';
  if (raw === 'ip_address' || raw === 'ipaddress') return 'ip';
  if (raw.includes('ip')) return 'ip';
  if (raw.includes('domain')) return 'domain';
  if (raw.includes('url')) return 'url';
  if (raw.includes('hash')) return 'hash';
  return raw;
}

function toNumber(value: unknown): number {
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function IOCTypeDistributionChart({ data, loading = false }: IOCTypeDistributionChartProps) {
  const rows = (Array.isArray(data) ? data : []).map((rawItem) => {
    const item = rawItem as LooseIocTypeRow;
    const rawType = toRawType(item);
    const count = toNumber(item.count ?? item.value ?? 0);
    const type = String((item.type ?? item.name ?? rawType) || 'Unknown');
    const fill = typeof item.color === 'string' && item.color ? item.color : IOC_COLORS[rawType] ?? APP_COLORS.neutral;
    return {
      ...item,
      type,
      count,
      rawType,
      fill,
    };
  }).filter((item) => item.count > 0);
  const total = rows.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border p-6`} style={style.card}>
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-t-primary" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            IOC Type Distribution
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className={`${LOADING_STYLES.skeleton} h-56`} />
        ) : !rows || rows.length === 0 || total === 0 ? (
          <NoGraphData title="No IOC type data" subtitle="No IOC records in this range" />
        ) : (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rows} dataKey="count" nameKey="type" innerRadius={45} outerRadius={75}>
                    {rows.map((item) => (
                      <Cell key={`${item.type}-${item.rawType}`} fill={item.fill} />
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
              {rows.map((item) => {
                const percent = total ? ((item.count / total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={item.type} className="flex items-center justify-between rounded-lg border border-t-border px-2 py-1.5">
                    <span className={`${TYPOGRAPHY.caption.sm} text-t-textSecondary`}>{item.type}</span>
                    <span
                      className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                      style={{ color: item.fill ?? APP_COLORS.textPrimary }}
                    >
                      {item.count.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
