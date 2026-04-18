import { AlertTriangle, Fingerprint, Radar } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import type { IOCThreatIntel } from './types';

interface ThreatIntelSectionProps {
  threatIntel?: IOCThreatIntel;
}

function uniqueItems(items: Array<string | null | undefined>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item && item.trim())).map((item) => item.trim()))];
}

export function ThreatIntelSection({ threatIntel }: ThreatIntelSectionProps) {
  const threatTypes = uniqueItems(threatIntel?.threatTypes || []);
  const familyLabels = uniqueItems(threatIntel?.familyLabels || []);
  const threatCategories = uniqueItems(threatIntel?.threatCategories || []);

  if (threatTypes.length === 0 && familyLabels.length === 0 && threatCategories.length === 0 && !threatIntel?.popularThreatLabel) {
    return null;
  }

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="mb-4 flex items-center gap-2">
        <Radar className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
        <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
          Threat Intelligence
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="mb-2 text-xs font-black uppercase" style={{ color: APP_COLORS.textSecondary }}>
            Threat Types
          </p>
          <div className="flex flex-wrap gap-2">
            {threatTypes.length > 0 ? threatTypes.map((item) => (
              <span key={item} className="rounded-full px-2 py-1 text-xs" style={{ background: `${APP_COLORS.warning}15`, color: APP_COLORS.warningDark }}>
                {item}
              </span>
            )) : <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>No threat types</span>}
          </div>
        </div>

        <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="mb-2 text-xs font-black uppercase" style={{ color: APP_COLORS.textSecondary }}>
            Family Labels
          </p>
          <div className="flex flex-wrap gap-2">
            {familyLabels.length > 0 ? familyLabels.map((item) => (
              <span key={item} className="rounded-full px-2 py-1 text-xs" style={{ background: `${APP_COLORS.accentPurple}15`, color: APP_COLORS.accentPurple }}>
                {item}
              </span>
            )) : <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>No family labels</span>}
          </div>
        </div>

        <div className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="mb-2 text-xs font-black uppercase" style={{ color: APP_COLORS.textSecondary }}>
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {threatCategories.length > 0 ? threatCategories.map((item) => (
              <span key={item} className="rounded-full px-2 py-1 text-xs" style={{ background: `${APP_COLORS.accentBlue}15`, color: APP_COLORS.accentBlue }}>
                {item}
              </span>
            )) : <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>No categories</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {threatIntel?.popularThreatLabel ? (
          <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
            <Fingerprint className="h-4 w-4" style={{ color: APP_COLORS.primary }} />
            <span className="text-xs" style={{ color: APP_COLORS.textSecondary }}>Popular Label</span>
            <span className="text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>{threatIntel.popularThreatLabel}</span>
          </div>
        ) : null}

        {threatIntel?.suggestedThreatLabel ? (
          <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
            <AlertTriangle className="h-4 w-4" style={{ color: APP_COLORS.warningDark }} />
            <span className="text-xs" style={{ color: APP_COLORS.textSecondary }}>Suggested Label</span>
            <span className="text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>{threatIntel.suggestedThreatLabel}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
