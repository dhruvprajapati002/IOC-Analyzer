'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Activity, 
  FileText, 
  Package, 
  Layers,
  AlertTriangle,
  TrendingUp,
  Info
} from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { FileAnalysisResult } from './types';

interface FileMetadataSectionProps {
  metadata: FileAnalysisResult['metadata'] | {
    entropy?: number;
    strings?: number;
    imports?: number;
    sections?: number;
  };
}

export function FileMetadataSection({ metadata }: FileMetadataSectionProps) {
  if (!metadata) return null;

  // ✅ Check if metadata has any values
  const hasData = metadata.entropy !== undefined || 
                  metadata.strings !== undefined || 
                  metadata.imports !== undefined || 
                  metadata.sections !== undefined;

  if (!hasData) return null;

  // ✅ Determine entropy status
  const entropy = metadata.entropy || 0;
  const isHighEntropy = entropy > 7.5;
  const isMediumEntropy = entropy > 6.5 && entropy <= 7.5;
  const isLowEntropy = entropy < 1;
  const entropyStatus = isHighEntropy 
    ? 'High' 
    : isMediumEntropy 
      ? 'Medium' 
      : isLowEntropy 
        ? 'Low' 
        : 'Normal';
  const entropyColor = isHighEntropy 
    ? APP_COLORS.danger 
    : isMediumEntropy 
      ? APP_COLORS.warning 
      : isLowEntropy
        ? APP_COLORS.info
        : APP_COLORS.success;

  // ✅ Determine suspicious indicators
  const hasManySections = (metadata.sections || 0) > 10;
  const hasManyImports = (metadata.imports || 0) > 100;
  const hasFewStrings = (metadata.strings || 0) < 10 && (metadata.strings || 0) > 0;
  const hasNoStrings = (metadata.strings || 0) === 0;

  const metadataItems = [
    { 
      label: 'ENTROPY', 
      value: entropy.toFixed(2),
      rawValue: entropy,
      icon: Activity,
      color: entropyColor,
      badge: entropyStatus,
      description: 'File randomness (0-8.0 scale)',
      warning: isHighEntropy 
        ? 'High entropy - likely encrypted or compressed'
        : isLowEntropy 
          ? 'Very low entropy - unusual for binary files'
          : undefined,
    },
    { 
      label: 'STRINGS', 
      value: metadata.strings?.toLocaleString() || '0',
      rawValue: metadata.strings || 0,
      icon: FileText,
      color: hasFewStrings || hasNoStrings ? APP_COLORS.warning : APP_COLORS.success,
      description: 'Readable text strings detected',
      warning: hasNoStrings 
        ? 'No strings found - heavily obfuscated or packed'
        : hasFewStrings 
          ? 'Very few strings - possibly obfuscated'
          : undefined,
    },
    { 
      label: 'IMPORTS', 
      value: metadata.imports?.toLocaleString() || '0',
      rawValue: metadata.imports || 0,
      icon: Package,
      color: hasManyImports ? APP_COLORS.warning : APP_COLORS.info,
      description: 'External API functions imported',
      warning: hasManyImports ? 'Unusually high import count - complex functionality' : undefined,
    },
    { 
      label: 'SECTIONS', 
      value: metadata.sections?.toLocaleString() || '0',
      rawValue: metadata.sections || 0,
      icon: Layers,
      color: hasManySections ? APP_COLORS.warning : APP_COLORS.accentPurple,
      description: 'PE file structure sections',
      warning: hasManySections ? 'High section count - abnormal file structure' : undefined,
    },
  ].filter(item => item.rawValue !== undefined);

  const hasWarnings = metadataItems.some(item => item.warning);

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{
                backgroundColor: `${APP_COLORS.primary}20`,
              }}
            >
              <BarChart3 className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                File Metadata
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Statistical analysis
              </p>
            </div>
          </div>

          {/* ✅ Warning indicator */}
          {hasWarnings && (
            <div
              className="p-1.5 rounded-lg animate-pulse"
              style={{ backgroundColor: `${APP_COLORS.warning}15` }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: APP_COLORS.warning }} />
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
          {metadataItems.map((item, index) => (
            <MetadataCard 
              key={index}
              label={item.label}
              value={item.value}
              icon={item.icon}
              color={item.color}
              badge={item.badge}
              description={item.description}
              warning={item.warning}
            />
          ))}
        </div>

        {/* ✅ Overall warnings section */}
        {hasWarnings && (
          <div 
            className="mt-5 p-3 rounded-lg flex items-start gap-2"
            style={{
              backgroundColor: `${APP_COLORS.warning}10`,
              border: `1px solid ${APP_COLORS.warning}30`,
            }}
          >
            <AlertTriangle 
              className="h-4 w-4 flex-shrink-0 mt-0.5" 
              style={{ color: APP_COLORS.warning }} 
            />
            <div className="space-y-1">
              <p 
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                style={{ color: APP_COLORS.warning }}
              >
                Suspicious Indicators Detected
              </p>
              {metadataItems
                .filter(item => item.warning)
                .map((item, index) => (
                  <p 
                    key={index}
                    className={`${TYPOGRAPHY.caption.xs}`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    • {item.warning}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* ✅ Info note */}
        <div 
          className="mt-4 p-2.5 rounded-lg flex items-start gap-2"
          style={{
            backgroundColor: `${APP_COLORS.info}08`,
            border: `1px solid ${APP_COLORS.info}20`,
          }}
        >
          <Info 
            className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" 
            style={{ color: APP_COLORS.info }} 
          />
          <p 
            className={`${TYPOGRAPHY.caption.xs}`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            Hover over cards for detailed information about each metric.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetadataCard({ 
  label, 
  value, 
  icon: Icon,
  color,
  badge,
  description,
  warning,
}: { 
  label: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  badge?: string;
  description?: string;
  warning?: string;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className="relative rounded-lg border-2 p-4 transition-all duration-200 hover:scale-[1.02] group overflow-hidden cursor-pointer"
      style={{
        backgroundColor: isHovered ? `${color}05` : 'transparent',
        borderColor: isHovered ? `${color}40` : `${color}20`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={description}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {/* Icon */}
        <div
          className="p-1.5 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: `${color}15`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        
        {/* Right side indicators */}
        <div className="flex items-center gap-1.5">
          {/* Badge */}
          {badge && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0.5"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {badge}
            </Badge>
          )}

          {/* Warning indicator */}
          {warning && (
            <div
              className="p-1 rounded animate-pulse"
              style={{ backgroundColor: `${APP_COLORS.warning}20` }}
            >
              <AlertTriangle className="h-3 w-3" style={{ color: APP_COLORS.warning }} />
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      <div 
        className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold} leading-none mb-2 transition-all duration-200 group-hover:scale-105`}
        style={{ color }}
      >
        {value}
      </div>

      {/* Label */}
      <div 
        className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wider`}
        style={{ color: APP_COLORS.textSecondary }}
      >
        {label}
      </div>

      {/* Description on hover */}
      {description && isHovered && (
        <div
          className="absolute bottom-0 left-0 right-0 p-2 text-center animate-in slide-in-from-bottom-2 duration-200"
          style={{
            backgroundColor: `${color}95`,
            color: 'white',
          }}
        >
          <p className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}>
            {description}
          </p>
        </div>
      )}

      {/* Trending indicator for warnings */}
      {warning && !isHovered && (
        <div className="absolute top-2 right-2">
          <TrendingUp 
            className="h-3.5 w-3.5 animate-pulse" 
            style={{ color: APP_COLORS.warning }} 
          />
        </div>
      )}
    </div>
  );
}
