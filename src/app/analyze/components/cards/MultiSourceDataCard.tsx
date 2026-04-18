'use client';

import { Database } from 'lucide-react';
import {
  APP_COLORS,
  CHART_COLORS,
  RISK_COLORS,
  STATUS_BADGE,
  BUTTON_STYLES,
  INPUT_STYLES,
  SHADOWS,
  LOADING_STYLES,
} from '@/lib/colors';
import { CardShell } from '@/app/analyze/components/cards/CardShell';
import { NoDataAvailable } from '@/app/analyze/components/cards/NoDataAvailable';
import { toTitleCase } from '@/app/analyze/utils/analyzeFormatters';

interface MultiSourceDataCardProps {
  multiSourceData: Record<string, any> | null;
}

function getSourceEntries(sourceData: any): Array<{ label: string; value: string | number }> {
  if (!sourceData || typeof sourceData !== 'object') return [];

  const entries: Array<{ label: string; value: string | number }> = [];

  if (typeof sourceData.verdict === 'string') {
    entries.push({ label: 'Verdict', value: sourceData.verdict });
  }
  if (typeof sourceData.score === 'number') {
    entries.push({ label: 'Score', value: sourceData.score });
  }
  if (typeof sourceData.confidence === 'number') {
    entries.push({ label: 'Confidence', value: `${Math.round(sourceData.confidence * 100)}%` });
  }
  if (typeof sourceData.classification === 'string') {
    entries.push({ label: 'Classification', value: sourceData.classification });
  }
  if (typeof sourceData.fraud_score === 'number') {
    entries.push({ label: 'Fraud Score', value: `${sourceData.fraud_score}%` });
  }
  if (Array.isArray(sourceData.tags) && sourceData.tags.length > 0) {
    entries.push({ label: 'Tags', value: sourceData.tags.slice(0, 2).join(', ') });
  }

  return entries.slice(0, 6);
}

export function MultiSourceDataCard({ multiSourceData }: MultiSourceDataCardProps) {
  const sources = Object.entries(multiSourceData || {}).filter(([, value]) => !!value);

  return (
    <CardShell
      title="Cyber Intelligence Analysis"
      icon={<Database className="h-4 w-4" />}
      iconColor={APP_COLORS.accentIndigo}
      sectionLabel="Cross-Source Correlation"
    >
      {sources.length === 0 ? (
        <NoDataAvailable message="No cross-source intelligence available" />
      ) : (
        <div className="space-y-3">
          {sources.map(([sourceName, sourceData]) => {
            const verdict = String((sourceData as any)?.verdict || 'unknown');
            const verdictColor =
              verdict === 'malicious'
                ? APP_COLORS.danger
                : verdict === 'suspicious'
                  ? APP_COLORS.warning
                  : APP_COLORS.success;

            const stats = getSourceEntries(sourceData);

            return (
              <div
                key={sourceName}
                style={{
                  background: APP_COLORS.backgroundSoft,
                  border: `1px solid ${APP_COLORS.border}`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>
                    {toTitleCase(sourceName)}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                    style={{ backgroundColor: `${verdictColor}15`, color: verdictColor }}
                  >
                    {verdict}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {stats.length === 0 ? (
                    <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
                      No source metrics available
                    </p>
                  ) : (
                    stats.map((entry) => (
                      <div key={entry.label} className="rounded-lg border px-2.5 py-2" style={{ borderColor: APP_COLORS.border }}>
                        <p className="text-xs uppercase" style={{ color: APP_COLORS.textMuted }}>
                          {entry.label}
                        </p>
                        <p className="text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>
                          {entry.value}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}
