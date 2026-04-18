"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { APP_COLORS } from "@/lib/colors";
import { TYPOGRAPHY } from "@/lib/typography";
import { FileAnalysisResult } from "./types";
import { FileInformationSection } from "./FileInformationSection";
// import { SecurityVerdictSection } from "./SecurityVerdictSection";
import { FileHashesSection } from "./FileHashesSection";
import { VendorDetectionsSection } from "./VendorDetectionsSection";
import { FileMetadataSection } from "./FileMetadataSection";
import { ThreatCategoriesSection } from "./ThreatCategoriesSection";
import { MalwareFamilySection } from "./MalwareFamilySection";
import { MitreAttackSection } from "./MitreAttackSection";
import { ThreatOverviewSection } from "./ThreatOverviewSection";
import { YaraAnalysisSection } from "./YaraAnalysisSection";
import { ThreatPatternsSection } from "./ThreatPatternsSection";
import { ThreatIndicatorsSection } from "./ThreatIndicatorsSection";
import { MultiSourceIntelligenceSection } from "./MultiSourceIntelligenceSection";
import { AnalysisStatsSection } from "./AnalysisStatsSection";
import { SandboxVerdictsSection } from "./SandboxVerdictsSection";
import { FileHistorySection } from "./FileHistorySection";
import { TechnicalDetailsSection } from "./TechnicalDetailsSection";

interface FileAnalysisOverviewProps {
  result: FileAnalysisResult;
}

// ✅ Helper function to parse nested MITRE ATT&CK data from v2 API
function parseMitreAttack(mitreRaw: any) {
  if (!mitreRaw || typeof mitreRaw !== "object") return null;

  const allTactics: any[] = [];
  const allTechniques: any[] = [];

  // Iterate through each sandbox (CAPE Sandbox, Zenbox, Zenbox Linux, etc.)
  Object.values(mitreRaw).forEach((sandbox: any) => {
    if (sandbox?.tactics && Array.isArray(sandbox.tactics)) {
      sandbox.tactics.forEach((tactic: any) => {
        // Add tactic to list
        allTactics.push({
          id: tactic.id,
          name: tactic.name,
          description: tactic.description,
          link: tactic.link,
        });

        // Extract techniques nested inside each tactic
        if (tactic.techniques && Array.isArray(tactic.techniques)) {
          tactic.techniques.forEach((technique: any) => {
            allTechniques.push({
              id: technique.id,
              name: technique.name,
              description: technique.description,
              link: technique.link,
            });
          });
        }
      });
    }
  });

  // Remove duplicates based on ID
  const uniqueTactics = Array.from(
    new Map(allTactics.map((t) => [t.id, t])).values()
  );
  const uniqueTechniques = Array.from(
    new Map(allTechniques.map((t) => [t.id, t])).values()
  );

  if (uniqueTactics.length === 0 && uniqueTechniques.length === 0) {
    return null;
  }

  return {
    tactics: uniqueTactics,
    techniques: uniqueTechniques,
  };
}

