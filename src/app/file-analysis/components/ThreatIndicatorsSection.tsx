'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ScrollArea } from '@/components/ui/ScrollArea';

interface ThreatIndicatorsSectionProps {
  indicators: string[];
}

export function ThreatIndicatorsSection({ indicators }: ThreatIndicatorsSectionProps) {
  if (!indicators || indicators.length === 0) return null;

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all duration-200 hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="p-2.5 rounded-lg"
            style={{ backgroundColor: `${APP_COLORS.danger}20` }}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: APP_COLORS.danger }} />
          </div>
          <div>
            <h3 
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Threat Indicators
            </h3>
            <p 
              className={`${TYPOGRAPHY.caption.sm}`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              {indicators.length} indicators found
            </p>
          </div>
        </div>

        <ScrollArea className="max-h-[300px]" variant="thin">
          <div className="space-y-2">
          {indicators.map((indicator: string, index: number) => (
            <div 
              key={index}
              className="p-3 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: APP_COLORS.backgroundSoft }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: APP_COLORS.danger }}
              />
              <span className={TYPOGRAPHY.body.sm}>
                {indicator}
              </span>
            </div>
          ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
