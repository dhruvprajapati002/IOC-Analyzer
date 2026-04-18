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

interface DomainSubdomainSectionProps {
  ssl?: {
    subject?: string;
  };
}

export function DomainSubdomainSection({ ssl }: DomainSubdomainSectionProps) {
  const candidates = (ssl?.subject || '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.toLowerCase().startsWith('cn='))
    .map((part) => part.replace(/^cn=/i, ''));

  return (
    <section className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
        Related Names
      </p>

      {candidates.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {candidates.map((candidate) => (
            <span
              key={candidate}
              className="rounded-full border px-2 py-0.5 text-xs"
              style={{ borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.textSecondary }}
            >
              {candidate}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs italic" style={{ color: APP_COLORS.textMuted }}>
          No related subdomain hints found.
        </p>
      )}
    </section>
  );
}
