// app/analyze/page.tsx
"use client";

import "@/lib/crypto-polyfill";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { ProtectedPage } from "@/components/ProtectedPage";

import { ThreatSearchForm } from "@/app/analyze/components/ThreatSearchForm";
import { ThreatOverviewCard } from "@/app/analyze/components/ThreatOverviewCard";
import { IPReputationCard } from "@/app/analyze/components/IPReputationCard";
import { ThreatIntelligenceCards } from "@/app/analyze/components/ThreatIntelligenceCards";
import { FileInformationCard } from "@/app/analyze/components/FileInformationCard";
import { SandboxAnalysisCard } from "@/app/analyze/components/SandboxAnalysisCard";
import { PopularThreatLabel } from "@/app/analyze/components/PopularThreatLabel";
import { MultiSourceDataCard } from "@/app/analyze/components/MultiSourceDataCard";
import { DynamicVTData } from "@/app/analyze/components/DynamicVTData";
import { NoDataAvailable } from "@/app/analyze/components/NoDataAvailable";
import { FEATURES } from "@/lib/features";
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

  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    remaining: 100,
    limit: 100,
    resetAt: null,
  });

  const [lastResultMeta, setLastResultMeta] =
    useState<LastResultMeta | null>(null);

  const urlQuery = searchParams?.get('q') ?? null;

  const updateRateLimitFromHeaders = (headers: Headers) => {
    const remaining = headers.get("X-RateLimit-Remaining");
    const limit = headers.get("X-RateLimit-Limit");
    const resetAt = headers.get("X-RateLimit-Reset");

    if (remaining && limit) {
      const newRateLimit = {
        remaining: parseInt(remaining),
        limit: parseInt(limit),
        resetAt: resetAt,
      };

      setRateLimit(newRateLimit);

      const percentage =
        (parseInt(remaining) / parseInt(limit)) * 100;

      if (parseInt(remaining) === 0) {
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
        const resetDate = errorData.resetAt
          ? new Date(errorData.resetAt)
          : null;
        const minutesUntilReset = resetDate
          ? Math.ceil(
              (resetDate.getTime() - Date.now()) / 60000
            )
          : 0;

        toast.error(
          `🚫 Rate limit exceeded!\n\nPlease wait ${minutesUntilReset} minutes before trying again.\n\nLimit: ${
            errorData.maxRequests || 100
          } requests/hour`,
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

  return (
    <div
      className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1920px] mx-auto"
      style={{
        color: APP_COLORS.textPrimary,
      }}
    >
      <div className="space-y-6">
        <ThreatSearchForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting || rateLimit.remaining === 0}
          validateIOCs={validateIOCs}
          currentIOC={currentIOC}
          showShareButton={
            FEATURES.SHARE_IOC_PUBLIC &&
            !!threatOverview &&
            !!currentIOC
          }
          onMenuClick={undefined}
        />

        <AnimatePresence mode="wait">
          {!threatOverview && !isSubmitting && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Empty state */}
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
                onRetry={() =>
                  onSubmit({ iocs: currentIOC || "" })
                }
              />
            )}

          {threatOverview &&
            threatOverview.verdict !== "error" && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {threatOverview.ipReputation && (
                  <IPReputationCard
                    ipReputation={threatOverview.ipReputation}
                  />
                )}

                {(pieChartData.length > 0 ||
                  vtIntelligence?.popular_threat_label) && (
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
                          threatOverview={threatOverview}
                          overviewLoading={false}
                          pieChartData={pieChartData}
                        />
                      </div>
                    )}

                    {vtIntelligence?.popular_threat_label && (
                      <div className="xl:col-span-1">
                        <PopularThreatLabel
                          label={vtIntelligence.popular_threat_label}
                          suggestedLabel={
                            vtIntelligence.suggested_threat_label
                          }
                          popularClassification={
                            vtIntelligence.popular_threat_classification
                          }
                          threatStats={{
                            totalDetections:
                              maliciousDetections.length +
                              suspiciousDetections.length,
                            maliciousEngines:
                              maliciousDetections.length,
                            suspiciousEngines:
                              suspiciousDetections.length,
                          }}
                          riskScore={threatOverview.riskScore}
                          riskLevel={threatOverview.riskLevel}
                          verdict={threatOverview.verdict}
                        />
                      </div>
                    )}
                  </div>
                )}

                <ThreatIntelligenceCards
                  vtData={vtIntelligence}
                  threatOverview={threatOverview}
                  detections={threatOverview?.detections}
                />

                <DynamicVTData vtData={vtIntelligence} />

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

                {multiSourceData && (
                  <MultiSourceDataCard
                    multiSourceData={multiSourceData}
                    sources_available={sourcesAvailable}
                    sources_failed={sourcesFailed}
                  />
                )}
              </motion.div>
            )}
        </AnimatePresence>
      </div>
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
