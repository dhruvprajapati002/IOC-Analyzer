'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Hash, Copy, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { FileAnalysisResult } from './types';

interface FileHashesSectionProps {
  hashes: FileAnalysisResult['hashes'] | {
    md5?: string;
    sha1?: string;
    sha256?: string;
  };
}

export function FileHashesSection({ hashes }: FileHashesSectionProps) {
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) {
      toast.error(`${label} hash not available`);
      return;
    }
    
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // ✅ Handle both formats with fallbacks
  const hashItems = [
    { 
      type: 'sha256', 
      label: 'SHA256', 
      value: hashes?.sha256 || '',
      description: '256-bit cryptographic hash'
    },
    { 
      type: 'sha1', 
      label: 'SHA1', 
      value: hashes?.sha1 || '',
      description: '160-bit cryptographic hash'
    },
    { 
      type: 'md5', 
      label: 'MD5', 
      value: hashes?.md5 || '',
      description: '128-bit cryptographic hash'
    },
  ].filter(item => item.value); // ✅ Only show available hashes

  if (hashItems.length === 0) {
    return (
      <Card
        className={`${CARD_STYLES.base} h-full`}
        style={{
          backgroundColor: APP_COLORS.backgroundSoft,
          borderColor: APP_COLORS.border,
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2.5 rounded-lg"
              style={{
                backgroundColor: `${APP_COLORS.primary}20`,
              }}
            >
              <Hash className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
            </div>
            <h3 
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              File Hashes
            </h3>
          </div>
          <p className={TYPOGRAPHY.caption.sm} style={{ color: APP_COLORS.textSecondary }}>
            No hash information available
          </p>
        </CardContent>
      </Card>
    );
  }

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
              <Hash className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                File Hashes
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.xs} mt-0.5`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Cryptographic identifiers
              </p>
            </div>
          </div>
          
          {/* ✅ Security indicator */}
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${APP_COLORS.success}15` }}
          >
            <Shield className="h-4 w-4" style={{ color: APP_COLORS.success }} />
          </div>
        </div>

        {/* Hash List */}
        <div className="space-y-4">
          {hashItems.map((item) => (
            <HashRow
              key={item.type}
              label={item.label}
              value={item.value}
              description={item.description}
              isCopied={copiedHash === item.label}
              onCopy={() => copyToClipboard(item.value, item.label)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HashRow({
  label,
  value,
  description,
  isCopied,
  onCopy,
}: {
  label: string;
  value: string;
  description: string;
  isCopied: boolean;
  onCopy: () => void;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span 
            className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wider`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            {label}
          </span>
          <span 
            className={`${TYPOGRAPHY.caption.xs} ml-2`}
            style={{ color: APP_COLORS.textSecondary, opacity: 0.7 }}
          >
            {description}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="p-1.5 rounded-md transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: isCopied 
              ? `${APP_COLORS.success}20` 
              : isHovered 
                ? `${APP_COLORS.primary}15`
                : 'transparent',
          }}
          aria-label={`Copy ${label} hash`}
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5" style={{ color: APP_COLORS.success }} />
          ) : (
            <Copy 
              className="h-3.5 w-3.5" 
              style={{ 
                color: isHovered ? APP_COLORS.primary : APP_COLORS.textMuted 
              }} 
            />
          )}
        </button>
      </div>

      {/* Hash Value */}
      <div
        className="relative rounded-lg border p-3 cursor-pointer transition-all duration-200 hover:border-opacity-100 overflow-hidden"
        style={{
          backgroundColor: isHovered ? APP_COLORS.backgroundSoft : 'transparent',
          borderColor: isHovered ? APP_COLORS.primary : APP_COLORS.borderSoft,
        }}
        onClick={onCopy}
      >
        <code 
          className={`${TYPOGRAPHY.code.sm} ${TYPOGRAPHY.fontFamily.mono} block break-all leading-relaxed select-all`}
          style={{ color: APP_COLORS.textPrimary }}
        >
          {value}
        </code>
        
        {/* ✅ Hover overlay */}
        {isHovered && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              backgroundColor: `${APP_COLORS.primary}08`,
            }}
          >
            <div
              className="px-3 py-1.5 rounded-full flex items-center gap-2"
              style={{
                backgroundColor: APP_COLORS.primary,
                color: 'white',
              }}
            >
              <Copy className="h-3 w-3" />
              <span className={TYPOGRAPHY.caption.xs}>Click to copy</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
