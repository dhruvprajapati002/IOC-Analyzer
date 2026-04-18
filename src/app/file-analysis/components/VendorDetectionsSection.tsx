'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { Detection } from './types';

interface VendorDetectionsSectionProps {
  detections: Detection[];
  vendorConfidence?: number;
}

export function VendorDetectionsSection({ detections, vendorConfidence }: VendorDetectionsSectionProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (!detections || detections.length === 0) return null;

  // ✅ Filter out invalid entries
  const validDetections = detections.filter(
    d => d.engine && d.result && d.result !== 'null' && d.result.toLowerCase() !== 'unknown'
  );

  if (validDetections.length === 0) return null;

  const copyToClipboard = (text: string, vendor: string, index: number) => {
    navigator.clipboard.writeText(text);
    toast.success(`${vendor} detection copied!`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Get confidence level styling
  const getConfidenceStyle = () => {
    if (!vendorConfidence) return null;
    
    const confidence = Number(vendorConfidence);
    
    if (confidence >= 80) {
      return { color: APP_COLORS.danger, label: 'HIGH' };
    } else if (confidence >= 50) {
      return { color: APP_COLORS.warning, label: 'MEDIUM' };
    } else {
      return { color: APP_COLORS.info, label: 'LOW' };
    }
  };

  const confidenceStyle = getConfidenceStyle();

  return (
    <Card
      className={`${CARD_STYLES.base} h-full transition-all duration-200`}
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
                backgroundColor: `${APP_COLORS.danger}20`,
              }}
            >
              <AlertCircle className="h-5 w-5" style={{ color: APP_COLORS.danger }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Vendor Detections
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                {validDetections.length} security vendors
              </p>
            </div>
          </div>

          {/* Confidence Badge */}
          {confidenceStyle && (
            <div className="text-right">
              <Badge
                variant="secondary"
                className={`${TYPOGRAPHY.label.xs} px-2.5 py-1 mb-1`}
                style={{
                  backgroundColor: `${confidenceStyle.color}20`,
                  color: confidenceStyle.color,
                  border: `1px solid ${confidenceStyle.color}30`,
                  fontWeight: 700,
                }}
              >
                {confidenceStyle.label}
              </Badge>
              <div 
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: confidenceStyle.color }}
              >
                {Math.round(Number(vendorConfidence))}%
              </div>
            </div>
          )}
        </div>

        {/* Detection List with Custom Scrollbar */}
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {validDetections.map((detection, index) => (
            <DetectionRow
              key={`${detection.engine}-${index}`}
              detection={detection}
              index={index}
              isCopied={copiedIndex === index}
              onCopy={() => copyToClipboard(
                `${detection.engine}: ${detection.result}`,
                detection.engine,
                index
              )}
            />
          ))}
        </div>
      </CardContent>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${APP_COLORS.surfaceSoft};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${APP_COLORS.danger}60;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${APP_COLORS.danger};
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${APP_COLORS.danger}60 ${APP_COLORS.surfaceSoft};
        }
      `}</style>
    </Card>
  );
}

function DetectionRow({
  detection,
  index,
  isCopied,
  onCopy,
}: {
  detection: Detection;
  index: number;
  isCopied: boolean;
  onCopy: () => void;
}) {
  // ✅ Get category color
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'malicious':
        return APP_COLORS.danger;
      case 'suspicious':
        return APP_COLORS.warning;
      case 'harmless':
      case 'clean':
        return APP_COLORS.success;
      default:
        return APP_COLORS.textMuted;
    }
  };

  const categoryColor = getCategoryColor(detection.category);

  return (
    <div
      className="group relative rounded-lg border transition-all duration-200 hover:scale-[1.01] cursor-pointer overflow-hidden"
      style={{
        borderColor: `${categoryColor}20`,
      }}
      onClick={onCopy}
    >
      {/* Accent Bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 group-hover:w-1.5"
        style={{ backgroundColor: categoryColor }}
      />

      <div className="relative flex items-center gap-3 p-3 pl-4">
        {/* Vendor Badge */}
        <Badge
          variant="secondary"
          className={`${TYPOGRAPHY.label.xs} px-3 py-1 flex-shrink-0`}
          style={{
            backgroundColor: `${APP_COLORS.primary}15`,
            color: APP_COLORS.primary,
            border: `1px solid ${APP_COLORS.primary}30`,
            fontWeight: 600,
            minWidth: '100px',
            textAlign: 'center',
          }}
        >
          {detection.engine}
        </Badge>

        {/* Category Badge (if not malicious) */}
        {detection.category && detection.category.toLowerCase() !== 'malicious' && (
          <Badge
            variant="secondary"
            className={`${TYPOGRAPHY.label.xs} px-2 py-0.5 flex-shrink-0`}
            style={{
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
              border: `1px solid ${categoryColor}30`,
              fontWeight: 600,
            }}
          >
            {detection.category}
          </Badge>
        )}

        {/* Threat Name */}
        <div className="flex-1 min-w-0">
          <code
            className={`${TYPOGRAPHY.code.sm} block truncate`}
            style={{ color: categoryColor }}
            title={detection.result}
          >
            {detection.result}
          </code>
          <span
            className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            Detection #{index + 1}
          </span>
        </div>

        {/* Copy Icon */}
        <div
          className="p-1.5 rounded-md transition-all duration-200 flex-shrink-0"
          style={{
            backgroundColor: isCopied ? `${APP_COLORS.success}20` : `${APP_COLORS.primary}10`,
            opacity: isCopied ? 1 : 0,
          }}
          onMouseEnter={(e) => {
            if (!isCopied) e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            if (!isCopied) e.currentTarget.style.opacity = '0';
          }}
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5" style={{ color: APP_COLORS.success }} />
          ) : (
            <Copy className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
          )}
        </div>
      </div>
    </div>
  );
}
