'use client';
'use client';

import React from 'react';  // ✅ Add this

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Layers,
  Tag,
  Activity,
  Crosshair,
  Lightbulb,
  Zap,
  FileText,
  Database,
  ExternalLink
} from 'lucide-react';
import {
  APP_COLORS,
  CARD_STYLES,
  INTEL_CARD_COLORS,
} from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface ThreatIntelligenceCardsProps {
  vtData: {
    popular_threat_label?: string;
    threat_categories?: string[];
    threat_names?: string[];
    family_labels?: string[];
    mitre_attack?: {
      tactics?: Array<{ 
        id: string; 
        name: string; 
        description?: string;  // ✅ Added
        link?: string;         // ✅ Added
      }>;
      techniques?: Array<{ 
        id: string; 
        name: string; 
        description?: string;  // ✅ Added
        link?: string;         // ✅ Added
      }>;
    };
    crowdsourced_ids_stats?: {
      info?: number;
      high?: number;
      medium?: number;
      low?: number;
    };
    code_insights?: {
      verdict?: string;
      tags?: string[];
      capabilities?: string[];
      analysis?: string;
    };
  } | null;
  threatOverview?: {
    malicious: number;
    suspicious: number;
    clean: number;
    totalAnalyzed: number;
  } | null;
  detections?: Array<{
    engine: string;
    category: string;
    result: string;
  }>;
}


// Expandable MITRE Item Component
function MitreItem({
  id,
  name,
  description,
  link,
  color,
}: {
  id: string;
  name: string;
  description?: string;
  link?: string;
  color: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className="rounded border-0 transition-all duration-200"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}30`,
      }}
    >
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between gap-3 p-3 cursor-pointer"
        style={{
          backgroundColor: isExpanded ? `${color}12` : 'transparent',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* ID Badge */}
          <div
            className="px-2 py-1 border rounded flex-shrink-0"
            style={{
              backgroundColor: `${color}15`,
              borderColor: `${color}40`,
            }}
          >
            <span
              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.black}`}
              style={{ color }}
            >
              {id}
            </span>
          </div>

          {/* Name */}
          <span
            className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} truncate`}
            style={{ color }}
          >
            {name}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* External Link Button */}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded border transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${color}25`;
                e.currentTarget.style.borderColor = `${color}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${color}15`;
                e.currentTarget.style.borderColor = `${color}40`;
              }}
            >
              <ExternalLink
                className="h-3.5 w-3.5"
                style={{ color }}
              />
            </a>
          )}

          {/* Expand/Collapse Icon */}
          {description && (
            <div
              className="p-1 rounded transition-transform duration-200"
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Description */}
      {description && isExpanded && (
        <div
          className="px-3 pb-3 pt-1 border-t animate-in slide-in-from-top-2 duration-200"
          style={{
            borderColor: `${color}20`,
          }}
        >
          <p
            className={`${TYPOGRAPHY.caption.md} ${TYPOGRAPHY.fontWeight.medium} leading-relaxed`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            {description}
          </p>
        </div>
      )}
    </div>
  );
}