export function FileAnalysisOverview({ result }: FileAnalysisOverviewProps) {
  // ✅ Extract data with fallbacks for v2 API format
  const fileInfo = result.fileInfo;
  const metadata = result.metadata;
  const hashes = result.hashes || {
    md5: fileInfo?.md5 || "",
    sha1: fileInfo?.sha1 || "",
    sha256: fileInfo?.sha256 || result.ioc || "",
  };

  // ✅ Detections from threatIntel (cleaned structure)
  const vtDetections = result.threatIntel?.detections || [];
  const vendorConfidence = result.vendorConfidence || 0;

  // ✅ VT data for threat labels
  const vtData = result.vtData || {};
  const threatCategories = vtData.threat_categories || [];
  const familyLabels = vtData.family_labels || [];

  // ✅ Parse MITRE ATT&CK data from vtIntelligence
  const vtIntelligence = result.vtIntelligence || {};
  const mitreAttack = parseMitreAttack(vtIntelligence.mitre_attack);

  const cached = result.cached || false;
  const analysisTime = result.timestamp
    ? new Date(result.timestamp).toLocaleString()
    : "N/A";

  // ✅ Determine verdict - prioritize risk score over verdict field if mismatch
  const getEffectiveVerdict = () => {
    const riskScore = result.riskScore || 0;
    const verdict = result.verdict?.toLowerCase() || 'unknown';
    
    // If risk score suggests higher severity than verdict, use risk score
    if (riskScore >= 70 && (verdict === 'harmless' || verdict === 'clean' || verdict === 'unknown' || verdict === 'suspicious')) {
      return 'malicious';
    } else if (riskScore >= 35 && (verdict === 'harmless' || verdict === 'clean' || verdict === 'unknown')) {
      return 'suspicious';
    } else if (riskScore >= 15 && (verdict === 'harmless' || verdict === 'clean')) {
      return 'unknown';
    }
    
    // Map 'clean' to 'harmless'
    return verdict === 'clean' ? 'harmless' : verdict;
  };

  const effectiveVerdict = getEffectiveVerdict();

  const getVerdictColor = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case "malicious":
        return APP_COLORS.danger;
      case "suspicious":
        return APP_COLORS.warning;
      case "harmless":
      case "clean":
        return APP_COLORS.success;
      default:
        return APP_COLORS.textMuted;
    }
  };

  const verdictColor = getVerdictColor(effectiveVerdict);

  // ✅ Check if optional sections have data
  const hasYaraAnalysis =
    result.yaraAnalysis && result.yaraAnalysis.totalMatches > 0;
  const hasPatterns = result.patterns && result.patterns.length > 0;
  const hasIndicators = result.indicators && result.indicators.length > 0;
  const hasMultiSource = 
    (result.threatfoxData?.available && result.threatfoxData.verdict !== 'unknown') ||
    (result.malwarebazaarData?.available && result.malwarebazaarData.verdict !== 'unknown');
  
  // ✅ NEW: Check for VT-specific data
  const hasAnalysisStats = vtData.last_analysis_stats && Object.keys(vtData.last_analysis_stats).length > 0;
  const hasSandboxVerdicts = vtData.sandbox_verdicts && Object.keys(vtData.sandbox_verdicts).length > 0;
  const hasFileHistory = (vtData.meaningful_name || (vtData.names && vtData.names.length > 0));
  const hasTechnicalDetails = vtData.detectiteasy || vtData.elf_info || vtData.trid;

  return (
    <div className="space-y-6">
      {/* ✅ Analysis Result Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{
              backgroundColor: `${verdictColor}20`,
              border: `2px solid ${verdictColor}40`,
            }}
          >
            {effectiveVerdict === "malicious" ? (
              <AlertTriangle
                className="h-6 w-6"
                style={{ color: verdictColor }}
              />
            ) : effectiveVerdict === "suspicious" ? (
              <Shield className="h-6 w-6" style={{ color: verdictColor }} />
            ) : (
              <CheckCircle2
                className="h-6 w-6"
                style={{ color: verdictColor }}
              />
            )}
          </div>
          <div>
            <h2
              className={TYPOGRAPHY.heading.h2}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Analysis Results
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${verdictColor}20`,
                  color: verdictColor,
                }}
              >
                {effectiveVerdict?.toUpperCase() || "UNKNOWN"}
              </Badge>
              <span
                className={`${TYPOGRAPHY.caption.sm}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                • {analysisTime}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result.riskScore !== undefined && (
            <Badge
              variant="secondary"
              className={`${TYPOGRAPHY.label.sm}`}
              style={{
                backgroundColor: `${verdictColor}15`,
                color: verdictColor,
              }}
            >
              Risk Score: {result.riskScore}/100
            </Badge>
          )}

          {cached && (
            <Badge
              variant="secondary"
              className={`${TYPOGRAPHY.label.sm} flex items-center gap-1.5`}
              style={{
                backgroundColor: `${APP_COLORS.info}20`,
                color: APP_COLORS.info,
              }}
            >
              <Database className="h-3.5 w-3.5" />
              Cached
            </Badge>
          )}
        </div>
      </div>

      {/* ROW 1: File Information + Threat Overview + File Hashes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fileInfo && <FileInformationSection result={result} />}
        <ThreatOverviewSection threatOverview={result.threatOverview} />
        <FileHashesSection hashes={hashes} />
      </div>

      {/* ROW 2: File Metadata (if available) */}
      {metadata && <FileMetadataSection metadata={metadata} />}

      {/* ROW 3: Vendor Detections (full width) */}
      {vtDetections && vtDetections.length > 0 && (
        <VendorDetectionsSection
          detections={vtDetections}
          vendorConfidence={vendorConfidence}
        />
      )}

      {/* ✅ NEW ROW: Analysis Stats (last_analysis_stats) */}
      {hasAnalysisStats && (
        <AnalysisStatsSection stats={vtData.last_analysis_stats!} />
      )}

      {/* ✅ NEW ROW: Sandbox Verdicts */}
      {hasSandboxVerdicts && (
        <SandboxVerdictsSection sandboxVerdicts={vtData.sandbox_verdicts!} />
      )}

      {/* ✅ NEW ROW: File History (names array + meaningful_name) */}
      {hasFileHistory && (
        <FileHistorySection 
          meaningfulName={vtData.meaningful_name}
          names={vtData.names}
          size={vtData.size}
        />
      )}

      {/* ROW 4: Threat Categories + Malware Family (dynamic grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {threatCategories.length > 0 && (
          <ThreatCategoriesSection categories={threatCategories} />
        )}
        {familyLabels.length > 0 && (
          <MalwareFamilySection families={familyLabels} />
        )}
      </div>

      {/* ROW 5: YARA Analysis (full width if available) */}
      {hasYaraAnalysis && (
        <YaraAnalysisSection yaraAnalysis={result.yaraAnalysis!} />
      )}

      {/* ROW 6: Multi-Source Intelligence (full width) */}
      {hasMultiSource && (
        <MultiSourceIntelligenceSection 
          threatfoxData={result.threatfoxData}
          malwarebazaarData={result.malwarebazaarData}
        />
      )}

      {/* ROW 7: Threat Patterns + Indicators (dynamic grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hasPatterns && <ThreatPatternsSection patterns={result.patterns!} />}
        {hasIndicators && (
          <ThreatIndicatorsSection indicators={result.indicators!} />
        )}
      </div>

      {/* ✅ NEW ROW: Technical Details (detectiteasy, elf_info, trid) */}
      {hasTechnicalDetails && (
        <TechnicalDetailsSection 
          detectiteasy={vtData.detectiteasy}
          elfInfo={vtData.elf_info}
          trid={vtData.trid}
        />
      )}

      {/* ROW 8: MITRE ATT&CK */}
      {mitreAttack && <MitreAttackSection mitreData={mitreAttack} />}
    </div>
  );
}
