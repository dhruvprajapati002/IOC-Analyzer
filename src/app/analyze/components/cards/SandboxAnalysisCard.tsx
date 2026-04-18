'use client';

import { FlaskConical } from 'lucide-react';
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

interface SandboxAnalysisCardProps {
  sandboxAnalysis: {
    verdicts?: Array<{
      sandbox?: string;
      sandbox_name?: string;
      verdict: string;
      confidence?: number;
      malware_classification?: string[];
    }>;
    summary?: {
      total: number;
      malicious: number;
      suspicious: number;
      clean: number;
    };
  } | null;
}

export function SandboxAnalysisCard({ sandboxAnalysis }: SandboxAnalysisCardProps) {
  const verdicts = sandboxAnalysis?.verdicts || [];
  const summary = sandboxAnalysis?.summary || {
    total: verdicts.length,
    malicious: verdicts.filter((item) => item.verdict === 'malicious').length,
    suspicious: verdicts.filter((item) => item.verdict === 'suspicious').length,
    clean: verdicts.filter((item) => ['clean', 'undetected'].includes(item.verdict)).length,
  };

  return (
    <CardShell
      title="Sandbox Analysis"
      icon={<FlaskConical className="h-4 w-4" />}
      iconColor={APP_COLORS.accentTeal}
      collapsible
      meta={
        <div className="flex items-center gap-1">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.textSecondary }}>
            {summary.total} Total
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${APP_COLORS.danger}15`, color: APP_COLORS.danger }}>
            {summary.malicious} Malicious
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${APP_COLORS.warning}15`, color: APP_COLORS.warning }}>
            {summary.suspicious} Suspicious
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${APP_COLORS.success}15`, color: APP_COLORS.success }}>
            {summary.clean} Clean
          </span>
        </div>
      }
    >
      <p className="mb-3 text-xs" style={{ color: APP_COLORS.textMuted }}>
        Click to view detailed results
      </p>

      {verdicts.length === 0 ? (
        <NoDataAvailable message="No sandbox verdicts available" small />
      ) : (
        <div className="space-y-2">
          {verdicts.map((item, index) => {
            const verdictColor =
              item.verdict === 'malicious'
                ? APP_COLORS.danger
                : item.verdict === 'suspicious'
                  ? APP_COLORS.warning
                  : APP_COLORS.success;

            return (
              <div
                key={`${item.sandbox_name || item.sandbox}-${index}`}
                className="grid grid-cols-[1.2fr_auto_1fr] items-center gap-3 rounded-lg border px-3 py-2"
                style={{ borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.backgroundSoft }}
              >
                <span className="text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
                  {item.sandbox_name || item.sandbox || 'Unknown Vendor'}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                  style={{ backgroundColor: `${verdictColor}15`, color: verdictColor }}
                >
                  {item.verdict}
                </span>
                <span className="truncate text-xs" style={{ color: APP_COLORS.textSecondary }}>
                  {(item.malware_classification || []).slice(0, 2).join(', ') || 'No finding summary'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}
