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

interface DomainReputationSectionProps {
  reputation?: {
    vtScore?: number;
    verdictFromMain?: string;
    threatTypes?: string[];
  };
}

function verdictColor(verdict?: string) {
  if (verdict === 'malicious') return APP_COLORS.danger;
  if (verdict === 'suspicious') return APP_COLORS.warning;
  return APP_COLORS.success;
}

export function DomainReputationSection({ reputation }: DomainReputationSectionProps) {
  const color = verdictColor(reputation?.verdictFromMain);

  return (
    <section className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
        Reputation Summary
      </p>

      <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.backgroundSoft }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>
            Main Verdict
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold uppercase"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {reputation?.verdictFromMain || 'unknown'}
          </span>
        </div>

        <p className="text-xs" style={{ color: APP_COLORS.textSecondary }}>
          VT Score: <span style={{ color: APP_COLORS.textPrimary, fontWeight: 700 }}>{reputation?.vtScore ?? 0}</span>
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {(reputation?.threatTypes || []).slice(0, 6).map((threatType) => (
            <span
              key={threatType}
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: APP_COLORS.surface, color: APP_COLORS.textSecondary, border: `1px solid ${APP_COLORS.border}` }}
            >
              {threatType}
            </span>
          ))}
        </div>
      </div>

      <button type="button" className="text-xs" style={{ color: APP_COLORS.primary }}>
        Full Analysis Above ↑
      </button>
    </section>
  );
}
