'use client';

import { Bookmark, Layers } from 'lucide-react';
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

interface ThreatVectorGridProps {
  categories: string[];
}

export function ThreatVectorGrid({ categories }: ThreatVectorGridProps) {
  return (
    <CardShell
      title="Threat Categories"
      icon={<Layers className="h-4 w-4" />}
      iconColor={APP_COLORS.accentOrange}
    >
      {categories.length === 0 ? (
        <NoDataAvailable message="No threat categories identified" />
      ) : (
        <div className="space-y-1">
          {categories.map((category, index) => (
            <div
              key={`${category}-${index}`}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ borderBottom: `1px solid ${APP_COLORS.borderSoft}` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>
                  {index + 1}
                </span>
                <span className="text-sm font-bold uppercase" style={{ color: APP_COLORS.primary }}>
                  {category}
                </span>
              </div>
              <Bookmark className="h-3.5 w-3.5" style={{ color: APP_COLORS.border }} />
            </div>
          ))}

          <div
            className="mt-3 flex items-center justify-between border-t pt-3"
            style={{ borderColor: APP_COLORS.border }}
          >
            <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>
              Total Categories
            </span>
            <span className="text-xl font-black" style={{ color: APP_COLORS.primary }}>
              {categories.length}
            </span>
          </div>
        </div>
      )}
    </CardShell>
  );
}
