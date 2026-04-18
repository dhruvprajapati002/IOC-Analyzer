'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSearch } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { FileAnalysisResult } from './types';
import { ScrollArea } from '@/components/ui/ScrollArea';

interface YaraAnalysisSectionProps {
  yaraAnalysis: FileAnalysisResult['yaraAnalysis'];
}

export function YaraAnalysisSection({ yaraAnalysis }: YaraAnalysisSectionProps) {
  if (!yaraAnalysis || yaraAnalysis.totalMatches === 0) return null;

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all duration-200 hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="p-2.5 rounded-lg"
            style={{ backgroundColor: `${APP_COLORS.warning}20` }}
          >
            <FileSearch className="h-5 w-5" style={{ color: APP_COLORS.warning }} />
          </div>
          <div>
            <h3 
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              YARA Analysis
            </h3>
            <p 
              className={`${TYPOGRAPHY.caption.sm}`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              Behavior pattern detection
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={TYPOGRAPHY.body.sm} style={{ color: APP_COLORS.textSecondary }}>
              Total Matches
            </span>
            <Badge variant="secondary" style={{ backgroundColor: `${APP_COLORS.warning}20`, color: APP_COLORS.warning }}>
              {yaraAnalysis.totalMatches} rules
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className={TYPOGRAPHY.body.sm} style={{ color: APP_COLORS.textSecondary }}>
              Total Score
            </span>
            <Badge 
              variant="secondary"
              style={{
                backgroundColor: `${APP_COLORS.danger}20`,
                color: APP_COLORS.danger,
              }}
            >
              {yaraAnalysis.totalScore}
            </Badge>
          </div>
          
          {yaraAnalysis.rules && yaraAnalysis.rules.length > 0 && (
            <ScrollArea className="mt-4 max-h-[300px]" variant="thin">
              <div className="space-y-2">
                <p className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold}`} style={{ color: APP_COLORS.textSecondary }}>
                  Matched Rules:
                </p>
                {yaraAnalysis.rules.map((rule: any, index: number) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: APP_COLORS.backgroundSoft,
                      borderColor: `${APP_COLORS.border}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}>
                        {rule.ruleName}
                      </span>
                      <Badge 
                        variant="secondary"
                        style={{
                          backgroundColor: rule.risk === 'critical' 
                            ? `${APP_COLORS.danger}20`
                            : rule.risk === 'high'
                              ? `${APP_COLORS.warning}20`
                              : `${APP_COLORS.info}20`,
                          color: rule.risk === 'critical' 
                            ? APP_COLORS.danger
                            : rule.risk === 'high'
                              ? APP_COLORS.warning
                              : APP_COLORS.info,
                        }}
                      >
                        Score: {rule.score}
                      </Badge>
                    </div>
                    <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
