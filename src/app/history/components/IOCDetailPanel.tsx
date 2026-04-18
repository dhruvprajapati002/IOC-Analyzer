"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Shield,
  FileText,
  Activity,
  Target,
  Globe,
  Link2,
  Paperclip,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { APP_COLORS } from "@/lib/colors";
import { TYPOGRAPHY } from "@/lib/typography";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiFetch";

interface IOCDetailPanelProps {
  ioc: string;
  onClose: () => void;
}

export function IOCDetailPanel({ ioc, onClose }: IOCDetailPanelProps) {
  const { token } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(
          `/api/history-v2/${encodeURIComponent(ioc)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch IOC details");

        const result = await response.json();

        if (result.success) {
          setDetails(result.data);
        } else {
          setError(result.error || "Failed to load details");
        }
      } catch (error) {
        console.error("Failed to fetch IOC details:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [ioc, token]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Normalized accessors: some responses put geo/abuse under `reputation`
  const geo = details?.reputation?.geolocation || details?.geolocation || null;
  const abuse = details?.reputation?.abuseipdb || details?.abuseIPDB || null;
  const intel = details?.threatIntel || details?.vtData || {};

  // ✅ Convert country code to flag emoji
  const getCountryFlag = (countryCode?: string | null): string => {
    if (!countryCode) return "🌍";

    // Clean and validate country code
    const cleanCode = countryCode.trim().toUpperCase();
    if (cleanCode.length !== 2) return "🌍";

    // Check if both characters are valid letters
    if (!/^[A-Z]{2}$/.test(cleanCode)) return "🌍";

    try {
      // Convert to regional indicator symbols (flag emoji)
      const codePoints = cleanCode
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));

      return String.fromCodePoint(...codePoints);
    } catch (error) {
      console.error("Error generating flag emoji:", error);
      return "🌍";
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "malicious":
        return APP_COLORS.danger;
      case "suspicious":
        return APP_COLORS.warning;
      case "harmless":
        return APP_COLORS.success;
      default:
        return APP_COLORS.textMuted;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return APP_COLORS.danger;
      case "high":
        return APP_COLORS.danger;
      case "medium":
        return APP_COLORS.warning;
      case "low":
        return APP_COLORS.success;
      default:
        return APP_COLORS.textMuted;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "ip_search":
        return (
          <Globe className="w-4 h-4" style={{ color: APP_COLORS.primary }} />
        );
      case "domain_search":
        return (
          <Link2 className="w-4 h-4" style={{ color: APP_COLORS.success }} />
        );
      case "url_search":
        return (
          <Paperclip
            className="w-4 h-4"
            style={{ color: APP_COLORS.warning }}
          />
        );
      case "hash_search":
        return <Lock className="w-4 h-4" style={{ color: APP_COLORS.info }} />;
      case "file_analysis":
        return (
          <FileText className="w-4 h-4" style={{ color: APP_COLORS.danger }} />
        );
      default:
        return (
          <Shield className="w-4 h-4" style={{ color: APP_COLORS.textSecondary }} />
        );
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "ip_search":
        return "IP Search";
      case "domain_search":
        return "Domain Search";
      case "url_search":
        return "URL Search";
      case "hash_search":
        return "Hash Search";
      case "file_analysis":
        return "File Analysis";
      default:
        return "Manual Analysis";
    }
  };

  return (
    <>
      {/* Global Scrollbar Styles */}
      <style jsx global>{`
        .ioc-detail-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${APP_COLORS.border} transparent;
        }

        .ioc-detail-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .ioc-detail-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .ioc-detail-scroll::-webkit-scrollbar-thumb {
          background-color: ${APP_COLORS.border};
          border-radius: 4px;
        }

        .ioc-detail-scroll::-webkit-scrollbar-thumb:hover {
          background-color: ${APP_COLORS.textMuted};
        }

        .card-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${APP_COLORS.border} transparent;
        }

        .card-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .card-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .card-scroll::-webkit-scrollbar-thumb {
          background-color: ${APP_COLORS.border};
          border-radius: 3px;
        }

        .card-scroll::-webkit-scrollbar-thumb:hover {
          background-color: ${APP_COLORS.textMuted};
        }
      `}</style>

      <div
        className="h-full flex flex-col border-1 rounded-lg shadow-lg"
        style={{
          backgroundColor: APP_COLORS.backgroundSoft,
          borderColor: APP_COLORS.border,
        }}
      >
        {/* Header - Fixed */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{
            borderColor: APP_COLORS.border,
            backgroundColor: APP_COLORS.backgroundSoft,
          }}
        >
          <div className="flex-1 min-w-0">
            <h3
              className={`${TYPOGRAPHY.heading.h4} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              IOC Analysis Details
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <p
                className={`${TYPOGRAPHY.code.md} truncate`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                {ioc}
              </p>
              <button
                onClick={() => copyToClipboard(ioc)}
                className="p-2 rounded-lg transition-all flex-shrink-0"
                style={{
                  backgroundColor: copied
                    ? `${APP_COLORS.success}20`
                    : "transparent",
                }}
              >
                {copied ? (
                  <Check
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.success }}
                  />
                ) : (
                  <Copy
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.textSecondary }}
                  />
                )}
              </button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0 ml-2"
          >
            <X className="h-5 w-5" style={{ color: APP_COLORS.textSecondary }} />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto ioc-detail-scroll min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: APP_COLORS.primary }}
              />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full p-6">
              <div
                className="p-5 rounded-xl border w-full text-center"
                style={{
                  backgroundColor: `${APP_COLORS.danger}10`,
                  borderColor: `${APP_COLORS.danger}40`,
                }}
              >
                <p
                  className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.medium}`}
                  style={{ color: APP_COLORS.danger }}
                >
                  {error}
                </p>
              </div>
            </div>
          ) : details ? (
            <div className="p-6 space-y-5">
              {/* 1. VERDICT CARD */}
              <div
                className="p-6 rounded-xl border-1"
                style={{
                  backgroundColor: APP_COLORS.surface,
                  borderColor: APP_COLORS.border,
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Shield
                      className="h-5 w-5"
                      style={{ color: getVerdictColor(details.verdict) }}
                    />
                    <span
                      className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Overall Verdict
                    </span>
                  </div>
                  <span
                    className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.black} uppercase`}
                    style={{ color: getVerdictColor(details.verdict) }}
                  >
                    {details.verdict}
                  </span>
                </div>

                {/* Detection Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    {
                      value: details.stats.malicious,
                      label: "Malicious",
                      color: APP_COLORS.danger,
                    },
                    {
                      value: details.stats.suspicious,
                      label: "Suspicious",
                      color: APP_COLORS.warning,
                    },
                    {
                      value: details.stats.harmless,
                      label: "Clean",
                      color: APP_COLORS.success,
                    },
                    {
                      value: details.stats.undetected,
                      label: "Undetected",
                      color: APP_COLORS.textSecondary,
                    },
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className={`${TYPOGRAPHY.heading.h4} ${TYPOGRAPHY.fontWeight.black} tabular-nums`}
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </div>
                      <div
                        className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium} mt-1`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. FILE ANALYSIS INFO */}
              {details.metadata?.source === "file_analysis" && (
                <div
                  className="p-6 rounded-xl border-1"
                  style={{
                    backgroundColor: `${APP_COLORS.surface}`,
                    borderColor: `${APP_COLORS.border}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <FileText
                      className="h-5 w-5"
                      style={{ color: APP_COLORS.primary }}
                    />
                    <h4
                      className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                      style={{ color: APP_COLORS.primary }}
                    >
                      File Analysis
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {details.metadata.filename && (
                      <div className="flex justify-between items-center">
                        <span
                          style={{ color: APP_COLORS.textSecondary }}
                          className={`${TYPOGRAPHY.body.sm}`}
                        >
                          Filename
                        </span>
                        <span
                          style={{ color: APP_COLORS.textPrimary }}
                          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} truncate max-w-[250px]`}
                          title={details.metadata.filename}
                        >
                          {details.metadata.filename}
                        </span>
                      </div>
                    )}
                    {details.metadata.filesize && (
                      <div className="flex justify-between items-center">
                        <span
                          style={{ color: APP_COLORS.textSecondary }}
                          className={`${TYPOGRAPHY.body.sm}`}
                        >
                          File Size
                        </span>
                        <span
                          style={{ color: APP_COLORS.textPrimary }}
                          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} tabular-nums`}
                        >
                          {(details.metadata.filesize / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    )}
                    {details.metadata.filetype && (
                      <div className="flex justify-between items-center">
                        <span
                          style={{ color: APP_COLORS.textSecondary }}
                          className={`${TYPOGRAPHY.body.sm}`}
                        >
                          File Type
                        </span>
                        <span
                          style={{ color: APP_COLORS.textPrimary }}
                          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                        >
                          {details.metadata.filetype}
                        </span>
                      </div>
                    )}
                    {details.metadata.riskScore !== null &&
                      details.metadata.riskScore !== undefined && (
                        <div className="flex justify-between items-center">
                          <span
                            style={{ color: APP_COLORS.textSecondary }}
                            className={`${TYPOGRAPHY.body.sm}`}
                          >
                            Risk Score
                          </span>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-24 rounded-full overflow-hidden"
                              style={{
                                backgroundColor: `${APP_COLORS.textDim}30`,
                              }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(details.metadata.riskScore, 100)}%`,
                                  backgroundColor:
                                    details.metadata.riskScore >= 70
                                      ? APP_COLORS.danger
                                      : details.metadata.riskScore >= 40
                                        ? APP_COLORS.warning
                                        : APP_COLORS.success,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                color:
                                  details.metadata.riskScore >= 70
                                    ? APP_COLORS.danger
                                    : details.metadata.riskScore >= 40
                                      ? APP_COLORS.warning
                                      : APP_COLORS.success,
                              }}
                              className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.black} tabular-nums`}
                            >
                              {details.metadata.riskScore}%
                            </span>
                          </div>
                        </div>
                      )}
                    {details.metadata.riskLevel && (
                      <div className="flex justify-between items-center">
                        <span
                          style={{ color: APP_COLORS.textSecondary }}
                          className={`${TYPOGRAPHY.body.sm}`}
                        >
                          Risk Level
                        </span>
                        <span
                          style={{
                            color:
                              details.metadata.riskLevel === "critical" ||
                                details.metadata.riskLevel === "high"
                                ? APP_COLORS.danger
                                : details.metadata.riskLevel === "medium"
                                  ? APP_COLORS.warning
                                  : APP_COLORS.success,
                          }}
                          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.black} uppercase`}
                        >
                          {details.metadata.riskLevel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. BASIC INFO */}
              <div
                className="p-6 rounded-xl border-1"
                style={{
                  backgroundColor: APP_COLORS.surface,
                  borderColor: APP_COLORS.border,
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <FileText
                    className="h-5 w-5"
                    style={{ color: APP_COLORS.primary }}
                  />
                  <h4
                    className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Basic Information
                  </h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span
                      style={{ color: APP_COLORS.textSecondary }}
                      className={`${TYPOGRAPHY.body.sm}`}
                    >
                      Type
                    </span>
                    <span
                      style={{ color: APP_COLORS.textPrimary }}
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase`}
                    >
                      {details.type}
                    </span>
                  </div>
                  {details.metadata?.source && (
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.sm}`}
                      >
                        Source
                      </span>
                      <div className="flex items-center gap-2">
                        {getSourceIcon(details.metadata.source)}
                        <span
                          style={{ color: APP_COLORS.primary }}
                          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                        >
                          {getSourceLabel(details.metadata.source)}
                        </span>
                      </div>
                    </div>
                  )}
                  {details.label && (
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.sm}`}
                      >
                        Label
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                      >
                        {details.label}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span
                      style={{ color: APP_COLORS.textSecondary }}
                      className={`${TYPOGRAPHY.body.sm}`}
                    >
                      Analyzed
                    </span>
                    <span
                      style={{ color: APP_COLORS.textSecondary }}
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                    >
                      {new Date(details.metadata.searchedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. FILE INFO */}
              {details.fileInfo && (
                <div
                  className="p-6 rounded-xl border-1"
                  style={{
                    backgroundColor: APP_COLORS.surface,
                    borderColor: APP_COLORS.border,
                  }}
                >
                  <h4
                    className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide mb-5`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    File Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.sm}`}
                      >
                        Name
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} truncate max-w-[200px]`}
                        title={details.fileInfo.name}
                      >
                        {details.fileInfo.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.sm}`}
                      >
                        Type
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                      >
                        {details.fileInfo.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.sm}`}
                      >
                        Size
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} tabular-nums`}
                      >
                        {(details.fileInfo.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    {details.fileInfo.md5 && (
                      <div className="flex justify-between items-center">
                        <span
                          style={{ color: APP_COLORS.textSecondary }}
                          className={`${TYPOGRAPHY.body.md}`}
                        >
                          MD5
                        </span>
                        <span
                          style={{ color: APP_COLORS.textSecondary }}
                          className={`${TYPOGRAPHY.caption.sm} font-mono`}
                        >
                          {details.fileInfo.md5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. THREAT INTELLIGENCE */}
              <div
                className="p-6 rounded-xl border-1"
                style={{
                  backgroundColor: APP_COLORS.surface,
                  borderColor: APP_COLORS.border,
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <Activity
                    className="h-5 w-5"
                    style={{ color: APP_COLORS.danger }}
                  />
                  <h4
                    className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Cyber Intelligence
                  </h4>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <span
                    style={{ color: APP_COLORS.textSecondary }}
                    className={`${TYPOGRAPHY.body.md}`}
                  >
                    Severity Level
                  </span>
                  <span
                    className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase`}
                    style={{
                      color: getSeverityColor(
                        intel?.severity || details?.severity || "unknown",
                      ),
                    }}
                  >
                    {intel?.severity || details?.severity || "unknown"}
                  </span>
                </div>

                {(intel?.popularThreatLabel ||
                  intel?.popular_threat_label ||
                  intel?.popular_threat_classification) && (
                    <div className="mb-5">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.sm} block mb-2`}
                      >
                        Popular Threat
                      </span>
                      <span
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                        style={{ color: APP_COLORS.danger }}
                      >
                        {intel?.popularThreatLabel ||
                          intel?.popular_threat_label ||
                          intel?.popular_threat_classification}
                      </span>
                    </div>
                  )}

                {((intel?.threatTypes && intel.threatTypes.length > 0) ||
                  (intel?.threat_categories &&
                    intel.threat_categories.length > 0)) && (
                    <div className="mb-5">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.sm} block mb-2`}
                      >
                        Threat Categories
                      </span>
                      <div className="flex flex-wrap gap-2 card-scroll max-h-24 overflow-y-auto pr-2">
                        {(
                          intel?.threatTypes ||
                          intel?.threat_categories ||
                          []
                        ).map((type: string, idx: number) => (
                          <span
                            key={idx}
                            className={`${TYPOGRAPHY.caption.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                            style={{ color: APP_COLORS.warning }}
                          >
                            • {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {((intel?.familyLabels && intel.familyLabels.length > 0) ||
                  (intel?.family_labels && intel.family_labels.length > 0)) && (
                    <div>
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.sm} block mb-2`}
                      >
                        Malware Families
                      </span>
                      <div className="flex flex-wrap gap-2 card-scroll max-h-24 overflow-y-auto pr-2">
                        {(intel?.familyLabels || intel?.family_labels || []).map(
                          (family: string, idx: number) => (
                            <span
                              key={idx}
                              className={`${TYPOGRAPHY.caption.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                              style={{ color: APP_COLORS.danger }}
                            >
                              • {family}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* 6. ABUSE IPDB */}
              {abuse && (
                <div
                  className="p-6 rounded-xl border-1"
                  style={{
                    backgroundColor: APP_COLORS.surface,
                    borderColor: APP_COLORS.border,
                  }}
                >
                  <h4
                    className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide mb-5`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Report
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.md}`}
                      >
                        Confidence Score
                      </span>
                      <span
                        style={{
                          color:
                            (abuse.abuseConfidenceScore || 0) > 50
                              ? APP_COLORS.danger
                              : APP_COLORS.success,
                        }}
                        className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold} tabular-nums`}
                      >
                        {abuse.abuseConfidenceScore ?? "N/A"}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.md}`}
                      >
                        Total Reports
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold} tabular-nums`}
                      >
                        {abuse.totalReports ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.md}`}
                      >
                        Usage Type
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                      >
                        {abuse.usageType ?? "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.body.md}`}
                      >
                        Whitelisted
                      </span>
                      <span
                        style={{
                          color: abuse.isWhitelisted
                            ? APP_COLORS.success
                            : APP_COLORS.textMuted,
                        }}
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                      >
                        {abuse.isWhitelisted ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. GEOLOCATION - ✅ WITH FLAG */}
              {geo && (geo.countryName !== "Unknown" || geo.countryCode) && (
                <div
                  className="p-6 rounded-xl border-1"
                  style={{
                    backgroundColor: APP_COLORS.surface,
                    borderColor: APP_COLORS.border,
                  }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <Globe
                      className="h-5 w-5"
                      style={{ color: APP_COLORS.primary }}
                    />
                    <h4
                      className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      Geolocation
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* ✅ Country with FLAG */}
                    <div>
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.caption.sm} block mb-1`}
                      >
                        Country
                      </span>
                      <div className="flex items-center gap-2">
                        {/* ✅ FLAG EMOJI */}
                        <span className="text-2xl leading-none">
                          {getCountryFlag(geo?.countryCode)}
                        </span>
                        <div className="flex flex-col">
                          <span
                            style={{ color: APP_COLORS.textPrimary }}
                            className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                          >
                            {geo?.countryName || "Unknown"}
                          </span>
                          {geo?.countryCode && (
                            <span
                              className={`${TYPOGRAPHY.caption.xs}`}
                              style={{ color: APP_COLORS.textSecondary }}
                            >
                              {geo.countryCode.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.caption.sm} block mb-1`}
                      >
                        City
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                      >
                        {geo?.city || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.caption.sm} block mb-1`}
                      >
                        Region
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                      >
                        {geo?.region || "Unknown"}
                      </span>
                    </div>

                    <div>
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.caption.sm} block mb-1`}
                      >
                        ISP
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                      >
                        {geo?.isp || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.caption.sm} block mb-1`}
                      >
                        ASN
                      </span>
                      <span
                        style={{ color: APP_COLORS.textPrimary }}
                        className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold} ${TYPOGRAPHY.fontFamily.mono}`}
                      >
                        {geo?.asn || "N/A"}
                        {geo?.asnName && (
                          <span
                            className={`${TYPOGRAPHY.caption.sm} ml-2`}
                            style={{ color: APP_COLORS.textSecondary }}
                          >
                            {geo.asnName}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.caption.sm} block mb-1`}
                      >
                        Coordinates
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          style={{ color: APP_COLORS.textPrimary }}
                          className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold} ${TYPOGRAPHY.fontFamily.mono}`}
                        >
                          {typeof geo?.latitude === "number" &&
                            typeof geo?.longitude === "number"
                            ? `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`
                            : "N/A"}
                        </span>
                        <button
                          onClick={() => {
                            const mapsUrl =
                              typeof geo?.latitude === "number" &&
                                typeof geo?.longitude === "number"
                                ? `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}`
                                : `https://www.google.com/maps`;
                            window.open(mapsUrl, "_blank");
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:opacity-70"
                          style={{
                            backgroundColor: `${APP_COLORS.primary}15`,
                            color: APP_COLORS.primary,
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span
                            className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                          >
                            View Map
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. MULTI-PLATFORM THREAT INTELLIGENCE */}
              {((details.greynoiseData &&
                details.greynoiseData.classification !== "unknown") ||
                (details.ipqsData &&
                  details.ipqsData.fraudScore !== undefined) ||
                (details.threatfoxData &&
                  details.threatfoxData.threatType)) && (
                  <div
                    className="p-6 rounded-xl border-1"
                    style={{
                      backgroundColor: APP_COLORS.surface,
                      borderColor: APP_COLORS.border,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <Shield
                        className="h-5 w-5"
                        style={{ color: APP_COLORS.primary }}
                      />
                      <h4
                        className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        Multi-Platform Intelligence
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {/* GreyNoise */}
                      {details.greynoiseData && details.greynoiseData.classification !== 'unknown' && (<div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: APP_COLORS.surface }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Activity
                              className="h-4 w-4"
                              style={{ color: APP_COLORS.primary }}
                            />
                            <span
                              className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                              style={{ color: APP_COLORS.textPrimary }}
                            >
                              GreyNoise
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase`}
                            style={{
                              backgroundColor:
                                details.greynoiseData.classification ===
                                  "malicious"
                                  ? `${APP_COLORS.danger}20`
                                  : details.greynoiseData.classification ===
                                    "benign"
                                    ? `${APP_COLORS.success}20`
                                    : `${APP_COLORS.warning}20`,
                              color:
                                details.greynoiseData.classification ===
                                  "malicious"
                                  ? APP_COLORS.danger
                                  : details.greynoiseData.classification ===
                                    "benign"
                                    ? APP_COLORS.success
                                    : APP_COLORS.warning,
                            }}
                          >
                            {details.greynoiseData.classification}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span
                              style={{ color: APP_COLORS.textSecondary }}
                              className="block mb-1"
                            >
                              Noise
                            </span>
                            <span
                              style={{ color: APP_COLORS.textPrimary }}
                              className="font-medium"
                            >
                              {details.greynoiseData.noise ? "Yes" : "No"}
                            </span>
                          </div>
                          <div>
                            <span
                              style={{ color: APP_COLORS.textSecondary }}
                              className="block mb-1"
                            >
                              RIOT
                            </span>
                            <span
                              style={{ color: APP_COLORS.textPrimary }}
                              className="font-medium"
                            >
                              {details.greynoiseData.riot ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                        {details.greynoiseData.tags?.length > 0 && (
                          <div className="mt-3">
                            <span
                              style={{ color: APP_COLORS.textSecondary }}
                              className="text-xs block mb-2"
                            >
                              Tags
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {details.greynoiseData.tags.map(
                                (tag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded text-xs"
                                    style={{
                                      backgroundColor: `${APP_COLORS.primary}15`,
                                      color: APP_COLORS.primary,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      )}

                      {/* IPQualityScore */}
                      {details.ipqsData && details.ipqsData.fraudScore !== undefined && (
                        <div
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: APP_COLORS.surface }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Shield
                                className="h-4 w-4"
                                style={{ color: APP_COLORS.warning }}
                              />
                              <span
                                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                                style={{ color: APP_COLORS.textPrimary }}
                              >
                                IPQualityScore
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                style={{ color: APP_COLORS.textSecondary }}
                                className="text-xs"
                              >
                                Fraud Score
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold`}
                                style={{
                                  backgroundColor:
                                    details.ipqsData.fraudScore > 75
                                      ? `${APP_COLORS.danger}20`
                                      : details.ipqsData.fraudScore > 50
                                        ? `${APP_COLORS.warning}20`
                                        : `${APP_COLORS.success}20`,
                                  color:
                                    details.ipqsData.fraudScore > 75
                                      ? APP_COLORS.danger
                                      : details.ipqsData.fraudScore > 50
                                        ? APP_COLORS.warning
                                        : APP_COLORS.success,
                                }}
                              >
                                {details.ipqsData.fraudScore}%
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              {details.ipqsData.isVPN ? (
                                <Check
                                  className="h-4 w-4"
                                  style={{ color: APP_COLORS.danger }}
                                />
                              ) : (
                                <X
                                  className="h-4 w-4"
                                  style={{ color: APP_COLORS.textSecondary }}
                                />
                              )}
                              <span style={{ color: APP_COLORS.textPrimary }}>
                                VPN
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {details.ipqsData.isProxy ? (
                                <Check
                                  className="h-4 w-4"
                                  style={{ color: APP_COLORS.danger }}
                                />
                              ) : (
                                <X
                                  className="h-4 w-4"
                                  style={{ color: APP_COLORS.textSecondary }}
                                />
                              )}
                              <span style={{ color: APP_COLORS.textPrimary }}>
                                Proxy
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {details.ipqsData.isTor ? (
                                <Check
                                  className="h-4 w-4"
                                  style={{ color: APP_COLORS.danger }}
                                />
                              ) : (
                                <X
                                  className="h-4 w-4"
                                  style={{ color: APP_COLORS.textSecondary }}
                                />
                              )}
                              <span style={{ color: APP_COLORS.textPrimary }}>
                                Tor
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {details.ipqsData.recentAbuse ? (
                                <Check
                                  className="h-4 w-4"
                                  style={{ color: APP_COLORS.danger }}
                                />
                              ) : (
                                <X
                                  className="h-4 w-4"
                                  style={{ color: APP_COLORS.textSecondary }}
                                />
                              )}
                              <span style={{ color: APP_COLORS.textPrimary }}>
                                Recent Abuse
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ThreatFox */}
                      {details.threatfoxData && details.threatfoxData.threatType && (
                        <div
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: APP_COLORS.surface }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle
                                className="h-4 w-4"
                                style={{ color: APP_COLORS.danger }}
                              />
                              <span
                                className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                                style={{ color: APP_COLORS.textPrimary }}
                              >
                                ThreatFox
                              </span>
                            </div>
                            {details.threatfoxData.threatType && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase`}
                                style={{
                                  backgroundColor: `${APP_COLORS.danger}20`,
                                  color: APP_COLORS.danger,
                                }}
                              >
                                {details.threatfoxData.threatType}
                              </span>
                            )}
                          </div>
                          {details.threatfoxData.malwareFamilies?.length > 0 && (
                            <div>
                              <span
                                style={{ color: APP_COLORS.textSecondary }}
                                className="text-xs block mb-2"
                              >
                                Malware Families
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {details.threatfoxData.malwareFamilies.map(
                                  (family: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: `${APP_COLORS.danger}15`,
                                        color: APP_COLORS.danger,
                                      }}
                                    >
                                      {family}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* 9. MITRE ATT&CK */}
              {details.mitreAttack && (
                <div
                  className="p-6 rounded-xl border-1"
                  style={{
                    backgroundColor: APP_COLORS.surface,
                    borderColor: APP_COLORS.border,
                  }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <Target
                      className="h-5 w-5"
                      style={{ color: APP_COLORS.primary }}
                    />
                    <h4
                      className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      MITRE ATT&CK
                    </h4>
                  </div>

                  {details.mitreAttack.tactics?.length > 0 && (
                    <div className="mb-5">
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.caption.sm} block mb-3`}
                      >
                        Tactics ({details.mitreAttack.tactics.length})
                      </span>
                      <div className="space-y-2 card-scroll max-h-32 overflow-y-auto pr-2">
                        {details.mitreAttack.tactics.map(
                          (tactic: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span
                                className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} flex-shrink-0`}
                                style={{ color: APP_COLORS.primary }}
                              >
                                {tactic.id}
                              </span>
                              <span
                                className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                                style={{ color: APP_COLORS.textSecondary }}
                              >
                                {tactic.name}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {details.mitreAttack.techniques?.length > 0 && (
                    <div>
                      <span
                        style={{ color: APP_COLORS.textSecondary }}
                        className={`${TYPOGRAPHY.caption.sm} block mb-3`}
                      >
                        Techniques ({details.mitreAttack.techniques.length})
                      </span>
                      <div className="space-y-2 card-scroll max-h-40 overflow-y-auto pr-2">
                        {details.mitreAttack.techniques.map(
                          (technique: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span
                                className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} flex-shrink-0`}
                                style={{ color: APP_COLORS.primary }}
                              >
                                {technique.id}
                              </span>
                              <span
                                className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                                style={{ color: APP_COLORS.textSecondary }}
                              >
                                {technique.name}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 10. DETECTIONS */}
              {details.detections?.length > 0 && (
                <div
                  className="p-6 rounded-xl border-1"
                  style={{
                    backgroundColor: APP_COLORS.surface,
                    borderColor: APP_COLORS.border,
                  }}
                >
                  <h4
                    className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide mb-5`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Engine Detections ({details.detections.length})
                  </h4>
                  <div className="space-y-3 card-scroll max-h-64 overflow-y-auto pr-2">
                    {details.detections.map((detection: any, idx: number) => (
                      <div
                        key={idx}
                        className="pb-3 border-b last:border-0"
                        style={{ borderColor: APP_COLORS.border }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                            style={{ color: APP_COLORS.textPrimary }}
                          >
                            {detection.engine}
                          </span>
                          <span
                            className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                            style={{
                              color:
                                detection.category === "malicious"
                                  ? APP_COLORS.danger
                                  : APP_COLORS.warning,
                            }}
                          >
                            • {detection.category}
                          </span>
                        </div>
                        {detection.result && (
                          <p
                            className={`${TYPOGRAPHY.caption.sm}`}
                            style={{ color: APP_COLORS.textSecondary }}
                            title={detection.result}
                          >
                            {detection.result}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p
                className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                No details available
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
