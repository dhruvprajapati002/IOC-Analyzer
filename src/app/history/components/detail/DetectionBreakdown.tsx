'use client';

import { ShieldAlert } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { APP_COLORS, CHART_COLORS } from '@/lib/colors';
import type { IOCDetectionItem, IOCDetailStats } from './types';
import { toSafeStats } from './types';

interface DetectionBreakdownProps {
  stats?: IOCDetailStats;
  detections?: IOCDetectionItem[];
}

export function DetectionBreakdown({ stats, detections = [] }: DetectionBreakdownProps) {
  const safeStats = toSafeStats(stats);

  const chartData = [
    { name: 'Malicious', key: 'malicious', value: safeStats.malicious, color: CHART_COLORS.malicious },
    { name: 'Suspicious', key: 'suspicious', value: safeStats.suspicious, color: CHART_COLORS.suspicious },
    { name: 'Harmless', key: 'harmless', value: safeStats.harmless, color: CHART_COLORS.clean },
    { name: 'Undetected', key: 'undetected', value: safeStats.undetected, color: CHART_COLORS.unknown },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="mb-4 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
        <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
          Detection Breakdown
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[240px] rounded-xl border p-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm" style={{ color: APP_COLORS.textMuted }}>
              No detection stats available
            </div>
          )}
        </div>

        <div className="space-y-2">
          {chartData.map((entry) => {
            const pct = total ? Math.round((entry.value / total) * 100) : 0;
            return (
              <div key={entry.key} className="rounded-xl border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span style={{ color: APP_COLORS.textSecondary }}>{entry.name}</span>
                  <span className="font-bold" style={{ color: APP_COLORS.textPrimary }}>{entry.value} ({pct}%)</span>
                </div>
                <div className="h-1.5 rounded" style={{ background: APP_COLORS.borderSoft }}>
                  <div className="h-1.5 rounded" style={{ width: `${pct}%`, background: entry.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
        <h4 className="mb-2 text-xs font-black uppercase tracking-wide" style={{ color: APP_COLORS.textSecondary }}>
          Detection Engines
        </h4>
        {detections.length === 0 ? (
          <p className="text-sm" style={{ color: APP_COLORS.textMuted }}>No engine-level detections returned.</p>
        ) : (
          <div className="max-h-[220px] space-y-2 overflow-auto pr-1">
            {detections.slice(0, 12).map((item, index) => (
              <div key={`${item.engine}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.surface }}>
                <span className="truncate" style={{ color: APP_COLORS.textPrimary }} title={item.engine}>{item.engine}</span>
                <span className="rounded-full px-2 py-0.5" style={{
                  background: item.category === 'malicious' ? `${APP_COLORS.danger}15` : item.category === 'suspicious' ? `${APP_COLORS.warning}15` : APP_COLORS.backgroundSoft,
                  color: item.category === 'malicious' ? APP_COLORS.danger : item.category === 'suspicious' ? APP_COLORS.warningDark : APP_COLORS.textSecondary,
                }}>
                  {item.result || item.category || 'unknown'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
