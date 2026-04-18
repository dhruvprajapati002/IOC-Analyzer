'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ChevronDown, ChevronUp, File } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { Badge } from '@/components/ui/badge';

interface FileHistorySectionProps {
  meaningfulName?: string;
  names?: string[];
  size?: number;
}

export function FileHistorySection({ meaningfulName, names, size }: FileHistorySectionProps) {
  // Don't render if no data
  if (!meaningfulName && (!names || names.length === 0)) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all duration-200 hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${APP_COLORS.accentCyan}20` }}
            >
              <FileText className="h-5 w-5" style={{ color: APP_COLORS.accentCyan }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                File Information
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.sm}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                {names?.length || 0} filename{(names?.length || 0) !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Primary Name */}
          {meaningfulName && (
            <div className="rounded-lg border p-4" style={{ borderColor: APP_COLORS.border }}>
              <div className="flex items-start gap-3">
                <File className="h-5 w-5 mt-0.5" style={{ color: APP_COLORS.accentCyan }} />
                <div className="flex-1 min-w-0">
                  <div
                    className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} mb-1`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Primary Name
                  </div>
                  <div
                    className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold} break-all`}
                    style={{ color: APP_COLORS.textPrimary }}
                  >
                    {meaningfulName}
                  </div>
                  {size !== undefined && (
                    <Badge
                      variant="secondary"
                      className="mt-2"
                      style={{
                        backgroundColor: `${APP_COLORS.info}15`,
                        color: APP_COLORS.info,
                      }}
                    >
                      {formatFileSize(size)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historical Names */}
          {names && names.length > 0 && (
            <div>
              <div
                className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} mb-3`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Historical Filenames ({names.length})
              </div>
              <div 
                className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-t-textMuted scrollbar-track-t-surfaceMuted"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${APP_COLORS.textMuted} ${APP_COLORS.backgroundSoft}`,
                }}
              >
                {names?.map((name, idx) => (
                  <div
                    key={idx}
                    className="rounded-md p-3 transition-colors hover:bg-opacity-80"
                    style={{
                      backgroundColor: APP_COLORS.backgroundSoft,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`}
                        style={{ color: APP_COLORS.textSecondary }}
                      >
                        #{idx + 1}
                      </span>
                      <span
                        className={`${TYPOGRAPHY.body.sm} break-all`}
                        style={{ color: APP_COLORS.textPrimary }}
                      >
                        {name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