export function ThreatIntelligenceCards({
  vtData,
  threatOverview,
  detections,
}: ThreatIntelligenceCardsProps) {
  if (!vtData) return null;

  const hasPopularThreat =
    vtData.popular_threat_label &&
    vtData.popular_threat_label !== 'unknown' &&
    vtData.popular_threat_label !== '';
  const hasThreatCategories =
    vtData.threat_categories && vtData.threat_categories.length > 0;
  const hasFamilyLabels =
    vtData.family_labels && vtData.family_labels.length > 0;
  const hasThreatNames =
    vtData.threat_names && vtData.threat_names.length > 0;
  const hasDetections = detections && detections.length > 0;
  const hasMitreAttack =
    vtData.mitre_attack &&
    ((vtData.mitre_attack.tactics?.length ?? 0) > 0 ||
      (vtData.mitre_attack.techniques?.length ?? 0) > 0);
  const hasCodeInsights =
    vtData.code_insights &&
    (vtData.code_insights.verdict ||
      vtData.code_insights.tags?.length ||
      vtData.code_insights.capabilities?.length);

  const row1CardsCount = [
    hasDetections,
    hasThreatCategories,
    hasFamilyLabels || hasThreatNames,
  ].filter(Boolean).length;

  const row1GridClass =
    row1CardsCount === 3
      ? 'lg:grid-cols-3'
      : row1CardsCount === 2
        ? 'lg:grid-cols-2'
        : 'lg:grid-cols-1';

  const shouldRender =
    hasPopularThreat ||
    hasThreatCategories ||
    hasFamilyLabels ||
    hasMitreAttack ||
    hasThreatNames ||
    hasCodeInsights ||
    hasDetections;

  if (!shouldRender) return null;

  const maliciousDetections =
    detections?.filter(d => d.category === 'malicious') || [];
  const suspiciousDetections =
    detections?.filter(d => d.category === 'suspicious') || [];

  const totalMaliciousEngines = maliciousDetections.length;
  const totalSuspiciousEngines = suspiciousDetections.length;
  const totalThreatDetections = totalMaliciousEngines + totalSuspiciousEngines;

  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className={`grid grid-cols-1 ${row1GridClass} gap-6`}>
        {/* Engine Detections */}
        {hasDetections && (
          <Card
            className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
            style={{
              backgroundColor: APP_COLORS.backgroundSoft,
              borderColor: APP_COLORS.border,
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5">
                <div
                  className="p-1.5 rounded-lg border"
                  style={{
                    backgroundColor: `${APP_COLORS.backgroundSoft}`,
                    borderColor: `${APP_COLORS.danger}30`,
                  }}
                >
                  <Database
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.danger }}
                  />
                </div>
                <span
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Engine Detections
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="max-h-[350px] overflow-y-auto pr-2 space-y-2 scrollbar-thin"
                style={{
                  scrollbarColor: `${APP_COLORS.surface}`,
                }}
              >
                {maliciousDetections.map((detection, idx) => (
                    <div
                      key={`${detection.engine}-${idx}`}
                      className="rounded-lg p-2.5 border-0 transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        backgroundColor: `${APP_COLORS.backgroundSoft}`,
                        borderColor: `${APP_COLORS.danger}30`,
                      }}
                      onMouseEnter={e =>
                        (e.currentTarget.style.borderColor = `${APP_COLORS.danger}60`)
                      }
                      onMouseLeave={e =>
                        (e.currentTarget.style.borderColor = `${APP_COLORS.danger}30`)
                      }
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="flex items-center justify-center min-w-[28px] h-7 rounded-md flex-shrink-0 "
                          style={{
                            backgroundColor: `${APP_COLORS.backgroundSoft}`,
                            // borderColor: `${APP_COLORS.danger}40`,
                          }}
                        >
                          <span
                            className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.black}`}
                            style={{ color: APP_COLORS.danger }}
                          >
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} mb-1 break-words`}
                            style={{ color: APP_COLORS.danger }}
                          >
                            {detection.result}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-1.5 h-1.5 rounded-full animate-pulse"
                              style={{ backgroundColor: APP_COLORS.danger }}
                            />
                            <span
                              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
                              style={{ color: APP_COLORS.textSecondary }}
                            >
                              {detection.engine}
                            </span>
                          </div>
                        </div>
                        <Shield
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: `${APP_COLORS.danger}60` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: `${APP_COLORS.danger}30` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Total Detections
                  </span>
                  <span
                    className={`${TYPOGRAPHY.data.lg} ${TYPOGRAPHY.fontWeight.black}`}
                    style={{ color: APP_COLORS.danger }}
                  >
                    {maliciousDetections.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Threat Categories */}
        {hasThreatCategories && (
          <Card
            className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
            style={{
              backgroundColor: APP_COLORS.backgroundSoft,
              borderColor: APP_COLORS.border,
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5">
                <div
                  className="p-1.5 rounded-lg border"
                  style={{
                    backgroundColor: `${APP_COLORS.warning}15`,
                    borderColor: `${APP_COLORS.warning}30`,
                  }}
                >
                  <Layers
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.warning }}
                  />
                </div>
                <span
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Threat Categories
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="max-h-[350px] overflow-y-auto pr-2 space-y-2 scrollbar-thin"
                style={{
                  scrollbarColor: ` ${APP_COLORS.surface}`,
                }}
              >
                {vtData.threat_categories?.map((category, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-2.5  transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      backgroundColor: `${APP_COLORS.backgroundSoft}`,
                      borderColor: `${APP_COLORS.border}30`,
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.borderColor = `${APP_COLORS.warning}60`)
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.borderColor = `${APP_COLORS.warning}30`)
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 "
                        style={{
                          backgroundColor: `${APP_COLORS.backgroundSoft}`,
                          borderColor: `${APP_COLORS.warning}40`,
                        }}
                      >
                        <span
                          className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.black}`}
                          style={{ color: APP_COLORS.warning }}
                        >
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div
                          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                          style={{ color: APP_COLORS.warning }}
                        >
                          {category}
                        </div>
                      </div>
                      <Tag
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: `${APP_COLORS.warning}60` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: `${APP_COLORS.warning}30` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Total Categories
                  </span>
                  <span
                    className={`${TYPOGRAPHY.data.lg} ${TYPOGRAPHY.fontWeight.black}`}
                    style={{ color: APP_COLORS.warning }}
                  >
                    {vtData.threat_categories?.length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Family Labels */}
        {hasFamilyLabels && (
          <Card
            className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
            style={{
              backgroundColor: APP_COLORS.backgroundSoft,
              borderColor: APP_COLORS.border,
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5">
                <div
                  className="p-1.5 rounded-lg border"
                  style={{
                    backgroundColor: `${APP_COLORS.backgroundSoft}`,
                    borderColor: `${APP_COLORS.dangerLight}40`,
                  }}
                >
                  <Shield
                    className="h-4 w-4"
                    
                    style={{ 
                      color: APP_COLORS.dangerLight,
                      borderColor: `${APP_COLORS.dangerLight}40`,

                     }}
                  />
                </div>
                <span
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Malware Family
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {vtData.family_labels?.map((family, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg px-2.5 py-2  transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: `${APP_COLORS.backgroundSoft}`,
                      borderColor: `${APP_COLORS.accentIndigo}30`,
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.borderColor = `${APP_COLORS.dangerLight}`)
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.borderColor = `${APP_COLORS.dangerLight}`)
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                        style={{ backgroundColor: APP_COLORS.dangerLight }}
                      />
                      <span
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide truncate`}
                        style={{ color: APP_COLORS.dangerLight }}
                      >
                        {family}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Threat Names fallback */}
        {!hasFamilyLabels && hasThreatNames && (
          <Card
            className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
            style={{
              backgroundColor: APP_COLORS.backgroundSoft,
              borderColor: APP_COLORS.border,
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5">
                <div
                  className="p-1.5 rounded-lg border"
                  style={{
                    backgroundColor: `${APP_COLORS.backgroundSoft}`,
                    borderColor: `${APP_COLORS.primary}40`,
                  }}
                >
                  <Shield
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.primary }}
                  />
                </div>
                <span
                  className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Threat Names
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {vtData.threat_names?.slice(0, 10).map((name, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg px-2.5 py-2 border transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      backgroundColor: `${APP_COLORS.warningDark}10`,
                      borderColor: `${APP_COLORS.warningDark}30`,
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.borderColor = `${APP_COLORS.warningDark}`)
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.borderColor = `${APP_COLORS.warningDark}30`)
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                        style={{ backgroundColor: APP_COLORS.warningDark }}
                      />
                      <code
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium} ${TYPOGRAPHY.fontFamily.mono} break-all`}
                        style={{ color: APP_COLORS.warningDark }}
                      >
                        {name}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
              {(vtData.threat_names?.length ?? 0) > 10 && (
                <div
                  className={`text-center ${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} pt-2`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  +{(vtData.threat_names?.length ?? 0) - 10} more threat signatures
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* MITRE ATT&CK - Compact Expandable Design */}
{hasMitreAttack && (
  <Card 
    className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
    style={{
      backgroundColor: APP_COLORS.backgroundSoft,
      borderColor: APP_COLORS.border,
    }}
  >
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2.5">
        <div
          className="p-1.5 rounded-lg border"
          style={{
            backgroundColor: `${APP_COLORS.warningOrange}10`,
            borderColor: `${APP_COLORS.warningOrange}30`,
          }}
        >
          <Crosshair
            className="h-4 w-4"
            style={{ color: APP_COLORS.warningOrange }}
          />
        </div>
        <span 
          className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
          style={{ color: APP_COLORS.textPrimary }}
        >
          MITRE ATT&CK Framework
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Tactics Section */}
      {vtData.mitre_attack?.tactics && vtData.mitre_attack.tactics.length > 0 && (
        <div>
          <div
            className="flex items-center gap-2 mb-3 pb-2 border-b"
            style={{ borderColor: `${APP_COLORS.surface}` }}
          >
            <Activity
              className="h-4 w-4"
              style={{ color: APP_COLORS.warningDark }}
            />
            <span
              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.black} uppercase tracking-wider`}
              style={{ color: APP_COLORS.warningOrange }}
            >
              TACTICS ({vtData.mitre_attack.tactics.length})
            </span>
          </div>
          <div className="space-y-2">
            {vtData.mitre_attack.tactics.map((tactic: any, idx: number) => (
              <MitreItem
                key={`tactic-${idx}`}
                id={tactic.id}
                name={tactic.name}
                description={tactic.description}
                link={tactic.link}
                color={APP_COLORS.accentBlue}
              />
            ))}
          </div>
        </div>
      )}

      {/* Techniques Section */}
      {vtData.mitre_attack?.techniques && vtData.mitre_attack.techniques.length > 0 && (
        <div>
          <div
            className="flex items-center gap-2 mb-3 pb-2 border-b"
            style={{ borderColor: `${APP_COLORS.warningDark}30` }}
          >
            <FileText
              className="h-4 w-4"
              style={{ color: APP_COLORS.warningDark }}
            />
            <span
              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.black} uppercase tracking-wider`}
              style={{ color: APP_COLORS.warningDark }}
            >
              TECHNIQUES ({vtData.mitre_attack.techniques.length})
            </span>
          </div>
          <div className="space-y-2">
            {vtData.mitre_attack.techniques.map((technique: any, idx: number) => (
              <MitreItem
                key={`technique-${idx}`}
                id={technique.id}
                name={technique.name}
                description={technique.description}
                link={technique.link}
                color={APP_COLORS.warningDark}
              />
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)}



      {/* Code Insights */}
      {hasCodeInsights && vtData.code_insights && (
        <Card
          className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
          style={{
            backgroundColor: APP_COLORS.backgroundSoft,
            borderColor: APP_COLORS.border,
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <div
                className="p-1.5 rounded-lg border"
                style={{
                  backgroundColor: `${APP_COLORS.success}15`,
                  borderColor: `${APP_COLORS.success}30`,
                }}
              >
                <FileText
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.success }}
                />
              </div>
              <span
                className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Code Insights
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {vtData.code_insights.verdict && (
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    backgroundColor: `${APP_COLORS.success}10`,
                    borderColor: `${APP_COLORS.success}30`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield
                      className="h-4 w-4"
                      style={{ color: APP_COLORS.success }}
                    />
                    <span
                      className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Verdict
                    </span>
                  </div>
                  <div
                    className={`${TYPOGRAPHY.data.lg} ${TYPOGRAPHY.fontWeight.black} uppercase`}
                    style={{ color: APP_COLORS.success }}
                  >
                    {vtData.code_insights.verdict}
                  </div>
                </div>
              )}

              {vtData.code_insights.tags &&
                vtData.code_insights.tags.length > 0 && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      backgroundColor: `${APP_COLORS.success}10`,
                      borderColor: `${APP_COLORS.success}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Tag
                        className="h-4 w-4"
                        style={{ color: APP_COLORS.success }}
                      />
                      <span
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Tags
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {vtData.code_insights.tags.slice(0, 5).map((tag, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 border rounded-full"
                          style={{
                            backgroundColor: `${APP_COLORS.success}20`,
                            borderColor: `${APP_COLORS.success}40`,
                          }}
                        >
                          <span
                            className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`}
                            style={{ color: APP_COLORS.success }}
                          >
                            {tag}
                          </span>
                        </div>
                      ))}
                      {vtData.code_insights.tags.length > 5 && (
                        <div
                          className="px-2 py-1 border rounded-full"
                          style={{
                            backgroundColor: `${APP_COLORS.success}20`,
                            borderColor: `${APP_COLORS.success}40`,
                          }}
                        >
                          <span
                            className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`}
                            style={{ color: APP_COLORS.success }}
                          >
                            +{vtData.code_insights.tags.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {vtData.code_insights.capabilities &&
                vtData.code_insights.capabilities.length > 0 && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      backgroundColor: `${APP_COLORS.success}10`,
                      borderColor: `${APP_COLORS.success}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap
                        className="h-4 w-4"
                        style={{ color: APP_COLORS.success }}
                      />
                      <span
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Capabilities
                      </span>
                    </div>
                    <div className="space-y-1">
                      {vtData.code_insights.capabilities
                        .slice(0, 4)
                        .map((capability, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 ${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
                            style={{ color: APP_COLORS.success }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: APP_COLORS.success }}
                            />
                            <span>{capability}</span>
                          </div>
                        ))}
                      {vtData.code_insights.capabilities.length > 4 && (
                        <div
                          className={`flex items-center gap-2 ${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} pt-1`}
                          style={{ color: APP_COLORS.success }}
                        >
                          <span>
                            +{vtData.code_insights.capabilities.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {vtData.code_insights?.analysis && (
              <div
                className="mt-4 rounded-lg p-3 border"
                style={{
                  backgroundColor: `${APP_COLORS.success}10`,
                  borderColor: `${APP_COLORS.success}30`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.success }}
                  />
                  <span
                    className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Analysis Summary
                  </span>
                </div>
                <p
                  className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} leading-relaxed`}
                  style={{ color: APP_COLORS.success }}
                >
                  {vtData.code_insights.analysis}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
