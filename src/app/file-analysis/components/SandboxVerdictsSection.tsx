'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { Badge } from '@/components/ui/badge';

interface SandboxVerdictsSectionProps {
  sandboxVerdicts: Record<string, {
    category: string;
    sandbox_name: string;
    confidence?: number;
    malware_classification?: string[];
    malware_names?: string[];
  }>;
}

export function SandboxVerdictsSection({ sandboxVerdicts }: SandboxVerdictsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sandboxVerdicts || Object.keys(sandboxVerdicts).length === 0) return null;

  const getVerdictColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'malicious':
        return APP_COLORS.danger;
      case 'suspicious':
        return APP_COLORS.warning;
      case 'harmless':
      case 'clean':
        return APP_COLORS.success;
      case 'undetected':
        return APP_COLORS.info;
      default:
        return APP_COLORS.textMuted;
    }
  };

  const getVerdictIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'malicious':
        return XCircle;
      case 'suspicious':
        return AlertTriangle;
      case 'harmless':
      case 'clean':
        return CheckCircle2;
      default:
        return Shield;
    }
  };

  const verdicts = Object.entries(sandboxVerdicts);
  const displayVerdicts = expanded ? verdicts : verdicts.slice(0, 3);

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
              style={{ backgroundColor: `${APP_COLORS.accentPurple}20` }}
            >
              <Shield className="h-5 w-5" style={{ color: APP_COLORS.accentPurple }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Sandbox Analysis
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.sm}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                {verdicts.length} sandbox{verdicts.length !== 1 ? 'es' : ''} analyzed
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {displayVerdicts.map(([sandboxName, verdict]) => {
            const verdictColor = getVerdictColor(verdict.category);
            const VerdictIcon = getVerdictIcon(verdict.category);

            return (
              <div
                key={sandboxName}
                className="rounded-lg border p-4 transition-all duration-200"
                style={{
                  borderColor: `${verdictColor}30`,
                  backgroundColor: `${verdictColor}05`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded-md"
                      style={{
                        backgroundColor: `${verdictColor}20`,
                      }}
                    >
                      <VerdictIcon
                        className="h-4 w-4"
                        style={{ color: verdictColor }}
                      />
                    </div>
                    <span 
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {sandboxName}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${verdictColor}20`,
                      color: verdictColor,
                    }}
                  >
                    {verdict.category.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {verdict.confidence !== undefined && (
                    <div className="flex items-start gap-2">
                      <span
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[100px]`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Confidence:
                      </span>
                      <span
                        className={`${TYPOGRAPHY.body.sm}`}
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        {verdict.confidence}%
                      </span>
                    </div>
                  )}

                  {verdict.malware_classification && verdict.malware_classification.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[100px]`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Classification:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {verdict.malware_classification.map((classification, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={TYPOGRAPHY.caption.xs}
                            style={{
                              backgroundColor: `${APP_COLORS.danger}15`,
                              color: APP_COLORS.danger,
                            }}
                          >
                            {classification}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {verdict.malware_names && verdict.malware_names.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[100px]`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Detected:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {verdict.malware_names.slice(0, 3).map((name, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={TYPOGRAPHY.caption.xs}
                            style={{
                              backgroundColor: `${APP_COLORS.warning}15`,
                              color: APP_COLORS.warning,
                            }}
                          >
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {verdicts.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors"
            style={{
              color: APP_COLORS.textSecondary,
              backgroundColor: APP_COLORS.backgroundSoft,
            }}
          >
            <span className={TYPOGRAPHY.body.sm}>
              {expanded ? 'Show Less' : `Show ${verdicts.length - 3} More`}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
