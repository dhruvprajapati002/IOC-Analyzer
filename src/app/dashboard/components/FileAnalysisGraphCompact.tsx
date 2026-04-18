'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoGraphData } from '@/components/NoGraphData';
import { APP_COLORS, CARD_STYLES, LOADING_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { FileAnalysisSummary } from './dashboard.types';

interface FileAnalysisGraphProps {
  data: FileAnalysisSummary | null;
  loading?: boolean;
}

function formatBytes(value: number): string {
  if (!value) return '0 B';
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

export function FileAnalysisGraph({ data, loading = false }: FileAnalysisGraphProps) {
  const topTypes = data?.topFileTypes ?? [];
  const totalFiles = data?.totalFiles ?? 0;

  return (
    <Card className={`${CARD_STYLES.base} h-full rounded-2xl border border-[#dad9d4] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]`}>
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-t-primary" />
          <CardTitle className={`${TYPOGRAPHY.heading.h5} text-xs font-bold uppercase tracking-wide text-t-textSecondary`}>
            File Analysis
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className={`${LOADING_STYLES.skeleton} h-56`} />
        ) : totalFiles === 0 ? (
          <NoGraphData title="No file analysis data yet. Analyze file hashes to see stats here." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-lg border border-t-border p-2">
                <p className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>Total Files</p>
                <p className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-t-textPrimary`}>
                  {totalFiles.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-t-border p-2">
                <p className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>Malicious</p>
                <p className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-t-danger`}>
                  {(data?.maliciousFiles ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-t-border p-2">
                <p className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>Avg Size</p>
                <p className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-t-accentBlue`}>
                  {formatBytes(data?.avgFileSize ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-t-border p-2">
                <p className={`${TYPOGRAPHY.caption.xs} text-t-textMuted`}>Detection Rate</p>
                <p className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} text-t-success`}>
                  {(data?.detectionRate ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>

            {topTypes.length > 0 ? (
              <div className="mt-3 h-45">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTypes} layout="vertical" margin={{ top: 8, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={APP_COLORS.borderSoft} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }}
                      axisLine={{ stroke: APP_COLORS.border }}
                      tickLine={false}
                    />
                    <YAxis type="category" dataKey="type" width={70} tick={{ fill: APP_COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
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
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} fill={APP_COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-3">
                <NoGraphData title="No file type breakdown" height="h-24" />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
