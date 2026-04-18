// app/analyze/page.tsx
"use client";

import "@/lib/crypto-polyfill";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Clock3,
  DatabaseZap,
  Radar,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { ProtectedPage } from "@/components/ProtectedPage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/common/Logo";

import { ThreatSearchForm } from "@/app/analyze/components/ThreatSearchForm";
import { ThreatOverviewCard } from "@/app/analyze/components/cards/ThreatOverviewCard";
import { IPReputationCard } from "@/app/analyze/components/cards/IPReputationCard";
import { ThreatIntelligenceCards } from "@/app/analyze/components/cards/ThreatIntelligenceCards";
import { FileInformationCard } from "@/app/analyze/components/cards/FileInformationCard";
import { SandboxAnalysisCard } from "@/app/analyze/components/cards/SandboxAnalysisCard";
import { PopularThreatLabel } from "@/app/analyze/components/cards/PopularThreatLabel";
import { MultiSourceDataCard } from "@/app/analyze/components/cards/MultiSourceDataCard";
import { DynamicVTData } from "@/app/analyze/components/cards/DynamicVTData";
import { DetectionNamesCard } from "@/app/analyze/components/cards/DetectionNamesCard";
import { NoDataAvailable } from "@/app/analyze/components/NoDataAvailable";
import { RateLimitIndicator } from "@/app/analyze/components/RateLimitIndicator";
import { RecentSearchChips } from "@/app/analyze/components/RecentSearchChips";
import { DomainSidePanel } from "@/app/analyze/components/domain/DomainSidePanel";
import { useDomainPanel } from "@/app/analyze/hooks/useDomainPanel";
import { APP_COLORS, CHART_COLORS } from "@/lib/colors";
import { apiFetch } from "@/lib/apiFetch";

const validateHash = (value: string) => {
  const hashRegex =
    /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$|^[a-fA-F0-9]{128}$/;
  return hashRegex.test(value);
};

const validateDomain = (value: string) => {
  const domainRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(value);
};

const validateIP = (value: string) => {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex =
    /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  return ipv4Regex.test(value) || ipv6Regex.test(value);
};

const validateIOCs = (iocs: string, searchType: string) => {
  const iocList = iocs
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const invalidIOCs: string[] = [];

  for (const ioc of iocList) {
    let isValid = false;

    switch (searchType) {
      case "auto":
        isValid = true;
        break;
      case "hash":
        isValid = validateHash(ioc);
        break;
      case "domain":
        isValid = validateDomain(ioc);
        break;
      case "ip":
        isValid = validateIP(ioc);
        break;
    }

    if (!isValid) invalidIOCs.push(ioc);
  }

  return {
    isValid: invalidIOCs.length === 0,
    invalidIOCs,
    validCount: iocList.length - invalidIOCs.length,
    totalCount: iocList.length,
  };
};

const detectIOCTypeLocal = (value: string): string => {
  const candidate = value.trim();
  if (!candidate) return "unknown";
  if (validateIP(candidate)) return "ip";
  if (validateDomain(candidate)) return "domain";
  if (validateHash(candidate)) return "hash";
  return "auto";
};

interface DashboardData {
  stats: {
    totalIOCs: number;
    maliciousIOCs: number;
    cleanIOCs: number;
    pendingIOCs: number;
    detectionRate: number;
    activeAnalysts: number;
    trends: {
      totalIOCs: number;
      threatsDetected: number;
      activeAnalysts: number;
    };
  };
  weeklyTrends: Array<{
    day: string;
    threats: number;
    clean: number;
    total: number;
  }>;
  threatTypes: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  threatVectors: Array<{
    name: string;
    count: number;
    severity: string;
    detectionRate: number;
    riskLevel: string;
    color: string;
    description: string;
  }>;
}

interface ThreatOverviewResult {
  query: string;
  timestamp: Date;
  totalAnalyzed: number;
  malicious: number;
  suspicious: number;
  clean: number;
  maliciousDetections?: number;
  suspiciousDetections?: number;
  riskScore?: number;
  riskLevel?: "critical" | "high" | "medium" | "low";
  verdict?:
    | "malicious"
    | "suspicious"
    | "harmless"
    | "undetected"
    | "unknown"
    | "error";
  threatBreakdown: Array<{
    type: string;
    count: number;
    color: string;
    description?: string;
  }>;
  requestId: string;
  threatTypes?: Record<string, number>;
  ipReputation?: Array<any>;
  detections?: Array<{
    engine: string;
    category: string;
    result: string;
  }>;
}

interface FormData {
  iocs: string;
}

interface RateLimitState {
  remaining: number;
  limit: number;
  resetAt: string | null;
}

interface LastResultMeta {
  type?: string;
  error?: string;
  sources_failed?: string[];
  reputation?: any;
}

const getCountdownSeconds = (
  resetAt: string | null,
  referenceMs: number = Date.now()
): number => {
  if (!resetAt) return 0;
  const targetMs = new Date(resetAt).getTime();
  if (Number.isNaN(targetMs)) return 0;
  return Math.max(0, Math.ceil((targetMs - referenceMs) / 1000));
};

function AnalyzePageContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dashboardData] = useState<DashboardData | null>(null);
  const [loading] = useState(false);
  const [threatOverview, setThreatOverview] =
    useState<ThreatOverviewResult | null>(null);
  const [vtIntelligence, setVtIntelligence] = useState<any>(null);
  const [fileInformation, setFileInformation] = useState<any>(null);
  const [sandboxData, setSandboxData] = useState<any>(null);
  const [sandboxAnalysis, setSandboxAnalysis] = useState<any>(null);
  const [multiSourceData, setMultiSourceData] = useState<any>(null);
  const [sourcesAvailable, setSourcesAvailable] = useState<string[]>([]);
  const [sourcesFailed, setSourcesFailed] = useState<string[]>([]);
  const [currentIOC, setCurrentIOC] = useState<string>("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    remaining: 100,
    limit: 100,
    resetAt: null,
  });

  const [lastResultMeta, setLastResultMeta] =
    useState<LastResultMeta | null>(null);
  const {
    isOpen: isDomainPanelOpen,
    loading: isDomainPanelLoading,
    data: domainPanelData,
    error: domainPanelError,
    domain: domainPanelDomain,
    openPanel: openDomainPanel,
    closePanel: closeDomainPanel,
  } = useDomainPanel();

  const urlQuery = searchParams?.get('q') ?? null;

  const updateRateLimitFromHeaders = (headers: Headers) => {
    const minuteRemainingHeader = headers.get("X-RateLimit-Remaining-Minute");
    const minuteLimitHeader = headers.get("X-RateLimit-Limit-Minute");
    const minuteResetHeader = headers.get("X-RateLimit-Reset-Minute");

    const remaining = minuteRemainingHeader ?? headers.get("X-RateLimit-Remaining");
    const limit = minuteLimitHeader ?? headers.get("X-RateLimit-Limit");
    const resetAt = minuteResetHeader
      ? new Date(parseInt(minuteResetHeader, 10) * 1000).toISOString()
      : headers.get("X-RateLimit-Reset");

    if (remaining && limit && resetAt) {
      const newRateLimit = {
        remaining: parseInt(remaining),
        limit: parseInt(limit),
        resetAt: resetAt,
      };

      setRateLimit(newRateLimit);

      const percentage =
        (parseInt(remaining) / parseInt(limit)) * 100;

      if (parseInt(remaining, 10) === 0) {
        toast.error("🚫 Rate limit exceeded! Please wait for reset.", {
          duration: 8000,
        });
      } else if (percentage <= 5) {
        toast.warning(
          `⚠️ Critical: Only ${remaining} requests remaining!`,
          { duration: 6000 }
        );
      } else if (percentage <= 10) {
        toast.warning(
          `⚠️ Low quota: ${remaining} requests remaining`,
          { duration: 4000 }
        );
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    if (rateLimit.remaining === 0) {
      toast.error("Rate limit exceeded. Please wait for reset.", {
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    const requestId = crypto.randomUUID();

    try {
      const iocList = data.iocs
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (iocList.length > 0) {
        setCurrentIOC(iocList[0]);
      }
      const response = await apiFetch("/api/ioc-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
        iocs: iocList,
        label: "Threat Hunt Analysis",
       }),
      });

      updateRateLimitFromHeaders(response.headers);

      if (response.status === 429) {
        const errorData = await response.json();
        const retryAfterSeconds = Number(errorData.retryAfter || 0);
        const limitType = errorData.type === "day" ? "day" : "minute";
        const waitText =
          retryAfterSeconds > 0
            ? `${Math.ceil(retryAfterSeconds / 60)} minutes`
            : "a short time";

        toast.error(
          `🚫 Rate limit exceeded!\n\nPlease wait ${waitText} before trying again.\n\nActive limit: ${limitType}`,
          {
            duration: 10000,
            position: "top-center",
          }
        );
        setIsSubmitting(false);
        return;
      }

      if (!response.ok)
        throw new Error(`Analysis failed: ${response.status}`);

      const result = await response.json();

      if (!result.success)
        throw new Error(result.error || "Analysis failed");

      let results: any[] = [];

      if (Array.isArray(result.results)) {
        results = result.results;
      } else if (Array.isArray(result.data)) {
        results = result.data;
      } else if (result.result) {
        results = [result.result];
      } else {
        console.error("❌ Invalid response structure:", result);
        toast.error(
          "Invalid API response format. Check console for details."
        );
        setIsSubmitting(false);
        return;
      }

      if (!Array.isArray(results) || results.length === 0) {
        toast.error("No results returned from analysis");
        setIsSubmitting(false);
        return;
      }

      const firstResultRaw = results[0] || {};

      setLastResultMeta({
        type: firstResultRaw.type,
        error: firstResultRaw.error,
        sources_failed: firstResultRaw.sources_failed,
        reputation: firstResultRaw.reputation,
      });

      if (firstResultRaw.verdict === "error") {
        setThreatOverview({
          query: data.iocs,
          timestamp: new Date(),
          totalAnalyzed: 1,
          malicious: 0,
          suspicious: 0,
          clean: 0,
          threatBreakdown: [],
          requestId,
          verdict: "error",
        });

        if (
          !firstResultRaw.error?.includes("certificate") &&
          !firstResultRaw.error?.includes("network")
        ) {
          toast.error(firstResultRaw.error || "Analysis failed");
        }

        setIsSubmitting(false);
        return;
      }

      let totalMaliciousDetections = 0;
      let totalSuspiciousDetections = 0;
      let totalCleanDetections = 0;
      let totalUndetected = 0;

      let iocMalicious = 0;
      let iocSuspicious = 0;
      let iocClean = 0;
      let iocUnknown = 0;

      const threatTypeCounts: Record<string, number> = {};

      for (let i = 0; i < results.length; i++) {
        const r = results[i];

        if (r.stats) {
          totalMaliciousDetections += r.stats.malicious || 0;
          totalSuspiciousDetections += r.stats.suspicious || 0;
          totalCleanDetections += r.stats.harmless || 0;
          totalUndetected += r.stats.undetected || 0;
        }

        if (r.verdict === "malicious") iocMalicious++;
        else if (r.verdict === "suspicious") iocSuspicious++;
        else if (r.verdict === "harmless") iocClean++;
        else iocUnknown++;
      }

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (
          r.threatIntel?.threatTypes &&
          (r.verdict === "malicious" ||
            r.verdict === "suspicious")
        ) {
          const types = Array.isArray(r.threatIntel.threatTypes)
            ? r.threatIntel.threatTypes
            : [];
          for (let j = 0; j < types.length; j++) {
            const type = types[j];
            if (!threatTypeCounts[type]) threatTypeCounts[type] = 0;
            threatTypeCounts[type]++;
          }
        }
      }

      const allDetections: Array<{
        engine: string;
        category: string;
        result: string;
      }> = [];

      for (let i = 0; i < results.length; i++) {
        const r = results[i];

        if (
          r.threatIntel?.detections &&
          Array.isArray(r.threatIntel.detections) &&
          r.threatIntel.detections.length > 0
        ) {
          allDetections.push(...r.threatIntel.detections);
        } else if (
          r.vtData?.raw?.summary?.detections &&
          Array.isArray(r.vtData.raw.summary.detections)
        ) {
          allDetections.push(...r.vtData.raw.summary.detections);
        } else if (
          r.vtData?.raw?.raw?.data?.attributes
            ?.last_analysis_results
        ) {
          const laResults =
            r.vtData.raw.raw.data.attributes.last_analysis_results;
          Object.keys(laResults).forEach((engine) => {
            const engineResult = laResults[engine];
            if (
              engineResult &&
              engineResult.category &&
              (engineResult.category === "malicious" ||
                engineResult.category === "suspicious")
            ) {
              allDetections.push({
                engine: engineResult.engine_name || engine,
                category: engineResult.category,
                result: engineResult.result || "Detected",
              });
            }
          });
        }
      }

      const maliciousDetections = allDetections.filter(
        (d) => d.category === "malicious"
      );
      const suspiciousDetections = allDetections.filter(
        (d) => d.category === "suspicious"
      );

      const ipReputationData: any[] = [];
      for (let i = 0; i < results.length; i++) {
        const r = results[i];

        if (r.type === "ip" && r.reputation) {
          ipReputationData.push({
            ip: r.ioc,
            reputation: {
              riskScore: r.reputation.riskScore || r.riskScore || 0,
              verdict: r.reputation.verdict || r.verdict || "unknown",
              riskLevel:
                r.reputation.riskLevel || r.riskLevel || "low",
              confidence: r.reputation.confidence || 0.5,
              riskDetails: r.reputation.riskDetails || undefined,
            },
            geolocation: {
              countryName:
                r.reputation.geolocation?.countryName || "Unknown",
              countryCode:
                r.reputation.geolocation?.countryCode || "XX",
              city:
                r.reputation.geolocation?.city || "Unknown",
              region:
                r.reputation.geolocation?.region || "Unknown",
              isp: r.reputation.geolocation?.isp || "Unknown",
              asn: r.reputation.geolocation?.asn || "Unknown",
              asnName: r.reputation.geolocation?.asnName || "",
              latitude:
                r.reputation.geolocation?.latitude || 0,
              longitude:
                r.reputation.geolocation?.longitude || 0,
              timezone:
                r.reputation.geolocation?.timezone || "UTC",
            },
            abuseipdb: r.reputation.abuseipdb
              ? {
                  abuseConfidenceScore:
                    r.reputation.abuseipdb
                      .abuseConfidenceScore || 0,
                  usageType:
                    r.reputation.abuseipdb.usageType || "Unknown",
                  isWhitelisted:
                    r.reputation.abuseipdb.isWhitelisted || false,
                  totalReports:
                    r.reputation.abuseipdb.totalReports || 0,
                }
              : undefined,
            threats: r.reputation.intelligence
              ? {
                  categories:
                    r.reputation.intelligence.blacklists || [],
                  tags: r.reputation.intelligence.feeds || [],
                }
              : undefined,
          });
        }
      }

      let vtIntelData: any = null;
      let fileInfo: any = null;
      let sandboxInfo: any = null;

      if (results.length > 0) {
        const firstResult = results[0];

        if (firstResult.vtData) {
          const vtData = firstResult.vtData;
          const rawAttributes =
            vtData.raw?.raw?.data?.attributes || {};

          let mitreData: {
            tactics: Array<{
              id: string;
              name: string;
              description?: string;
              link?: string;
            }>;
            techniques: Array<{
              id: string;
              name: string;
              description?: string;
              link?: string;
            }>;
          } = { tactics: [], techniques: [] };

          if (firstResult.mitreAttack) {
            mitreData = {
              tactics: firstResult.mitreAttack.tactics || [],
              techniques:
                firstResult.mitreAttack.techniques || [],
            };
          }

          if (
            mitreData.tactics.length > 0 &&
            mitreData.techniques.length === 0
          ) {
            const allTechniques: any[] = [];
            mitreData.tactics.forEach((tactic: any) => {
              if (
                tactic.techniques &&
                Array.isArray(tactic.techniques)
              ) {
                tactic.techniques.forEach((tech: any) => {
                  if (
                    !allTechniques.some(
                      (t) => t.id === tech.id
                    )
                  ) {
                    allTechniques.push(tech);
                  }
                });
              }
            });
            if (allTechniques.length > 0) {
              mitreData.techniques = allTechniques;
            }
          }

          if (
            mitreData.tactics.length === 0 &&
            rawAttributes.mitre_attack_techniques
          ) {
            const mitreRaw = rawAttributes.mitre_attack_techniques;
            Object.keys(mitreRaw).forEach((source) => {
              const sourceData = mitreRaw[source];
              if (
                sourceData.tactics &&
                Array.isArray(sourceData.tactics)
              ) {
                sourceData.tactics.forEach((tactic: any) => {
                  if (
                    !mitreData.tactics.some(
                      (t: any) => t.id === tactic.id
                    )
                  ) {
                    mitreData.tactics.push({
                      id: tactic.id,
                      name: tactic.name,
                      description: tactic.description,
                      link: tactic.link,
                    });
                  }
                  if (
                    tactic.techniques &&
                    Array.isArray(tactic.techniques)
                  ) {
                    tactic.techniques.forEach(
                      (tech: any) => {
                        if (
                          !mitreData.techniques.some(
                            (t: any) => t.id === tech.id
                          )
                        ) {
                          mitreData.techniques.push({
                            id: tech.id,
                            name: tech.name,
                            description: tech.description,
                            link: tech.link,
                          });
                        }
                      }
                    );
                  }
                });
              }
            });
          }

          vtIntelData = {
            popular_threat_label:
              vtData.popular_threat_label || null,
            suggested_threat_label:
              vtData.popular_threat_classification
                ?.suggested_threat_label ||
              vtData.suggested_threat_label ||
              null,
            popular_threat_classification:
              vtData.popular_threat_classification || null,
            threat_categories: vtData.threat_categories || [],
            threat_names: vtData.threat_names || [],
            family_labels: vtData.family_labels || [],
            mitre_attack: mitreData,
            crowdsourced_ids_stats:
              rawAttributes.crowdsourced_ids_stats ||
              vtData.crowdsourced_ids_stats ||
              null,
            code_insights:
              vtData.normalized?.code_insights ||
              vtData.code_insights ||
              null,
            crowdsourced_yara_results:
              rawAttributes.crowdsourced_yara_results ||
              vtData.crowdsourced_yara_results ||
              null,
            trid: rawAttributes.trid || vtData.trid || null,
            detectiteasy:
              rawAttributes.detectiteasy ||
              vtData.detectiteasy ||
              null,
            pe_info:
              rawAttributes.pe_info || vtData.pe_info || null,
            sigma_analysis_results:
              rawAttributes.sigma_analysis_results ||
              vtData.sigma_analysis_results ||
              null,
            sigma_analysis_stats:
              rawAttributes.sigma_analysis_stats ||
              vtData.sigma_analysis_stats ||
              null,
            crowdsourced_ids_results:
              rawAttributes.crowdsourced_ids_results ||
              vtData.crowdsourced_ids_results ||
              null,
          };

          if (
            (!vtIntelData.threat_categories ||
              vtIntelData.threat_categories.length === 0) &&
            firstResult.threatIntel?.threatTypes?.length > 0
          ) {
            vtIntelData.threat_categories =
              firstResult.threatIntel.threatTypes;
          }

          if (
            (!vtIntelData.family_labels ||
              vtIntelData.family_labels.length === 0) &&
            firstResult.threatIntel?.detectionNames?.length >
              0
          ) {
            const familySet = new Set<string>();
            const detectionNames = Array.isArray(
              firstResult.threatIntel.detectionNames
            )
              ? firstResult.threatIntel.detectionNames
              : [];

            for (let i = 0; i < detectionNames.length; i++) {
              const detection = detectionNames[i];
              if (detection.result) {
                const parts = detection.result.split(
                  /[-._\/]/
                );
                if (parts.length > 0) {
                  const family = parts[0].toLowerCase();
                  if (
                    family &&
                    family.length > 2 &&
                    !["gen", "generic", "suspicious", "malware"].includes(
                      family
                    )
                  ) {
                    familySet.add(family);
                  }
                }
              }
            }

            if (familySet.size > 0) {
              vtIntelData.family_labels = Array.from(
                familySet
              ).slice(0, 6);
            } else if (
              firstResult.threatIntel?.threatTypes?.length > 0
            ) {
              vtIntelData.family_labels =
                firstResult.threatIntel.threatTypes.map(
                  (t: string) => t.toLowerCase()
                );
            }
          }

          if (!vtIntelData.popular_threat_label) {
            if (
              vtIntelData.family_labels &&
              vtIntelData.family_labels.length > 0
            ) {
              vtIntelData.popular_threat_label =
                vtIntelData.family_labels[0].toUpperCase();
            } else if (
              firstResult.threatIntel?.threatTypes?.length > 0
            ) {
              vtIntelData.popular_threat_label =
                firstResult.threatIntel.threatTypes[0];
            }
          }
        }

        if (firstResult.fileInfo) fileInfo = firstResult.fileInfo;
        if (firstResult.sandboxAnalysis)
          sandboxInfo = firstResult.sandboxAnalysis;

        if (firstResult.sandboxAnalysis) {
          setSandboxAnalysis(firstResult.sandboxAnalysis);
        }

        if (fileInfo && firstResult.vtData) {
          const rawAttributes =
            firstResult.vtData.raw?.raw?.data?.attributes ||
            {};

          fileInfo.meaningful_name =
            rawAttributes.meaningful_name ||
            firstResult.vtData.meaningful_name ||
            fileInfo.name;
          fileInfo.names =
            rawAttributes.names || firstResult.vtData.names;
          fileInfo.type_tag =
            rawAttributes.type_tag || firstResult.vtData.type_tag;
          fileInfo.type_description =
            rawAttributes.type_description ||
            firstResult.vtData.type_description;
          fileInfo.detectiteasy =
            rawAttributes.detectiteasy ||
            firstResult.vtData.detectiteasy;
        }
      }

      setVtIntelligence(vtIntelData);
      setFileInformation(fileInfo);
      setSandboxData(sandboxInfo);

      if (results.length > 0 && results[0].multiSourceData) {
        setMultiSourceData(results[0].multiSourceData);
        setSourcesAvailable(results[0].sources_available || []);
        setSourcesFailed(results[0].sources_failed || []);
      }

      const firstResult = results[0] || {};
      const unifiedRiskScore =
        firstResult.vtData?.normalized?.riskScore ||
        firstResult.vtData?.riskScore ||
        firstResult.reputation?.riskScore;
      const unifiedRiskLevel = (firstResult.vtData?.normalized
        ?.riskLevel ||
        firstResult.vtData?.riskLevel ||
        firstResult.reputation?.riskLevel) as
        | "critical"
        | "high"
        | "medium"
        | "low"
        | undefined;
      const unifiedVerdict =
        firstResult.vtData?.normalized?.verdict ||
        firstResult.vtData?.verdict ||
        firstResult.reputation?.verdict;

      const threatResult: ThreatOverviewResult = {
        query: `${iocList.length} IOCs analyzed`,
        timestamp: new Date(),
        totalAnalyzed: results.length,
        malicious: iocMalicious,
        suspicious: iocSuspicious,
        clean: iocClean,
        maliciousDetections: maliciousDetections.length,
        suspiciousDetections: suspiciousDetections.length,
        riskScore: unifiedRiskScore,
        riskLevel: unifiedRiskLevel,
        verdict: unifiedVerdict,
        threatBreakdown: [
          {
            type: "Malicious Detections",
            count: totalMaliciousDetections,
            color: CHART_COLORS.malicious,
            description: `${maliciousDetections.length} engines flagged as malicious`,
          },
          {
            type: "Suspicious Detections",
            count: totalSuspiciousDetections,
            color: CHART_COLORS.suspicious,
            description: `${totalSuspiciousDetections} engines flagged as suspicious`,
          },
          {
            type: "Clean Detections",
            count: totalCleanDetections,
            color: CHART_COLORS.clean,
            description: `${totalCleanDetections} engines flagged as clean`,
          },
          {
            type: "Undetected",
            count: totalUndetected,
            color: CHART_COLORS.unknown,
            description: `${totalUndetected} engines had no detection`,
          },
        ].filter((item) => item.count > 0),
        requestId,
        threatTypes: threatTypeCounts,
        ipReputation:
          ipReputationData.length > 0 ? ipReputationData : undefined,
        detections:
          allDetections.length > 0 ? allDetections : undefined,
      };

      setThreatOverview(threatResult);
      toast.success(
        `Analysis complete: ${iocList.length} IOC(s) processed`
      );
    } catch (error) {
      console.error("[Analyze] ❌ Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Analysis failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyze = async (value: string) => {
    await onSubmit({ iocs: value });
  };

  const rateLimitIndicatorState = {
    minuteRemaining: Math.max(0, Math.min(4, rateLimit.remaining)),
    minuteReset: rateLimit.resetAt
      ? new Date(rateLimit.resetAt).getTime()
      : Date.now() + 60_000,
    dayRemaining: Math.max(0, rateLimit.remaining),
    dayReset: rateLimit.resetAt
      ? new Date(rateLimit.resetAt).getTime()
      : Date.now() + 86_400_000,
    isLimited: rateLimit.remaining === 0,
    limitType: (rateLimit.remaining === 0 ? "minute" : null) as
      | "minute"
      | "day"
      | null,
    retryAfterSeconds: getCountdownSeconds(rateLimit.resetAt, nowMs),
    countdown: getCountdownSeconds(rateLimit.resetAt, nowMs),
  };

  useEffect(() => {
    if (!rateLimitIndicatorState.isLimited) return;

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rateLimitIndicatorState.isLimited]);

  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      onSubmit({ iocs: urlQuery.trim() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  const pieChartData =
    threatOverview?.threatBreakdown?.map((threat) => ({
      name: threat.type,
      value: threat.count,
      color: threat.color,
    })) || [];

  if (loading) return <DashboardSkeleton />;

  const maliciousDetections =
    threatOverview?.detections?.filter(
      (d) => d.category === "malicious"
    ) || [];
  const suspiciousDetections =
    threatOverview?.detections?.filter(
      (d) => d.category === "suspicious"
    ) || [];

  const maliciousDetectionCount =
    threatOverview?.threatBreakdown?.find(
      (item) => item.type === "Malicious Detections"
    )?.count || threatOverview?.maliciousDetections || maliciousDetections.length;
  const suspiciousDetectionCount =
    threatOverview?.threatBreakdown?.find(
      (item) => item.type === "Suspicious Detections"
    )?.count || threatOverview?.suspiciousDetections || suspiciousDetections.length;
  const cleanDetectionCount =
    threatOverview?.threatBreakdown?.find(
      (item) => item.type === "Clean Detections"
    )?.count || 0;
  const undetectedDetectionCount =
    threatOverview?.threatBreakdown?.find(
      (item) => item.type === "Undetected"
    )?.count || 0;

  const familyLabels = Array.isArray(vtIntelligence?.family_labels)
    ? vtIntelligence.family_labels
    : [];
  const popularThreatLabel =
    vtIntelligence?.popular_threat_label ||
    vtIntelligence?.popular_threat_classification?.suggested_threat_label ||
    null;
  const suggestedThreatLabel =
    vtIntelligence?.suggested_threat_label ||
    vtIntelligence?.popular_threat_classification?.suggested_threat_label ||
    null;

  const totalDetectionSignals =
    (threatOverview?.maliciousDetections || 0) +
    (threatOverview?.suspiciousDetections || 0);

  const normalizedRiskLevel = (() => {
    if (threatOverview?.riskLevel) return threatOverview.riskLevel;
    if (!threatOverview || threatOverview.totalAnalyzed === 0) {
      return "low" as const;
    }
    const percent =
      ((threatOverview.malicious + threatOverview.suspicious) /
        threatOverview.totalAnalyzed) *
      100;
    if (percent >= 70) return "critical" as const;
    if (percent >= 40) return "high" as const;
    if (percent >= 20) return "medium" as const;
    return "low" as const;
  })();

  const riskToneByLevel = {
    critical: APP_COLORS.danger,
    high: APP_COLORS.warning,
    medium: APP_COLORS.accentOrange,
    low: APP_COLORS.success,
  };

  const hasAnalysisResults =
    !!threatOverview && threatOverview.verdict !== "error";
  const isCurrentDomain = validateDomain(currentIOC || "");

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at 12% 14%, ${APP_COLORS.primary}20, transparent 42%), radial-gradient(circle at 88% 8%, ${APP_COLORS.accentCyan}1A, transparent 34%), linear-gradient(180deg, ${APP_COLORS.background}, ${APP_COLORS.backgroundSoft})`,
        }}
      />

      <div
        className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-480 mx-auto"
        style={{ color: APP_COLORS.textPrimary }}
      >
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-4"
          >
            <Card
              className="rounded-2xl border"
              style={{
                background: `linear-gradient(132deg, ${APP_COLORS.surface} 0%, ${APP_COLORS.backgroundSoft} 100%)`,
                borderColor: `${APP_COLORS.primary}45`,
              }}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Logo showTagline className="shrink-0" />
                      <Badge
                        className="border uppercase tracking-[0.16em] text-[10px] px-3 py-1"
                        style={{
                          color: APP_COLORS.primary,
                          borderColor: `${APP_COLORS.primary}4D`,
                          backgroundColor: `${APP_COLORS.primary}14`,
                        }}
                      >
                        Analysis Studio
                      </Badge>
                    </div>

                    <div>
                      <h1
                        className="text-2xl sm:text-3xl font-black leading-tight tracking-tight"
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        VigilanceX IOC Intelligence Console
                      </h1>
                      <p
                        className="text-sm sm:text-base mt-2 max-w-3xl"
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Run hash, domain, URL, and IP investigations with
                        unified threat verdicts, vendor detections, and
                        multi-source enrichment in one response workflow.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-67.5">
                    <div
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: `${APP_COLORS.border}`,
                        backgroundColor: `${APP_COLORS.surface}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <ScanSearch
                          className="h-3.5 w-3.5"
                          style={{ color: APP_COLORS.primary }}
                        />
                        <span
                          className="text-[10px] uppercase tracking-[0.12em] font-semibold"
                          style={{ color: APP_COLORS.textSecondary }}
                        >
                          IOCs Analyzed
                        </span>
                      </div>
                      <p
                        className="text-xl font-black mt-1"
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        {threatOverview?.totalAnalyzed ?? 0}
                      </p>
                    </div>

                    <div
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: `${APP_COLORS.border}`,
                        backgroundColor: `${APP_COLORS.surface}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Radar
                          className="h-3.5 w-3.5"
                          style={{ color: APP_COLORS.warning }}
                        />
                        <span
                          className="text-[10px] uppercase tracking-[0.12em] font-semibold"
                          style={{ color: APP_COLORS.textSecondary }}
                        >
                          Detection Signals
                        </span>
                      </div>
                      <p
                        className="text-xl font-black mt-1"
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        {totalDetectionSignals}
                      </p>
                    </div>

                    <div
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: `${APP_COLORS.border}`,
                        backgroundColor: `${APP_COLORS.surface}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck
                          className="h-3.5 w-3.5"
                          style={{
                            color: riskToneByLevel[normalizedRiskLevel],
                          }}
                        />
                        <span
                          className="text-[10px] uppercase tracking-[0.12em] font-semibold"
                          style={{ color: APP_COLORS.textSecondary }}
                        >
                          Risk Level
                        </span>
                      </div>
                      <p
                        className="text-sm font-black mt-2 uppercase tracking-wide"
                        style={{
                          color: riskToneByLevel[normalizedRiskLevel],
                        }}
                      >
                        {normalizedRiskLevel}
                      </p>
                    </div>

                    <div
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: `${APP_COLORS.border}`,
                        backgroundColor: `${APP_COLORS.surface}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <DatabaseZap
                          className="h-3.5 w-3.5"
                          style={{ color: APP_COLORS.accentBlue }}
                        />
                        <span
                          className="text-[10px] uppercase tracking-[0.12em] font-semibold"
                          style={{ color: APP_COLORS.textSecondary }}
                        >
                          Sources Online
                        </span>
                      </div>
                      <p
                        className="text-xl font-black mt-1"
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        {sourcesAvailable.length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <RateLimitIndicator
              state={rateLimitIndicatorState}
            />
          </motion.div>

          <ThreatSearchForm
            onAnalyze={handleAnalyze}
            isLoading={isSubmitting}
            disabled={rateLimitIndicatorState.isLimited}
            currentIOC={currentIOC}
          />

          <RecentSearchChips
            latestSearch={currentIOC}
            latestType={detectIOCTypeLocal(currentIOC)}
            onSelect={handleAnalyze}
          />

          {isCurrentDomain && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              style={{
                backgroundColor: `${APP_COLORS.primary}0F`,
                borderColor: `${APP_COLORS.primary}3A`,
              }}
            >
              <p className="text-sm" style={{ color: APP_COLORS.textSecondary }}>
                Domain lookup is available for
                <span className="font-semibold ml-1" style={{ color: APP_COLORS.textPrimary }}>
                  {currentIOC}
                </span>
                .
              </p>
              <button
                type="button"
                onClick={() => openDomainPanel(currentIOC)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: `${APP_COLORS.primary}66`,
                  backgroundColor: APP_COLORS.primary,
                  color: APP_COLORS.textOffWhite,
                }}
              >
                Click here to check domain lookup
              </button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!threatOverview && !isSubmitting && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="rounded-2xl border"
                  style={{
                    backgroundColor: APP_COLORS.surface,
                    borderColor: `${APP_COLORS.border}`,
                  }}
                >
                  <CardContent className="p-7 sm:p-10 text-center space-y-4">
                    <div
                      className="mx-auto h-14 w-14 rounded-2xl border flex items-center justify-center"
                      style={{
                        borderColor: `${APP_COLORS.primary}40`,
                        backgroundColor: `${APP_COLORS.primary}12`,
                      }}
                    >
                      <Activity
                        className="h-7 w-7"
                        style={{ color: APP_COLORS.primary }}
                      />
                    </div>
                    <div className="space-y-2">
                      <h2
                        className="text-xl sm:text-2xl font-black"
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        Start an IOC Investigation
                      </h2>
                      <p
                        className="text-sm max-w-xl mx-auto"
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Paste one or multiple indicators above to generate
                        your VigilanceX threat intelligence report with
                        actionable verdicts and source confidence.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {threatOverview &&
              threatOverview.verdict === "error" &&
              lastResultMeta && (
                <NoDataAvailable
                  ioc={currentIOC}
                  type={lastResultMeta.type || "unknown"}
                  error={lastResultMeta.error}
                  geolocation={
                    lastResultMeta.type === "ip" &&
                    lastResultMeta.reputation?.geolocation
                      ? lastResultMeta.reputation.geolocation
                      : undefined
                  }
                  onRetry={() => onSubmit({ iocs: currentIOC || "" })}
                />
              )}

            {hasAnalysisResults && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <Card
                  className="rounded-2xl border"
                  style={{
                    backgroundColor: APP_COLORS.surface,
                    borderColor: `${APP_COLORS.border}`,
                  }}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge
                      className="border uppercase tracking-widest"
                      style={{
                        borderColor: `${APP_COLORS.info}50`,
                        backgroundColor: `${APP_COLORS.info}16`,
                        color: APP_COLORS.info,
                      }}
                    >
                      Active Investigation
                    </Badge>
                    <Badge
                      className="border"
                      style={{
                        borderColor: `${riskToneByLevel[normalizedRiskLevel]}55`,
                        backgroundColor: `${riskToneByLevel[normalizedRiskLevel]}17`,
                        color: riskToneByLevel[normalizedRiskLevel],
                      }}
                    >
                      {normalizedRiskLevel.toUpperCase()} RISK
                    </Badge>
                    <span
                      className="text-xs sm:text-sm"
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Query:
                      <span
                        className="font-semibold ml-1"
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        {currentIOC || threatOverview?.query}
                      </span>
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-xs sm:text-sm"
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(
                        threatOverview?.timestamp || Date.now()
                      ).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {sourcesFailed.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-xs sm:text-sm"
                        style={{ color: APP_COLORS.warning }}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {sourcesFailed.length} source
                        {sourcesFailed.length > 1 ? "s" : ""} unavailable
                      </span>
                    )}
                    {isCurrentDomain && (
                      <button
                        type="button"
                        onClick={() => openDomainPanel(currentIOC)}
                        className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                        style={{
                          borderColor: `${APP_COLORS.primary}55`,
                          color: APP_COLORS.primary,
                          backgroundColor: `${APP_COLORS.primary}12`,
                        }}
                      >
                        Domain Intelligence
                      </button>
                    )}
                  </CardContent>
                </Card>

                {threatOverview?.ipReputation && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h2
                        className="text-sm sm:text-base font-black uppercase tracking-[0.14em]"
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Reputation & Geolocation
                      </h2>
                    </div>
                    <IPReputationCard
                      data={threatOverview.ipReputation}
                    />
                  </section>
                )}

                {(pieChartData.length > 0 ||
                  popularThreatLabel) && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h2
                        className="text-sm sm:text-base font-black uppercase tracking-[0.14em]"
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Executive Threat Snapshot
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {pieChartData.length > 0 && (
                        <div
                          className={
                            vtIntelligence?.popular_threat_label
                              ? "xl:col-span-2"
                              : "xl:col-span-3"
                          }
                        >
                          <ThreatOverviewCard
                            totalAnalyzed={threatOverview.totalAnalyzed}
                            maliciousDetections={maliciousDetectionCount}
                            suspiciousDetections={suspiciousDetectionCount}
                            cleanDetections={cleanDetectionCount}
                            undetectedDetections={undetectedDetectionCount}
                            riskLevel={
                              (threatOverview.riskLevel || normalizedRiskLevel) as
                                | "critical"
                                | "high"
                                | "medium"
                                | "low"
                                | "unknown"
                            }
                            timestamp={new Date(
                              threatOverview.timestamp
                            ).toISOString()}
                          />
                        </div>
                      )}

                      {popularThreatLabel && (
                        <div className="xl:col-span-1">
                          <PopularThreatLabel
                            label={popularThreatLabel}
                            suggestedLabel={suggestedThreatLabel}
                            maliciousCount={maliciousDetections.length}
                            suspiciousCount={suspiciousDetections.length}
                            verdict={
                              threatOverview.verdict === "error"
                                ? "unknown"
                                : threatOverview.verdict
                            }
                          />
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {(vtIntelligence || threatOverview?.detections?.length) && (
                  <section className="space-y-3">
                    <h2
                      className="text-sm sm:text-base font-black uppercase tracking-[0.14em]"
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Threat Intelligence Detail
                    </h2>
                    <ThreatIntelligenceCards
                      familyLabels={familyLabels}
                    />
                    <DetectionNamesCard
                      detections={threatOverview?.detections || []}
                    />
                    <DynamicVTData
                      vtData={vtIntelligence}
                      detections={threatOverview?.detections || []}
                    />
                  </section>
                )}

                {(fileInformation || sandboxAnalysis) && (
                  <section className="space-y-3">
                    <h2
                      className="text-sm sm:text-base font-black uppercase tracking-[0.14em]"
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Artifact & Sandbox Insights
                    </h2>
                    <div className="space-y-4">
                      {fileInformation && (
                        <FileInformationCard fileInfo={fileInformation} />
                      )}
                      {sandboxAnalysis && (
                        <SandboxAnalysisCard
                          sandboxAnalysis={sandboxAnalysis}
                        />
                      )}
                    </div>
                  </section>
                )}

                {multiSourceData && (
                  <section className="space-y-3">
                    <h2
                      className="text-sm sm:text-base font-black uppercase tracking-[0.14em]"
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Cross-Source Correlation
                    </h2>
                    <MultiSourceDataCard
                      multiSourceData={multiSourceData}
                    />
                  </section>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DomainSidePanel
        isOpen={isDomainPanelOpen}
        loading={isDomainPanelLoading}
        error={domainPanelError}
        domain={domainPanelDomain}
        data={domainPanelData}
        onClose={closeDomainPanel}
      />
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <ProtectedPage>
      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyzePageContent />
      </Suspense>
    </ProtectedPage>
  );
}
