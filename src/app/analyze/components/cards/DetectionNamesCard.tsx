'use client';

import { Server } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/ScrollArea';
import { CardShell } from '@/app/analyze/components/cards/CardShell';
import { NoDataAvailable } from '@/app/analyze/components/cards/NoDataAvailable';

interface DetectionNamesCardProps {
  detections: Array<{
    engine: string;
    category: string;
    result: string;
  }>;
}

export function DetectionNamesCard({ detections }: DetectionNamesCardProps) {
  return (
    <CardShell
      title="Engine Detections"
      icon={<Server className="h-4 w-4" />}
      iconColor={APP_COLORS.warning}
      meta={<span style={{ color: APP_COLORS.primary, fontWeight: 700 }}>Total Detections: {detections.length}</span>}
    >
      {detections.length === 0 ? (
        <NoDataAvailable message="No engine detections available" />
      ) : (
        <div className="rounded-xl border" style={{ borderColor: APP_COLORS.border }}>
          <ScrollArea className="max-h-[280px]" variant="thin">
            <div>
              {detections.map((detection, index) => (
                <div
                  key={`${detection.engine}-${index}`}
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderBottom: `1px solid ${APP_COLORS.borderSoft}` }}
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="w-6 text-xs" style={{ color: APP_COLORS.textMuted }}>
                      {index + 1}.
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
                        {detection.result}
                      </p>
                      <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
                        • {detection.engine}
                      </p>
                    </div>
                  </div>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: APP_COLORS.border }} />
                </div>
              ))}
            </div>
          </ScrollArea>

          <div
            className="sticky bottom-0 flex items-center justify-between px-3 py-2"
            style={{ borderTop: `1px solid ${APP_COLORS.border}`, backgroundColor: APP_COLORS.backgroundSoft }}
          >
            <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>
              Total Detections
            </span>
            <span className="text-xl font-black" style={{ color: APP_COLORS.primary }}>
              {detections.length}
            </span>
          </div>
        </div>
      )}
    </CardShell>
  );
}
