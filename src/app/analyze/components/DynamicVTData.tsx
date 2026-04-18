'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Code, 
  Activity, 
  AlertTriangle,
  FileCode,
  Network,
  Cpu,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Radar,
  FileSearch
} from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { useState } from 'react';

interface DynamicVTDataProps {
  vtData: {
    crowdsourced_yara_results?: Array<{
      ruleset_name: string;
      rule_name: string;
      description?: string;
    }>;
    trid?: Array<{
      file_type: string;
      probability: number;
    }>;
    detectiteasy?: {
      filetype: string;
      values: Array<{
        type: string;
        name: string;
        version?: string;
      }>;
    };
    pe_info?: {
      entry_point?: number;
      imphash?: string;
      sections?: Array<{
        name: string;
        virtual_size: number;
        raw_size: number;
        entropy?: number;
      }>;
      imports?: string[];
      import_list?: Array<{
        library_name: string;
        imported_functions: string[];
      }>;
      exports?: string[];
    };
    sigma_analysis_results?: Array<{
      rule_title: string;
      rule_level: string;
      rule_description?: string;
    }>;
    sigma_analysis_stats?: {
      critical?: number;
      high?: number;
      medium?: number;
      low?: number;
    };
    crowdsourced_ids_results?: Array<{
      alert_severity: string;
      rule_msg: string;
      rule_category?: string;
      alert_context?: any;
    }>;
    crowdsourced_ids_stats?: {
      info?: number;
      high?: number;
      medium?: number;
      low?: number;
    };
  } | null;
}

