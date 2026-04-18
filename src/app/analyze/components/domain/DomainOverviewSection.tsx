'use client';

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
import { formatDate } from '@/app/analyze/utils/analyzeFormatters';

interface DomainOverviewSectionProps {
  whois?: {
    registrar?: string;
    createdDate?: string;
    expiresDate?: string;
    status?: string[];
  };
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.backgroundSoft }}
    >
      <p className="text-xs uppercase tracking-wide" style={{ color: APP_COLORS.textMuted }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
        {value}
      </p>
    </div>
  );
}

export function DomainOverviewSection({ whois }: DomainOverviewSectionProps) {
  return (
    <section className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
        Overview
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Registrar" value={whois?.registrar || 'Unknown'} />
        <Tile label="Created Date" value={formatDate(whois?.createdDate)} />
        <Tile label="Expires Date" value={formatDate(whois?.expiresDate)} />
        <Tile label="Status" value={whois?.status?.[0] || 'Unknown'} />
      </div>
    </section>
  );
}
