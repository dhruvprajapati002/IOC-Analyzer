'use client';

import { AlertTriangle, AlertOctagon } from 'lucide-react';
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

interface PopularThreatLabelProps {
  label: string | null;
  suggestedLabel?: string | null;
  maliciousCount: number;
  suspiciousCount: number;
  verdict?: string;
}

function verdictColor(verdict?: string) {
  if (verdict === 'malicious') return RISK_COLORS.critical.primary;
  if (verdict === 'suspicious') return APP_COLORS.warning;
  return APP_COLORS.success;
}

export function PopularThreatLabel({
  label,
  suggestedLabel,
  maliciousCount,
  suspiciousCount,
  verdict,
}: PopularThreatLabelProps) {
  const color = verdictColor(verdict);

  return (
    <CardShell
      title="Popular Threat Label"
      icon={<AlertOctagon className="h-4 w-4" />}
      iconColor={APP_COLORS.danger}
    >
      {label ? (
        <div className="space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12" style={{ color }} />
          <h3 className="text-3xl font-black" style={{ color }}>
            {label}
          </h3>
          <p className="text-xs uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
            Suggested Classification
          </p>
          <p className="text-sm italic" style={{ color: APP_COLORS.primary }}>
            {suggestedLabel || 'Not available'}
          </p>
          <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
            Most commonly identified threat signature
          </p>

          <div className="my-3 h-px" style={{ backgroundColor: APP_COLORS.border }} />

          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-bold" style={{ color: RISK_COLORS.critical.primary }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS.critical.primary }} />
              Malicious: {maliciousCount}
            </span>
            <span style={{ color: APP_COLORS.textMuted }}>|</span>
            <span className="inline-flex items-center gap-1 font-bold" style={{ color: APP_COLORS.warning }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: APP_COLORS.warning }} />
              Suspicious: {suspiciousCount}
            </span>
          </div>
        </div>
      ) : (
        <NoDataAvailable message="No threat signature identified" />
      )}
    </CardShell>
  );
}
