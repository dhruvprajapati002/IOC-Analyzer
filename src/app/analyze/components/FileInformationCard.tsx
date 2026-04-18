"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Hash,
  Calendar,
  Database,
  Package,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { APP_COLORS, CARD_STYLES } from "@/lib/colors";
import { TYPOGRAPHY } from "@/lib/typography";

interface FileInformationCardProps {
  fileInfo: {
    name?: string;
    size?: number;
    type?: string;
    md5?: string;
    sha1?: string;
    sha256?: string;
    firstSeen?: string;
    lastAnalysis?: string;
    uploadDate?: string;
    meaningful_name?: string;
    names?: string[];
    type_tag?: string;
    type_description?: string;
    detectiteasy?: {
      filetype?: string;
      values?: Array<{
        type: string;
        name: string;
        version?: string;
        info?: string;
      }>;
    };
  } | null;
}

export function FileInformationCard({ fileInfo }: FileInformationCardProps) {
  const [showHashes, setShowHashes] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [showDetections, setShowDetections] = useState(false);

  if (!fileInfo) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg border"
            style={{
              backgroundColor: `${APP_COLORS.backgroundSoft}15`,
              borderColor: `${APP_COLORS.border}30`,
            }}
          >
            <FileText
              className="h-4 w-4"
              style={{ color: APP_COLORS.primary }}
            />
          </div>
          <CardTitle
            className={`${TYPOGRAPHY.heading.h3}`}
            style={{ color: APP_COLORS.textPrimary }}
          >
            File Information
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        {/* Main File Info - Always Visible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* File Name */}
          {(fileInfo.meaningful_name || fileInfo.name) && (
            <div
              className="rounded-lg p-3 border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: `${APP_COLORS.surface}`,
                borderColor: `${APP_COLORS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.primary }}
                />
                <span
                  className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  File Name
                </span>
              </div>
              <p
                className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textPrimary }}
                title={fileInfo.meaningful_name || fileInfo.name}
              >
                {fileInfo.meaningful_name || fileInfo.name}
              </p>
            </div>
          )}

          {/* File Type */}
          {(fileInfo.type_tag ||
            fileInfo.type_description ||
            fileInfo.type) && (
            <div
              className="rounded-lg p-3 border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: `${APP_COLORS.surface}`,
                borderColor: `${APP_COLORS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Package
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.primary }}
                />
                <span
                  className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  File Type
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {fileInfo.type_tag && (
                  <Badge
                    className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} px-2 py-1`}
                    style={{
                      backgroundColor: `${APP_COLORS.primarySoft}10`,
                      color: APP_COLORS.primarySoft,
                      border: `1px solid ${APP_COLORS.primarySoft}40`,
                    }}
                  >
                    {fileInfo.type_tag.toUpperCase()}
                  </Badge>
                )}
                {(fileInfo.type_description || fileInfo.type) && (
                  <span
                    className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                    style={{ color: APP_COLORS.textPrimary }}
                  >
                    {fileInfo.type_description || fileInfo.type}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* File Size */}
          {fileInfo.size !== undefined && (
            <div
              className="rounded-lg p-3 border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: `${APP_COLORS.surface}`,
                borderColor: `${APP_COLORS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.primary }}
                />
                <span
                  className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  File Size
                </span>
              </div>
              <p
                className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {formatBytes(fileInfo.size)}
              </p>
            </div>
          )}

          {/* First Seen */}
          {fileInfo.firstSeen && (
            <div
              className="rounded-lg p-3 border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: `${APP_COLORS.surface}`,
                borderColor: `${APP_COLORS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.primary }}
                />
                <span
                  className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  First Seen
                </span>
              </div>
              <p
                className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {fileInfo.firstSeen}
              </p>
            </div>
          )}

          {/* Last Analysis */}
          {fileInfo.lastAnalysis && (
            <div
              className="rounded-lg p-3 border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: `${APP_COLORS.surface}`,
                borderColor: `${APP_COLORS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.primary }}
                />
                <span
                  className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  Last Analysis
                </span>
              </div>
              <p
                className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {fileInfo.lastAnalysis}
              </p>
            </div>
          )}

          {/* Upload Date */}
          {fileInfo.uploadDate && (
            <div
              className="rounded-lg p-3 border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: `${APP_COLORS.surface}`,
                borderColor: `${APP_COLORS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.primary }}
                />
                <span
                  className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  Upload Date
                </span>
              </div>
              <p
                className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {fileInfo.uploadDate}
              </p>
            </div>
          )}
        </div>

        {/* Expandable: Cryptographic Hashes */}
        {(fileInfo.md5 || fileInfo.sha1 || fileInfo.sha256) && (
          <div
            className="rounded-lg border transition-all duration-200"
            style={{
              backgroundColor: `${APP_COLORS.surface}`,
              borderColor: APP_COLORS.border,
            }}
          >
            <button
              onClick={() => setShowHashes(!showHashes)}
              className="w-full p-3 flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Hash
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.primary }}
                />
                <span
                  className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Cryptographic Hashes
                </span>
                <Badge
                  className={`${TYPOGRAPHY.label.md} px-2 py-0.5`}
                  style={{
                    backgroundColor: `${APP_COLORS.primary}10`,
                    color: APP_COLORS.primary,
                    border: `1px solid ${APP_COLORS.primary}40`,
                  }}
                >
                  {
                    [fileInfo.md5, fileInfo.sha1, fileInfo.sha256].filter(
                      Boolean
                    ).length
                  }
                </Badge>
              </div>
              {showHashes ? (
                <ChevronUp
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.textSecondary }}
                />
              ) : (
                <ChevronDown
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.textSecondary }}
                />
              )}
            </button>

            {showHashes && (
              <div className="px-3 pb-3 space-y-2">
                {fileInfo.md5 && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      backgroundColor: `${APP_COLORS.surface}`,
                      borderColor: `${APP_COLORS.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        MD5
                      </span>
                      <Badge
                        className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
                        style={{
                          backgroundColor: `${APP_COLORS.primary}10`,
                          color: APP_COLORS.primary,
                          border: `1px solid ${APP_COLORS.primary}40`,
                        }}
                      >
                        128-bit
                      </Badge>
                    </div>
                    <div
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontFamily.mono} break-all`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {fileInfo.md5}
                    </div>
                  </div>
                )}

                {fileInfo.sha1 && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      backgroundColor: `${APP_COLORS.surface}`,
                      borderColor: `${APP_COLORS.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        SHA-1
                      </span>
                      <Badge
                        className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
                        style={{
                          backgroundColor: `${APP_COLORS.primary}10`,
                          color: APP_COLORS.primary,
                          border: `1px solid ${APP_COLORS.primary}40`,
                        }}
                      >
                        160-bit
                      </Badge>
                    </div>
                    <div
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontFamily.mono} break-all`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {fileInfo.sha1}
                    </div>
                  </div>
                )}

                {fileInfo.sha256 && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      backgroundColor: `${APP_COLORS.surface}`,
                      borderColor: `${APP_COLORS.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        SHA-256
                      </span>
                      <Badge
                        className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
                        style={{
                          backgroundColor: `${APP_COLORS.primary}10`,
                          color: APP_COLORS.primary,
                          border: `1px solid ${APP_COLORS.primary}40`,
                        }}
                      >
                        256-bit (Recommended)
                      </Badge>
                    </div>
                    <div
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontFamily.mono} break-all`}
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      {fileInfo.sha256}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expandable: Known File Names */}
        {fileInfo.names && fileInfo.names.length > 0 && (
          <div
            className="rounded-lg border transition-all duration-200"
            style={{
              backgroundColor: `${APP_COLORS.surface}`,
              borderColor: APP_COLORS.border,
            }}
          >
            <button
              onClick={() => setShowNames(!showNames)}
              className="w-full p-3 flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <FileText
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.primary }}
                />
                <span
                  className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Known File Names
                </span>
                <Badge
                  className={`${TYPOGRAPHY.label.md} px-2 py-0.5`}
                  style={{
                    backgroundColor: `${APP_COLORS.primary}10`,
                    color: APP_COLORS.primary,
                    border: `1px solid ${APP_COLORS.primary}40`,
                  }}
                >
                  {fileInfo.names.length}
                </Badge>
              </div>
              {showNames ? (
                <ChevronUp
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.textSecondary }}
                />
              ) : (
                <ChevronDown
                  className="h-4 w-4"
                  style={{ color: APP_COLORS.textSecondary }}
                />
              )}
            </button>

            {showNames && (
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-2">
                  {fileInfo.names.map((name, idx) => (
                    <Badge
                      key={idx}
                      className={`${TYPOGRAPHY.body.sm} px-3 py-1`}
                      style={{
                        backgroundColor: `${APP_COLORS.primary}10`,
                        color: APP_COLORS.textPrimary,
                        border: `1px solid ${APP_COLORS.primary}40`,
                      }}
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expandable: File Analysis (DetectItEasy) */}
        {fileInfo.detectiteasy &&
          fileInfo.detectiteasy.values &&
          fileInfo.detectiteasy.values.length > 0 && (
            <div
              className="rounded-lg border transition-all duration-200"
              style={{
                backgroundColor: `${APP_COLORS.surface}`,
                borderColor: APP_COLORS.border,
              }}
            >
              <button
                onClick={() => setShowDetections(!showDetections)}
                className="w-full p-3 flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Shield
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.primary }}
                  />
                  <span
                    className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                    style={{ color: APP_COLORS.textPrimary }}
                  >
                    File Analysis
                    {fileInfo.detectiteasy.filetype &&
                      ` - ${fileInfo.detectiteasy.filetype}`}
                  </span>
                  <Badge
                    className={`${TYPOGRAPHY.label.md} px-2 py-0.5`}
                    style={{
                      backgroundColor: `${APP_COLORS.primary}10`,
                      color: APP_COLORS.primary,
                      border: `1px solid ${APP_COLORS.primary}40`,
                    }}
                  >
                    {fileInfo.detectiteasy.values.length} detections
                  </Badge>
                </div>
                {showDetections ? (
                  <ChevronUp
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.textSecondary }}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4"
                    style={{ color: APP_COLORS.textSecondary }}
                  />
                )}
              </button>

              {showDetections && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fileInfo.detectiteasy.values.map((detection, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg p-3 border transition-all duration-200 hover:shadow-md"
                        style={{
                          borderColor: `${APP_COLORS.primary}40`,
                          backgroundColor: `${APP_COLORS.surface}`,
                        }}
                      >
                        <div className="space-y-2">
                          <Badge
                            className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontWeight.bold} px-2 py-1`}
                            style={{
                              backgroundColor:
                                detection.type === "Packer"
                                  ? `${APP_COLORS.warning}20`
                                  : detection.type === "Compiler"
                                  ? `${APP_COLORS.accentCyan}20`
                                  : `${APP_COLORS.surface}10`,
                              color:
                                detection.type === "Packer"
                                  ? APP_COLORS.warning
                                  : detection.type === "Compiler"
                                  ? APP_COLORS.accentCyan
                                  : APP_COLORS.primary,
                              border: `1px solid ${
                                detection.type === "Packer"
                                  ? APP_COLORS.warning
                                  : detection.type === "Compiler"
                                  ? APP_COLORS.accentCyan
                                  : APP_COLORS.primary
                              }40`,
                            }}
                          >
                            {detection.type}
                          </Badge>

                          <div>
                            <span
                              className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold}`}
                              style={{ color: APP_COLORS.textPrimary }}
                            >
                              {detection.name}
                            </span>
                            {detection.version && (
                              <span
                                className={`${TYPOGRAPHY.label.md} ml-2`}
                                style={{ color: APP_COLORS.textSecondary }}
                              >
                                v{detection.version}
                              </span>
                            )}
                          </div>

                          {detection.info && (
                            <p
                              className={`${TYPOGRAPHY.body.sm}`}
                              style={{ color: APP_COLORS.textSecondary }}
                            >
                              {detection.info}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
