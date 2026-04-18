'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface ThreatVector {
  name: string;
  count: number;
  severity: string;
  detectionRate: number;
  riskLevel: string;
  color: string;
  description: string;
  percentage: number;
}

interface ThreatVectorGridProps {
  threatVectorData: ThreatVector[];
}

export function ThreatVectorGrid({ threatVectorData }: ThreatVectorGridProps) {
  if (threatVectorData.length === 0) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return APP_COLORS.danger;
      case 'high': return APP_COLORS.warning;
      case 'medium': return APP_COLORS.accentPurple;
      case 'low': return APP_COLORS.success;
      default: return APP_COLORS.textMuted;
    }
  };

  return (
    <Card 
      className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardHeader className="pb-3 px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-md"
              style={{
                backgroundColor: `${APP_COLORS.warning}20`,
                border: `1px solid ${APP_COLORS.warning}40`,
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: APP_COLORS.warning }} />
            </div>
            <CardTitle 
              className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Threat Vector Analysis
            </CardTitle>
          </div>
          <Badge
            className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
            style={{
              backgroundColor: `${APP_COLORS.success}`,
              color: APP_COLORS.success,
              border: `1px solid ${APP_COLORS.success}`,
            }}
          >
            Live Data
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-3 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {threatVectorData.map((threat, index) => {
            const severityColor = getSeverityColor(threat.severity);
            return (
              <div
                key={threat.name}
                className="rounded-lg border p-3 transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: APP_COLORS.surfaceSoft,
                  borderColor: APP_COLORS.border,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = APP_COLORS.primary;
                  e.currentTarget.style.backgroundColor = `${APP_COLORS.surfaceSoft}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = APP_COLORS.borderSoft;
                  e.currentTarget.style.backgroundColor = APP_COLORS.surfaceSoft;
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 
                    className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} flex-1`}
                    style={{ color: APP_COLORS.textPrimary }}
                  >
                    {threat.name}
                  </h3>
                  <Badge
                    className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-1.5 py-0.5`}
                    style={{
                      backgroundColor: `${severityColor}`,
                      color: severityColor,
                      border: `1px solid ${severityColor}`,
                    }}
                  >
                    {threat.severity.toUpperCase()}
                  </Badge>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div
                    className="rounded-md p-2 border"
                    style={{
                      backgroundColor: `${severityColor}`,
                      borderColor: `${severityColor}`,
                    }}
                  >
                    <div 
                      className={`${TYPOGRAPHY.data.md} ${TYPOGRAPHY.fontWeight.bold}`}
                      style={{ color: severityColor }}
                    >
                      {threat.count}
                    </div>
                    <div 
                      className={`${TYPOGRAPHY.caption.xs}`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Threats
                    </div>
                  </div>
                  <div
                    className="rounded-md p-2 border"
                    style={{
                      backgroundColor: `${severityColor}10`,
                      borderColor: `${severityColor}30`,
                    }}
                  >
                    <div 
                      className={`${TYPOGRAPHY.data.md} ${TYPOGRAPHY.fontWeight.bold}`}
                      style={{ color: severityColor }}
                    >
                      {threat.detectionRate.toFixed(1)}%
                    </div>
                    <div 
                      className={`${TYPOGRAPHY.caption.xs}`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Detected
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p 
                  className={`${TYPOGRAPHY.body.sm} mb-2`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  {threat.description}
                </p>

                {/* Progress Bar */}
                <div 
                  className="w-full rounded-full h-1.5 mb-2 overflow-hidden"
                  style={{ backgroundColor: `${severityColor}20` }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${threat.detectionRate}%`,
                      backgroundColor: severityColor,
                    }}
                  />
                </div>

                {/* Footer */}
                <div 
                  className="flex items-center justify-between pt-2 border-t"
                  style={{ borderColor: `${severityColor}30` }}
                >
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" style={{ color: severityColor }} />
                    <span 
                      className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`}
                      style={{ color: severityColor }}
                    >
                      {threat.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span 
                      className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                      style={{ color: severityColor }}
                    >
                      {threat.percentage}%
                    </span>
                    <span 
                      className={`${TYPOGRAPHY.caption.xs}`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      total
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
