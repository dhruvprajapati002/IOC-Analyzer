'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Shield, AlertTriangle, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface AnalysisStatsSectionProps {
  stats: {
    malicious?: number;
    suspicious?: number;
    undetected?: number;
    harmless?: number;
    timeout?: number;
    'confirmed-timeout'?: number;
    failure?: number;
    'type-unsupported'?: number;
  };
}

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}

function StatBox({ label, value, color, icon: Icon }: StatBoxProps) {
  return (
    <div
      className="rounded-lg p-4 transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: `${color}10`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-md"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <div
            className={`${TYPOGRAPHY.heading.h4} ${TYPOGRAPHY.fontWeight.bold}`}
            style={{ color }}
          >
            {value}
          </div>
          <div
            className={`${TYPOGRAPHY.caption.sm}`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalysisStatsSection({ stats }: AnalysisStatsSectionProps) {
  if (!stats || Object.keys(stats).length === 0) return null;

  const totalEngines = Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all duration-200 hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${APP_COLORS.accentBlue}20` }}
            >
              <Activity className="h-5 w-5" style={{ color: APP_COLORS.accentBlue }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Vendor Analysis Results
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.sm}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                {totalEngines} security vendor{totalEngines !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.malicious !== undefined && stats.malicious > 0 && (
            <StatBox
              label="Malicious"
              value={stats.malicious}
              color={APP_COLORS.danger}
              icon={XCircle}
            />
          )}

          {stats.suspicious !== undefined && stats.suspicious > 0 && (
            <StatBox
              label="Suspicious"
              value={stats.suspicious}
              color={APP_COLORS.warning}
              icon={AlertTriangle}
            />
          )}

          {stats.harmless !== undefined && (
            <StatBox
              label="Harmless"
              value={stats.harmless}
              color={APP_COLORS.success}
              icon={CheckCircle2}
            />
          )}

          {stats.undetected !== undefined && (
            <StatBox
              label="Undetected"
              value={stats.undetected}
              color={APP_COLORS.info}
              icon={Shield}
            />
          )}

          {stats.timeout !== undefined && stats.timeout > 0 && (
            <StatBox
              label="Timeout"
              value={stats.timeout}
              color={APP_COLORS.textMuted}
              icon={Clock}
            />
          )}

          {stats.failure !== undefined && stats.failure > 0 && (
            <StatBox
              label="Failed"
              value={stats.failure}
              color={APP_COLORS.textMuted}
              icon={AlertCircle}
            />
          )}

          {stats['type-unsupported'] !== undefined && stats['type-unsupported'] > 0 && (
            <StatBox
              label="Unsupported"
              value={stats['type-unsupported']}
              color={APP_COLORS.textMuted}
              icon={AlertCircle}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
