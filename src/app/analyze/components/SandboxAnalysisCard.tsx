'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface SandboxAnalysisCardProps {
  sandboxAnalysis: {
    verdicts?: Array<{
      sandbox: string;
      verdict: string;
      malware_classification?: string[];
      confidence?: number;
      sandbox_name?: string;
    }>;
    summary?: {
      malicious: number;
      suspicious: number;
      clean: number;
      total: number;
    };
  } | null;
}

export function SandboxAnalysisCard({ sandboxAnalysis }: SandboxAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sandboxAnalysis || !sandboxAnalysis.verdicts || sandboxAnalysis.verdicts.length === 0) {
    return null;
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'malicious':
        return <XCircle className="h-4 w-4" style={{ color: APP_COLORS.danger }} />;
      case 'suspicious':
        return <HelpCircle className="h-4 w-4" style={{ color: APP_COLORS.warning }} />;
      case 'clean':
      case 'undetected':
        return <CheckCircle className="h-4 w-4" style={{ color: APP_COLORS.success }} />;
      default:
        return <HelpCircle className="h-4 w-4" style={{ color: APP_COLORS.textSecondary }} />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'malicious':
        return APP_COLORS.danger;
      case 'suspicious':
        return APP_COLORS.warning;
      case 'clean':
      case 'undetected':
        return APP_COLORS.success;
      default:
        return APP_COLORS.textMuted;
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
      <CardContent className="p-0">
        {/* Horizontal Summary Bar - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${APP_COLORS.backgroundSoft}`,
                border: `1px solid ${APP_COLORS.border}`,
              }}
            >
              <TestTube className="h-4 w-4" style={{ color: APP_COLORS.accentCyan }} />
            </div>
            <div className="text-left">
              <div className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                Sandbox Analysis
              </div>
              <div className={`${TYPOGRAPHY.body.sm}`} style={{ color: APP_COLORS.textSecondary }}>
                Click to view detailed results
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Summary Stats as Horizontal Badges */}
            {sandboxAnalysis.summary && (
              <div className="flex items-center gap-2">
                <Badge
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-3 py-1`}
                  style={{
                    backgroundColor: `${APP_COLORS.accentCyan}10`,
                    color: APP_COLORS.accentCyan,
                    border: `1px solid ${APP_COLORS.accentBlue}`,
                  }}
                >
                  {sandboxAnalysis.summary.total} Total
                </Badge>
                <Badge
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-3 py-1`}
                  style={{
                    backgroundColor: `${APP_COLORS.danger}10`,
                    color: APP_COLORS.danger,
                    border: `1px solid ${APP_COLORS.danger}`,
                  }}
                >
                  {sandboxAnalysis.summary.malicious} Malicious
                </Badge>
                <Badge
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-3 py-1`}
                  style={{
                    backgroundColor: `${APP_COLORS.warning}10`,
                    color: APP_COLORS.warning,
                    border: `1px solid ${APP_COLORS.warning}`,
                  }}
                >
                  {sandboxAnalysis.summary.suspicious} Suspicious
                </Badge>
                <Badge
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-3 py-1`}
                  style={{
                    backgroundColor: `${APP_COLORS.success}10`,
                    color: APP_COLORS.success,
                    border: `1px solid ${APP_COLORS.success}`,
                  }}
                >
                  {sandboxAnalysis.summary.clean} Clean
                </Badge>
              </div>
            )}

            {/* Expand/Collapse Icon */}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" style={{ color: APP_COLORS.textSecondary }} />
            ) : (
              <ChevronDown className="h-5 w-5" style={{ color: APP_COLORS.textSecondary }} />
            )}
          </div>
        </button>

        {/* Expandable Sandbox Verdicts */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 space-y-2 border-t" style={{ borderColor: APP_COLORS.borderSoft }}>
            {sandboxAnalysis.verdicts.map((result, idx) => {
            const verdictColor = getVerdictColor(result.verdict);
            const VerdictIcon = getVerdictIcon(result.verdict);
            
            return (
              <div
                key={idx}
                className="rounded-lg border  p-3 transition-all duration-200"
                style={{
                  backgroundColor: APP_COLORS.surface,
                  borderColor: APP_COLORS.border,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {VerdictIcon}
                    <span className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                      {result.sandbox_name || result.sandbox}
                    </span>
                  </div>
                  <Badge
                    className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
                    style={{
                      backgroundColor: `${verdictColor}10`,
                      color: verdictColor,
                      border: `1px solid ${verdictColor}40`,
                    }}
                  >
                    {result.verdict.toUpperCase()}
                  </Badge>
                </div>
                
                {result.malware_classification && result.malware_classification.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.malware_classification.map((classification, cidx) => (
                      <span
                        key={cidx}
                        className={`${TYPOGRAPHY.caption.xs} px-2 py-0.5 rounded`}
                        style={{
                          backgroundColor: `${APP_COLORS.textMuted}10`,
                          color: APP_COLORS.textSecondary,
                        }}
                      >
                        {classification}
                      </span>
                    ))}
                  </div>
                )}

                {result.confidence !== undefined && result.confidence > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                        Confidence
                      </span>
                      <span className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                        {(result.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: `${verdictColor}20` }}
                    >
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${result.confidence * 100}%`,
                          backgroundColor: verdictColor,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
