'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Cpu, Code, FileCode } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ScrollAreaHorizontal } from '@/components/ui/ScrollArea';

interface TechnicalDetailsSectionProps {
  detectiteasy?: any;
  elfInfo?: any;
  trid?: any;
}

export function TechnicalDetailsSection({ detectiteasy, elfInfo, trid }: TechnicalDetailsSectionProps) {
  // Don't render if no data
  if (!detectiteasy && !elfInfo && !trid) return null;

  const renderJsonData = (data: any, title: string) => {
    if (!data) return null;

    const renderValue = (value: any): string => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    };

    return (
      <div className="space-y-2">
        <div
          className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
          style={{ color: APP_COLORS.textPrimary }}
        >
          {title}
        </div>
        <ScrollAreaHorizontal
          className="rounded-lg p-4"
          variant="thin"
          style={{
            backgroundColor: APP_COLORS.backgroundSoft,
            border: `1px solid ${APP_COLORS.border}`,
          }}
        >
          <pre
            className={`${TYPOGRAPHY.caption.sm} whitespace-pre-wrap`}
            style={{ color: APP_COLORS.textSecondary }}
          >
            {typeof data === 'object' 
              ? JSON.stringify(data, null, 2) 
              : renderValue(data)}
          </pre>
        </ScrollAreaHorizontal>
      </div>
    );
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
              <Code className="h-5 w-5" style={{ color: APP_COLORS.accentCyan }} />
            </div>
            <div>
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Technical Details
              </h3>
              <p 
                className={`${TYPOGRAPHY.caption.sm}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Additional file analysis information
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {detectiteasy && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4" style={{ color: APP_COLORS.accentCyan }} />
                <span
                  className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  Detect It Easy (DIE)
                </span>
              </div>
              {renderJsonData(detectiteasy, '')}
            </div>
          )}

          {elfInfo && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="h-4 w-4" style={{ color: APP_COLORS.accentCyan }} />
                <span
                  className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  ELF Information
                </span>
              </div>
              {renderJsonData(elfInfo, '')}
            </div>
          )}

          {trid && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-4 w-4" style={{ color: APP_COLORS.accentCyan }} />
                <span
                  className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  TrID Analysis
                </span>
              </div>
              {renderJsonData(trid, '')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