export function DynamicVTData({ vtData }: DynamicVTDataProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  if (!vtData) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasYARA = vtData.crowdsourced_yara_results && vtData.crowdsourced_yara_results.length > 0;
  const hasTrID = vtData.trid && vtData.trid.length > 0;
  const hasDetectItEasy = vtData.detectiteasy && vtData.detectiteasy.values && vtData.detectiteasy.values.length > 0;
  const hasPE = vtData.pe_info && (vtData.pe_info.sections || vtData.pe_info.import_list || vtData.pe_info.imports);
  const hasSigma = vtData.sigma_analysis_results && vtData.sigma_analysis_results.length > 0;
  const hasIDS = vtData.crowdsourced_ids_results && vtData.crowdsourced_ids_results.length > 0;

  if (!hasYARA && !hasTrID && !hasDetectItEasy && !hasPE && !hasSigma && !hasIDS) return null;

  const getSeverityColor = (level: string) => {
    const l = level?.toLowerCase() || '';
    if (l === 'critical' || l === 'high') return APP_COLORS.danger;
    if (l === 'medium') return APP_COLORS.warning;
    return APP_COLORS.accentBlue;
  };

  return (
    <div className="space-y-4">
      {/* YARA Rules */}
      {hasYARA && (
        <Card 
          className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
          style={{
            backgroundColor: APP_COLORS.backgroundSoft,
            borderColor: APP_COLORS.border,
          }}
        >
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('yara')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1 rounded-md"
                  style={{
                    backgroundColor: `${APP_COLORS.dangerDarker}10`,
                    border: `1px solid ${APP_COLORS.dangerDarker}40`,
                  }}
                >
                  <Code className="h-4 w-4" style={{ color: APP_COLORS.dangerDarker }} />
                </div>
                <CardTitle 
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  YARA Rules Detected
                </CardTitle>
                <Badge
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
                  style={{
                    backgroundColor: `${APP_COLORS.dangerDarker}10`,
                    color: APP_COLORS.dangerDarker,
                    border: `1px solid ${APP_COLORS.dangerDarker}40`,
                  }}
                >
                  {vtData.crowdsourced_yara_results?.length} Rules
                </Badge>
              </div>
              {expandedSections['yara'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections['yara'] && (
            <CardContent className="pt-2 pb-3 px-4 space-y-2">
              {vtData.crowdsourced_yara_results?.map((rule, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border p-3"
                  style={{
                    backgroundColor: `${APP_COLORS.surface}`,
                    borderColor: `${APP_COLORS.border}`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileCode className="h-3.5 w-3.5" style={{ color: APP_COLORS.dangerDarker }} />
                        <span className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                          {rule.rule_name}
                        </span>
                      </div>
                      {rule.description && (
                        <p className={`${TYPOGRAPHY.caption.sm} mt-1`} style={{ color: APP_COLORS.textSecondary }}>
                          {rule.description}
                        </p>
                      )}
                      <p className={`${TYPOGRAPHY.caption.xs} mt-1`} style={{ color: APP_COLORS.textSecondary }}>
                        Ruleset: {rule.ruleset_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* TrID File Identification */}
      {hasTrID && (
        <Card 
          className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
          style={{
            backgroundColor: APP_COLORS.backgroundSoft,
            borderColor: APP_COLORS.border,
          }}
        >
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('trid')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1 rounded-md"
                  style={{
                    backgroundColor: `${APP_COLORS.backgroundSoft}`,
                    border: `1px solid ${APP_COLORS.border}`,
                  }}
                >
                  <FileSearch className="h-4 w-4" style={{ color: APP_COLORS.primary }} />
                </div>
                <CardTitle 
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  File Type Identification (TrID)
                </CardTitle>
                <Badge
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
                  style={{
                    backgroundColor: `${APP_COLORS.primary}10`,
                    color: APP_COLORS.primary,
                    border: `1px solid ${APP_COLORS.primary}40`,
                  }}
                >
                  {vtData.trid?.length} Matches
                </Badge>
              </div>
              {expandedSections['trid'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections['trid'] && (
            <CardContent className="pt-2 pb-3 px-4 space-y-2">
              {vtData.trid?.map((match, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border"
                  style={{
                    backgroundColor: `${APP_COLORS.surface}`,
                    borderColor: `${APP_COLORS.primary}40`,
                  }}
                >
                  <span className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`} style={{ color: APP_COLORS.textPrimary }}>
                    {match.file_type}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full" style={{ backgroundColor: `${APP_COLORS.accentBlue}20` }}>
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ 
                          width: `${match.probability}%`,
                          backgroundColor: APP_COLORS.primary
                        }}
                      />
                    </div>
                    <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`} style={{ color: APP_COLORS.accentBlue }}>
                      {match.probability}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

    

      {/* PE Information */}
      {hasPE && (
        <Card 
          className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
          style={{
            backgroundColor: APP_COLORS.surface,
            borderColor: `${APP_COLORS.border}40`,
          }}
        >
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('pe')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1 rounded-md"
                  style={{
                    backgroundColor: `${APP_COLORS.surface}`,
                    border: `1px solid ${APP_COLORS.primary}40`,
                  }}
                >
                  <FileCode className="h-4 w-4" style={{ color: APP_COLORS.accentIndigo }} />
                </div>
                <CardTitle 
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  PE File Structure
                </CardTitle>
              </div>
              {expandedSections['pe'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections['pe'] && (
            <CardContent className="pt-2 pb-3 px-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {vtData.pe_info?.entry_point && (
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${APP_COLORS.surface}` }}>
                    <span className={`${TYPOGRAPHY.caption.sm}`} style={{ color: APP_COLORS.textSecondary }}>Entry Point</span>
                    <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`} style={{ color: APP_COLORS.textPrimary }}>
                      0x{vtData.pe_info.entry_point.toString(16).toUpperCase()}
                    </span>
                  </div>
                )}
                {vtData.pe_info?.imphash && (
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${APP_COLORS.surface}` }}>
                    <span className={`${TYPOGRAPHY.caption.sm}`} style={{ color: APP_COLORS.textSecondary }}>Import Hash</span>
                    <span className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontFamily.mono}`} style={{ color: APP_COLORS.textPrimary }}>
                      {vtData.pe_info.imphash.substring(0, 12)}...
                    </span>
                  </div>
                )}
              </div>
              
              {vtData.pe_info?.sections && vtData.pe_info.sections.length > 0 && (
                <div>
                  <h4 className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} mb-2`} style={{ color: APP_COLORS.textSecondary }}>
                    Sections ({vtData.pe_info.sections.length})
                  </h4>
                  <div className="space-y-2">
                    {vtData.pe_info.sections.slice(0, 5).map((section, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded border"
                        style={{
                          backgroundColor: `${APP_COLORS.surface}`,
                          borderColor: `${APP_COLORS.primary}40`,
                        }}
                      >
                        <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontFamily.mono}`} style={{ color: APP_COLORS.textPrimary }}>
                          {section.name}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                            Virtual: {(section.virtual_size / 1024).toFixed(1)}KB
                          </span>
                          <span className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                            Raw: {(section.raw_size / 1024).toFixed(1)}KB
                          </span>
                          {section.entropy !== undefined && (
                            <span className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                              Entropy: {section.entropy.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vtData.pe_info?.import_list && vtData.pe_info.import_list.length > 0 && (
                <div>
                  <h4 className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} mb-2`} style={{ color: APP_COLORS.textSecondary }}>
                    Imported DLLs ({vtData.pe_info.import_list.length})
                  </h4>
                  <div className="space-y-2">
                    {vtData.pe_info.import_list.slice(0, 5).map((dll, idx) => (
                      <div
                        key={idx}
                        className="rounded border p-2"
                        style={{
                          backgroundColor: `${APP_COLORS.surface}`,
                          borderColor: `${APP_COLORS.primary}40`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                            {dll.library_name}
                          </span>
                          <Badge
                            className={`${TYPOGRAPHY.caption.xs}`}
                            style={{
                              backgroundColor: `${APP_COLORS.primary}15`,
                              color: APP_COLORS.primary,
                            }}
                          >
                            {dll.imported_functions.length} functions
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dll.imported_functions.slice(0, 6).map((func, fidx) => (
                            <span
                              key={fidx}
                              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontFamily.mono} px-1.5 py-0.5 rounded`}
                              style={{
                                backgroundColor: `${APP_COLORS.surface}`,
                                color: APP_COLORS.textSecondary,
                              }}
                            >
                              {func}
                            </span>
                          ))}
                          {dll.imported_functions.length > 6 && (
                            <span className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                              +{dll.imported_functions.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Sigma Analysis */}
      {hasSigma && (
        <Card 
          className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
          style={{
            backgroundColor: APP_COLORS.surface,
            borderColor: `${APP_COLORS.border}40`,
          }}
        >
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('sigma')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1 rounded-md"
                  style={{
                    backgroundColor: `${APP_COLORS.warning}20`,
                    border: `1px solid ${APP_COLORS.warning}40`,
                  }}
                >
                  <Activity className="h-4 w-4" style={{ color: APP_COLORS.warning }} />
                </div>
                <CardTitle 
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Sigma Rule Matches
                </CardTitle>
                {vtData.sigma_analysis_stats && (
                  <div className="flex items-center gap-1">
                    {vtData.sigma_analysis_stats.critical ? (
                      <Badge className={`${TYPOGRAPHY.caption.xs} px-1.5 py-0.5`} style={{ backgroundColor: `${APP_COLORS.danger}15`, color: APP_COLORS.danger }}>
                        {vtData.sigma_analysis_stats.critical} Critical
                      </Badge>
                    ) : null}
                    {vtData.sigma_analysis_stats.high ? (
                      <Badge className={`${TYPOGRAPHY.caption.xs} px-1.5 py-0.5`} style={{ backgroundColor: `${APP_COLORS.warning}15`, color: APP_COLORS.warning }}>
                        {vtData.sigma_analysis_stats.high} High
                      </Badge>
                    ) : null}
                  </div>
                )}
              </div>
              {expandedSections['sigma'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections['sigma'] && (
            <CardContent className="pt-2 pb-3 px-4 space-y-2">
              {vtData.sigma_analysis_results?.map((rule, idx) => {
                const severityColor = getSeverityColor(rule.rule_level);
                return (
                  <div
                    key={idx}
                    className="rounded-lg border p-3"
                    style={{
                      backgroundColor: `${severityColor}08`,
                      borderColor: `${severityColor}30`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5" style={{ color: severityColor }} />
                          <span className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                            {rule.rule_title}
                          </span>
                          <Badge
                            className={`${TYPOGRAPHY.caption.xs} px-1.5 py-0.5`}
                            style={{
                              backgroundColor: `${severityColor}20`,
                              color: severityColor,
                            }}
                          >
                            {rule.rule_level}
                          </Badge>
                        </div>
                        {rule.rule_description && (
                          <p className={`${TYPOGRAPHY.caption.sm} mt-1`} style={{ color: APP_COLORS.textSecondary }}>
                            {rule.rule_description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}

      {/* IDS Alerts */}
      {hasIDS && (
        <Card 
          className={`${CARD_STYLES.base} border transition-all hover:shadow-lg`}
          style={{
            backgroundColor: APP_COLORS.backgroundSoft,
            borderColor: `${APP_COLORS.border}` ,
          }}
        >
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('ids')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1 rounded-md"
                  style={{
                    backgroundColor: `${APP_COLORS.danger}20`,
                    border: `1px solid ${APP_COLORS.danger}40`,
                  }}
                >
                  <Radar className="h-4 w-4" style={{ color: APP_COLORS.danger }} />
                </div>
                <CardTitle 
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  IDS/IPS Alerts
                </CardTitle>
                {vtData.crowdsourced_ids_stats && (
                  <div className="flex items-center gap-1">
                    {vtData.crowdsourced_ids_stats.high ? (
                      <Badge className={`${TYPOGRAPHY.caption.xs} px-1.5 py-0.5`} style={{ backgroundColor: `${APP_COLORS.danger}15`, color: APP_COLORS.danger }}>
                        {vtData.crowdsourced_ids_stats.high} High
                      </Badge>
                    ) : null}
                    {vtData.crowdsourced_ids_stats.medium ? (
                      <Badge className={`${TYPOGRAPHY.caption.xs} px-1.5 py-0.5`} style={{ backgroundColor: `${APP_COLORS.warning}15`, color: APP_COLORS.warning }}>
                        {vtData.crowdsourced_ids_stats.medium} Medium
                      </Badge>
                    ) : null}
                  </div>
                )}
              </div>
              {expandedSections['ids'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections['ids'] && (
            <CardContent className="pt-2 pb-3 px-4 space-y-2">
              {vtData.crowdsourced_ids_results?.map((alert, idx) => {
                const severityColor = getSeverityColor(alert.alert_severity);
                return (
                  <div
                    key={idx}
                    className="rounded-lg border p-3"
                    style={{
                      backgroundColor: `${severityColor}08`,
                      borderColor: `${severityColor}30`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-3.5 w-3.5" style={{ color: severityColor }} />
                          <span className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                            {alert.rule_msg}
                          </span>
                          <Badge
                            className={`${TYPOGRAPHY.caption.xs} px-1.5 py-0.5`}
                            style={{
                              backgroundColor: `${severityColor}20`,
                              color: severityColor,
                            }}
                          >
                            {alert.alert_severity}
                          </Badge>
                        </div>
                        {alert.rule_category && (
                          <p className={`${TYPOGRAPHY.caption.xs} mt-1`} style={{ color: APP_COLORS.textSecondary }}>
                            Category: {alert.rule_category}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
