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

interface DomainWhoisSectionProps {
  whois?: {
    registrar?: string;
    registrant?: string;
    updatedDate?: string;
    nameservers?: string[];
    status?: string[];
  };
}

export function DomainWhoisSection({ whois }: DomainWhoisSectionProps) {
  return (
    <section className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
        WHOIS Data
      </p>

      <div className="space-y-2 text-sm">
        <p style={{ color: APP_COLORS.textSecondary }}>
          Registrant: <span style={{ color: APP_COLORS.textPrimary }}>{whois?.registrant || 'Unknown'}</span>
        </p>
        <p style={{ color: APP_COLORS.textSecondary }}>
          Registrar: <span style={{ color: APP_COLORS.textPrimary }}>{whois?.registrar || 'Unknown'}</span>
        </p>
        <p style={{ color: APP_COLORS.textSecondary }}>
          Updated Date: <span style={{ color: APP_COLORS.textPrimary }}>{formatDate(whois?.updatedDate)}</span>
        </p>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase" style={{ color: APP_COLORS.textMuted }}>
          Nameservers
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(whois?.nameservers || []).slice(0, 8).map((nameServer) => (
            <span
              key={nameServer}
              className="rounded-full border px-2 py-0.5 text-xs"
              style={{ borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.textSecondary }}
            >
              {nameServer}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase" style={{ color: APP_COLORS.textMuted }}>
          Status
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(whois?.status || []).slice(0, 8).map((status) => (
            <span
              key={status}
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.textSecondary }}
            >
              {status}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
