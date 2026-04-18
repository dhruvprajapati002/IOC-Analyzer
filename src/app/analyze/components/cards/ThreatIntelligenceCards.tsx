'use client';

import { Bug } from 'lucide-react';
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

interface ThreatIntelligenceCardsProps {
  familyLabels: string[];
}

export function ThreatIntelligenceCards({ familyLabels }: ThreatIntelligenceCardsProps) {
  return (
    <CardShell
      title="Malware Family"
      icon={<Bug className="h-4 w-4" />}
      iconColor={APP_COLORS.accentPurple}
    >
      {familyLabels.length === 0 ? (
        <NoDataAvailable message="No malware families identified" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {familyLabels.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="rounded-md border px-2.5 py-1 text-xs font-bold"
              title={label}
              style={{
                backgroundColor: `${APP_COLORS.primary}18`,
                color: APP_COLORS.primary,
                borderColor: `${APP_COLORS.primary}30`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </CardShell>
  );
}
