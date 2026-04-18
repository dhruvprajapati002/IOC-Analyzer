'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Database, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { Badge } from '@/components/ui/badge';

interface MultiSourceIntelligenceSectionProps {
  threatfoxData?: {
    available: boolean;
    verdict: string;
    score: number;
    threat_type?: string;
    malware_families?: string[];
    confidence_level?: number;
    first_seen?: string;
    tags?: string[];
  };
  malwarebazaarData?: {
    available: boolean;
    verdict: string;
    score: number;
    signature?: string;
    file_type?: string;
    file_name?: string;
    file_size?: number;
    first_seen?: string;
    tags?: string[];
    malware_families?: string[];
  };
}

export function MultiSourceIntelligenceSection({ 
  threatfoxData, 
  malwarebazaarData 
}: MultiSourceIntelligenceSectionProps) {
  // Check if we have any multi-source data
  const hasThreatFox = threatfoxData?.available && threatfoxData.verdict !== 'unknown';
  const hasMalwareBazaar = malwarebazaarData?.available && malwarebazaarData.verdict !== 'unknown';

  if (!hasThreatFox && !hasMalwareBazaar) return null;

  const getVerdictColor = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'malicious':
        return APP_COLORS.danger;
      case 'suspicious':
        return APP_COLORS.warning;
      case 'clean':
      case 'harmless':
        return APP_COLORS.success;
      default:
        return APP_COLORS.textMuted;
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'malicious':
        return XCircle;
      case 'suspicious':
        return AlertTriangle;
      case 'clean':
      case 'harmless':
        return CheckCircle2;
      default:
        return Shield;
    }
  };

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
            style={{ backgroundColor: `${APP_COLORS.primary}20` }}
          >
            <Database className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
          </div>
          <div>
            <h3 
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Multi-Source Intelligence
            </h3>
            <p 
              className={`${TYPOGRAPHY.caption.sm}`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              Additional cyber intelligence sources
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* ThreatFox Section */}
          {hasThreatFox && (
            <div
              className="rounded-lg border p-4 transition-all duration-200"
              style={{
                borderColor: `${getVerdictColor(threatfoxData.verdict)}30`,
                backgroundColor: `${getVerdictColor(threatfoxData.verdict)}05`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="p-1.5 rounded-md"
                  style={{
                    backgroundColor: `${getVerdictColor(threatfoxData.verdict)}20`,
                  }}
                >
                  <Database
                    className="h-4 w-4"
                    style={{ color: getVerdictColor(threatfoxData.verdict) }}
                  />
                </div>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${getVerdictColor(threatfoxData.verdict)}20`,
                    color: getVerdictColor(threatfoxData.verdict),
                  }}
                >
                  {(() => {
                    const VerdictIcon = getVerdictIcon(threatfoxData.verdict);
                    return (
                      <div className="flex items-center gap-1">
                        <VerdictIcon className="h-3 w-3" />
                        {threatfoxData.verdict.toUpperCase()}
                      </div>
                    );
                  })()}
                </Badge>
              </div>

              <div className="space-y-2">
                {threatfoxData.threat_type && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Threat Type:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.body.sm}`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {threatfoxData.threat_type}
                    </span>
                  </div>
                )}
                
                {threatfoxData.malware_families && threatfoxData.malware_families.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Malware Family:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {threatfoxData.malware_families.slice(0, 3).map((family, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className={TYPOGRAPHY.caption.xs}
                          style={{
                            backgroundColor: `${APP_COLORS.danger}15`,
                            color: APP_COLORS.danger,
                          }}
                        >
                          {family}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {threatfoxData.confidence_level !== undefined && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Confidence:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.body.sm}`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {threatfoxData.confidence_level}%
                    </span>
                  </div>
                )}

                {threatfoxData.first_seen && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      First Seen:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.body.sm}`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {new Date(threatfoxData.first_seen).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {threatfoxData.tags && threatfoxData.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {threatfoxData.tags.slice(0, 5).map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className={TYPOGRAPHY.caption.xs}
                          style={{
                            backgroundColor: `${APP_COLORS.info}15`,
                            color: APP_COLORS.info,
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MalwareBazaar Section */}
          {hasMalwareBazaar && (
            <div
              className="rounded-lg border p-4 transition-all duration-200"
              style={{
                borderColor: `${getVerdictColor(malwarebazaarData.verdict)}30`,
                backgroundColor: `${getVerdictColor(malwarebazaarData.verdict)}05`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="p-1.5 rounded-md"
                  style={{
                    backgroundColor: `${getVerdictColor(malwarebazaarData.verdict)}20`,
                  }}
                >
                  <Shield
                    className="h-4 w-4"
                    style={{ color: getVerdictColor(malwarebazaarData.verdict) }}
                  />
                </div>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${getVerdictColor(malwarebazaarData.verdict)}20`,
                    color: getVerdictColor(malwarebazaarData.verdict),
                  }}
                >
                  {(() => {
                    const VerdictIcon = getVerdictIcon(malwarebazaarData.verdict);
                    return (
                      <div className="flex items-center gap-1">
                        <VerdictIcon className="h-3 w-3" />
                        {malwarebazaarData.verdict.toUpperCase()}
                      </div>
                    );
                  })()}
                </Badge>
              </div>

              <div className="space-y-2">
                {malwarebazaarData.signature && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Signature:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                      style={{ color: APP_COLORS.danger }}
                    >
                      {malwarebazaarData.signature}
                    </span>
                  </div>
                )}

                {malwarebazaarData.file_type && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      File Type:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.body.sm}`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {malwarebazaarData.file_type}
                    </span>
                  </div>
                )}

                {malwarebazaarData.file_size && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      File Size:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.body.sm}`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {(malwarebazaarData.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}

                {malwarebazaarData.malware_families && malwarebazaarData.malware_families.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Families:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {malwarebazaarData.malware_families.slice(0, 3).map((family, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className={TYPOGRAPHY.caption.xs}
                          style={{
                            backgroundColor: `${APP_COLORS.danger}15`,
                            color: APP_COLORS.danger,
                          }}
                        >
                          {family}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {malwarebazaarData.first_seen && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      First Seen:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.body.sm}`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {new Date(malwarebazaarData.first_seen).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {malwarebazaarData.tags && malwarebazaarData.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} min-w-[120px]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {malwarebazaarData.tags.slice(0, 5).map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className={TYPOGRAPHY.caption.xs}
                          style={{
                            backgroundColor: `${APP_COLORS.info}15`,
                            color: APP_COLORS.info,
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
