'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  FileType, 
  HardDrive, 
  Package, 
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Upload,
  RefreshCw
} from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { FileAnalysisResult } from './types';

interface FileInformationSectionProps {
  result: FileAnalysisResult;
}

export function FileInformationSection({ result }: FileInformationSectionProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // ✅ Extract file info with v2 API support
  const fileInfo = result.fileInfo || (result.vtData as any)?.fileInfo || {};
  const vtData = result.vtData || {};
  
  const fileName = fileInfo.name || vtData.meaningful_name || result.ioc || 'Unknown';
  const fileSize = fileInfo.size || vtData.size || 0;
  const fileType = fileInfo.type || vtData.type_description || 'Unknown';
  const fileExtension = fileInfo.extension || vtData.type_tag || fileName.split('.').pop() || 'unknown';
  const isPacked = fileInfo.isPacked;
  const entropy = fileInfo.entropy || result.metadata?.entropy;
  
  // ✅ NEW: Get submission dates from vtData (epoch timestamps)
  const formatEpochDate = (epoch?: number) => {
    if (!epoch) return null;
    try {
      const date = new Date(epoch * 1000); // Convert epoch to milliseconds
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };
  
  const firstSeen = fileInfo.firstSeen || formatEpochDate(vtData.first_submission_date);
  const lastAnalysis = fileInfo.lastAnalysis || formatEpochDate(vtData.last_submission_date);
  const uploadDate = fileInfo.uploadDate;

  // ✅ Determine if entropy indicates packed/encrypted file
  const isHighEntropy = entropy !== undefined && entropy > 7.5;
  const isLowEntropy = entropy !== undefined && entropy < 1;

  const infoItems = [
    {
      label: 'FILE NAME',
      value: fileName,
      icon: FileText,
      highlight: false,
    },
    {
      label: 'FILE SIZE',
      value: formatFileSize(fileSize),
      icon: HardDrive,
      highlight: fileSize > 100 * 1024 * 1024 || (fileSize < 100 && fileType.toLowerCase().includes('executable')),
    },
    {
      label: 'FILE TYPE',
      value: fileType,
      icon: Package,
      highlight: false,
    },
    {
      label: 'EXTENSION',
      value: `.${fileExtension.toUpperCase()}`,
      icon: FileType,
      highlight: false,
    },
    // ✅ Show entropy if available
    ...(entropy !== undefined ? [{
      label: 'ENTROPY',
      value: entropy.toFixed(2),
      icon: Activity,
      highlight: isHighEntropy,
      badge: isHighEntropy ? 'High' : isLowEntropy ? 'Low' : undefined,
    }] : []),
    // ✅ Show dates conditionally
    ...(uploadDate ? [{
      label: 'UPLOADED',
      value: formatDate(uploadDate),
      icon: Upload,
      highlight: false,
    }] : []),
    ...(firstSeen && firstSeen !== uploadDate ? [{
      label: 'FIRST SEEN',
      value: formatDate(firstSeen),
      icon: Calendar,
      highlight: false,
    }] : []),
    ...(lastAnalysis ? [{
      label: 'LAST ANALYSIS',
      value: formatDate(lastAnalysis),
      icon: RefreshCw,
      highlight: false,
    }] : []),
  ];

  return (
    <Card
      className={`${CARD_STYLES.base} h-full transition-all duration-200 hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{
                backgroundColor: `${APP_COLORS.primary}20`,
              }}
            >
              <FileText className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                File Information
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Basic file properties
              </p>
            </div>
          </div>

          {/* ✅ Status badges */}
          <div className="flex items-center gap-2">
            {isPacked !== undefined && (
              <Badge
                variant="secondary"
                className="text-xs flex items-center gap-1"
                style={{
                  backgroundColor: isPacked 
                    ? `${APP_COLORS.warning}20` 
                    : `${APP_COLORS.success}20`,
                  color: isPacked ? APP_COLORS.warning : APP_COLORS.success,
                }}
              >
                {isPacked ? (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    Packed
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Not Packed
                  </>
                )}
              </Badge>
            )}
            
            {isHighEntropy && isPacked === undefined && (
              <Badge
                variant="secondary"
                className="text-xs flex items-center gap-1"
                style={{
                  backgroundColor: `${APP_COLORS.warning}20`,
                  color: APP_COLORS.warning,
                }}
              >
                <AlertTriangle className="h-3 w-3" />
                High Entropy
              </Badge>
            )}
          </div>
        </div>

        {/* Info List */}
        <div className="space-y-4">
          {infoItems.map((item, index) => (
            <InfoRow 
              key={index}
              label={item.label}
              value={item.value}
              icon={item.icon}
              highlight={item.highlight}
              badge={item.badge}
            />
          ))}
        </div>

        {/* ✅ Warning messages */}
        <div className="space-y-2 mt-4">
          {/* Large file warning */}
          {fileSize > 100 * 1024 * 1024 && (
            <div 
              className="p-3 rounded-lg flex items-start gap-2"
              style={{
                backgroundColor: `${APP_COLORS.info}10`,
                border: `1px solid ${APP_COLORS.info}30`,
              }}
            >
              <AlertTriangle 
                className="h-4 w-4 flex-shrink-0 mt-0.5" 
                style={{ color: APP_COLORS.info }} 
              />
              <div>
                <p 
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.info }}
                >
                  Large File Detected
                </p>
                <p 
                  className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  File size exceeds 100 MB. Analysis may take longer.
                </p>
              </div>
            </div>
          )}

          {/* Small executable warning */}
          {fileSize < 100 && fileType.toLowerCase().includes('executable') && (
            <div 
              className="p-3 rounded-lg flex items-start gap-2"
              style={{
                backgroundColor: `${APP_COLORS.warning}10`,
                border: `1px solid ${APP_COLORS.warning}30`,
              }}
            >
              <AlertTriangle 
                className="h-4 w-4 flex-shrink-0 mt-0.5" 
                style={{ color: APP_COLORS.warning }} 
              />
              <div>
                <p 
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.warning }}
                >
                  Suspicious File Size
                </p>
                <p 
                  className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  Executable file is unusually small (&lt; 100 bytes). This could indicate a dropper or stub.
                </p>
              </div>
            </div>
          )}

          {/* High entropy warning */}
          {isHighEntropy && (
            <div 
              className="p-3 rounded-lg flex items-start gap-2"
              style={{
                backgroundColor: `${APP_COLORS.warning}10`,
                border: `1px solid ${APP_COLORS.warning}30`,
              }}
            >
              <AlertTriangle 
                className="h-4 w-4 flex-shrink-0 mt-0.5" 
                style={{ color: APP_COLORS.warning }} 
              />
              <div>
                <p 
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.warning }}
                >
                  High Entropy Detected
                </p>
                <p 
                  className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  File entropy is {entropy?.toFixed(2)}/8.0. This may indicate encryption or compression.
                </p>
              </div>
            </div>
          )}

          {/* Script file warning */}
          {['script', 'batch', 'powershell', 'vbscript', 'javascript', 'shell'].some(
            type => fileType.toLowerCase().includes(type)
          ) && (
            <div 
              className="p-3 rounded-lg flex items-start gap-2"
              style={{
                backgroundColor: `${APP_COLORS.info}10`,
                border: `1px solid ${APP_COLORS.info}30`,
              }}
            >
              <AlertTriangle 
                className="h-4 w-4 flex-shrink-0 mt-0.5" 
                style={{ color: APP_COLORS.info }} 
              />
              <div>
                <p 
                  className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold}`}
                  style={{ color: APP_COLORS.info }}
                >
                  Script File Detected
                </p>
                <p 
                  className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  Script files can execute commands. Review content carefully before execution.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ 
  label, 
  value, 
  icon: Icon,
  highlight = false,
  badge,
}: { 
  label: string; 
  value: string; 
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 group">
      {/* Left: Icon + Label */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div 
          className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ 
            color: highlight ? APP_COLORS.warning : APP_COLORS.textMuted 
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span 
          className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
          style={{ color: APP_COLORS.textSecondary }}
        >
          {label}
        </span>
      </div>

      {/* Right: Value + Optional Badge */}
      <div className="flex items-center gap-2 flex-shrink-0 max-w-[60%]">
        <span
          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} text-right break-all`}
          style={{ 
            color: highlight ? APP_COLORS.warning : APP_COLORS.textPrimary,
          }}
        >
          {value}
        </span>
        
        {badge && (
          <Badge
            variant="secondary"
            className="text-xs px-1.5 py-0.5"
            style={{
              backgroundColor: highlight 
                ? `${APP_COLORS.warning}20` 
                : `${APP_COLORS.success}20`,
              color: highlight ? APP_COLORS.warning : APP_COLORS.success,
            }}
          >
            {badge}
          </Badge>
        )}
      </div>
    </div>
  );
}
