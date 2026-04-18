'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ScrollArea } from '@/components/ui/ScrollArea';

interface ThreatPatternsSectionProps {
  patterns: any[];
}

export function ThreatPatternsSection({ patterns }: ThreatPatternsSectionProps) {
  if (!patterns || patterns.length === 0) return null;

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
            <Zap className="h-5 w-5" style={{ color: APP_COLORS.warning }} />
          </div>
          <div>
            <h3 
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Threat Patterns
            </h3>
            <p 
              className={`${TYPOGRAPHY.caption.sm}`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              {patterns.length} patterns detected
            </p>
          </div>
        </div>

        <ScrollArea className="max-h-[300px]" variant="thin">
          <div className="space-y-2">
          {patterns.map((pattern: any, index: number) => (
            <div 
              key={index}
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: APP_COLORS.backgroundSoft,
                borderColor: APP_COLORS.border
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}>
                  {pattern.type || pattern.description}
                </span>
                <Badge 
                  variant="secondary"
                  style={{
                    backgroundColor: pattern.risk === 'critical' || pattern.risk === 'high'
                      ? `${APP_COLORS.danger}20`
                      : `${APP_COLORS.warning}20`,
                    color: pattern.risk === 'critical' || pattern.risk === 'high'
                      ? APP_COLORS.danger
                      : APP_COLORS.warning,
                  }}
                >
                  {pattern.count || 1} matches
                </Badge>
              </div>
              {pattern.description && pattern.type && (
                <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                  {pattern.description}
                </p>
              )}
            </div>
          ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
