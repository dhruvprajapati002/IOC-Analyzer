'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { FileAnalysisResult } from './types';

interface ThreatOverviewSectionProps {
  threatOverview: FileAnalysisResult['threatOverview'];
}

export function ThreatOverviewSection({ threatOverview }: ThreatOverviewSectionProps) {
  if (!threatOverview || threatOverview.totalAnalyzed === 0) return null;

  return (
    <Card
      className={`${CARD_STYLES.base} h-full transition-all duration-200 hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-2.5 rounded-lg"
            style={{ backgroundColor: `${APP_COLORS.primary}20` }}
          >
            <Activity className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
          </div>
          <div>
            <h3 
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Threat Overview
            </h3>
            <p 
              className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              Vendor analysis summary
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105" style={{ backgroundColor: 'transparent', borderColor: `${APP_COLORS.danger}30` }}>
            <p 
              className={`${TYPOGRAPHY.heading.h1} ${TYPOGRAPHY.fontWeight.black}`}
              style={{ color: APP_COLORS.danger }}
            >
              {threatOverview.malicious}
            </p>
            <p className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`} style={{ color: APP_COLORS.textSecondary }}>
              Malicious
            </p>
          </div>
          <div className="text-center p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105" style={{ backgroundColor: 'transparent', borderColor: `${APP_COLORS.warning}30` }}>
            <p 
              className={`${TYPOGRAPHY.heading.h1} ${TYPOGRAPHY.fontWeight.black}`}
              style={{ color: APP_COLORS.warning }}
            >
              {threatOverview.suspicious}
            </p>
            <p className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`} style={{ color: APP_COLORS.textSecondary }}>
              Suspicious
            </p>
          </div>
          <div className="text-center p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105" style={{ backgroundColor: 'transparent', borderColor: `${APP_COLORS.success}30` }}>
            <p 
              className={`${TYPOGRAPHY.heading.h1} ${TYPOGRAPHY.fontWeight.black}`}
              style={{ color: APP_COLORS.success }}
            >
              {threatOverview.clean}
            </p>
            <p className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`} style={{ color: APP_COLORS.textSecondary }}>
              Clean
            </p>
          </div>
          <div className="text-center p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105" style={{ backgroundColor: 'transparent', borderColor: `${APP_COLORS.primary}30` }}>
            <p 
              className={`${TYPOGRAPHY.heading.h1} ${TYPOGRAPHY.fontWeight.black}`}
              style={{ color: APP_COLORS.primary }}
            >
              {threatOverview.totalAnalyzed}
            </p>
            <p className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`} style={{ color: APP_COLORS.textSecondary }}>
              Total
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
