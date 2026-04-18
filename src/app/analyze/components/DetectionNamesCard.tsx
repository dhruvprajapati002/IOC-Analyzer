'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ScrollArea } from '@/components/ui/ScrollArea';

interface Detection {
  engine: string;
  category: string;
  result: string;
}

interface DetectionNamesCardProps {
  detections: Detection[];
}

export function DetectionNamesCard({ detections }: DetectionNamesCardProps) {
  if (!detections || detections.length === 0) return null;

  // Separate malicious and suspicious
  const maliciousDetections = detections.filter(d => d.category === 'malicious');
  const suspiciousDetections = detections.filter(d => d.category === 'suspicious');
  
  const totalDetections = detections.length;
  const maliciousCount = maliciousDetections.length;
  const suspiciousCount = suspiciousDetections.length;

  return (
    <Card 
      className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardHeader className="pb-3 px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-md"
              style={{
                backgroundColor: `${APP_COLORS.danger}20`,
                border: `1px solid ${APP_COLORS.danger}40`,
              }}
            >
              <Shield className="h-3.5 w-3.5" style={{ color: APP_COLORS.danger }} />
            </div>
            <CardTitle 
              className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Vendor Threat Detections
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
              style={{
                backgroundColor: `${APP_COLORS.danger}15`,
                color: APP_COLORS.danger,
                border: `1px solid ${APP_COLORS.danger}30`,
              }}
            >
              {maliciousCount}M
            </Badge>
            <Badge
              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
              style={{
                backgroundColor: `${APP_COLORS.warning}15`,
                color: APP_COLORS.warning,
                border: `1px solid ${APP_COLORS.warning}30`,
              }}
            >
              {suspiciousCount}S
            </Badge>
            <Badge
              className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
              style={{
                backgroundColor: `${APP_COLORS.primary}15`,
                color: APP_COLORS.primary,
                border: `1px solid ${APP_COLORS.primary}30`,
              }}
            >
              {totalDetections} Total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-3 px-4 space-y-3">
        {/* Malicious Detections */}
        {maliciousDetections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" style={{ color: APP_COLORS.danger }} />
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.danger }}
              >
                Malicious Detections ({maliciousDetections.length})
              </h3>
            </div>
            <div 
              className="rounded-lg border p-3"
              style={{
                backgroundColor: `${APP_COLORS.danger}08`,
                borderColor: `${APP_COLORS.danger}30`,
              }}
            >
              <ScrollArea className="max-h-96" variant="thin">
                <div className="space-y-1.5">
                {maliciousDetections.map((detection, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md p-2 border transition-colors"
                    style={{
                      backgroundColor: APP_COLORS.surfaceSoft,
                      borderColor: `${APP_COLORS.danger}30`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${APP_COLORS.danger}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = APP_COLORS.surfaceSoft;
                    }}
                  >
                    <div className="min-w-[100px]">
                      <Badge
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium} w-full justify-center`}
                        style={{
                          backgroundColor: `${APP_COLORS.danger}15`,
                          color: APP_COLORS.danger,
                          border: `1px solid ${APP_COLORS.danger}30`,
                        }}
                      >
                        {detection.engine}
                      </Badge>
                    </div>
                    <code 
                      className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontFamily.mono} flex-1 truncate`}
                      style={{ color: APP_COLORS.danger }}
                    >
                      {detection.result}
                    </code>
                    <Copy 
                      className="h-3 w-3 cursor-pointer flex-shrink-0 transition-colors"
                      style={{ color: APP_COLORS.textSecondary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = APP_COLORS.textPrimary}
                      onMouseLeave={(e) => e.currentTarget.style.color = APP_COLORS.textMuted}
                      onClick={() => {
                        const fullDetection = `${detection.engine}/${detection.result}`;
                        navigator.clipboard.writeText(fullDetection);
                        toast.success('Copied: ' + fullDetection);
                      }}
                    />
                  </div>
                ))}
                </div>
              </ScrollArea>
              <div 
                className={`${TYPOGRAPHY.caption.xs} mt-2 pt-2 border-t`}
                style={{ color: APP_COLORS.textSecondary, borderColor: `${APP_COLORS.danger}30` }}
              >
                💡 {maliciousDetections.length} security vendors flagged this as malicious
              </div>
            </div>
          </div>
        )}

        {/* Suspicious Detections */}
        {suspiciousDetections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" style={{ color: APP_COLORS.warning }} />
              <h3 
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.warning }}
              >
                Suspicious Detections ({suspiciousDetections.length})
              </h3>
            </div>
            <div 
              className="rounded-lg border p-3"
              style={{
                backgroundColor: `${APP_COLORS.warning}08`,
                borderColor: `${APP_COLORS.warning}30`,
              }}
            >
              <ScrollArea className="max-h-64" variant="thin">
                <div className="space-y-1.5">
                {suspiciousDetections.map((detection, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md p-2 border transition-colors"
                    style={{
                      backgroundColor: APP_COLORS.surfaceSoft,
                      borderColor: `${APP_COLORS.warning}30`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${APP_COLORS.warning}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = APP_COLORS.surfaceSoft;
                    }}
                  >
                    <div className="min-w-[100px]">
                      <Badge
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium} w-full justify-center`}
                        style={{
                          backgroundColor: `${APP_COLORS.warning}15`,
                          color: APP_COLORS.warning,
                          border: `1px solid ${APP_COLORS.warning}30`,
                        }}
                      >
                        {detection.engine}
                      </Badge>
                    </div>
                    <code 
                      className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontFamily.mono} flex-1 truncate`}
                      style={{ color: APP_COLORS.warning }}
                    >
                      {detection.result}
                    </code>
                    <Copy 
                      className="h-3 w-3 cursor-pointer flex-shrink-0 transition-colors"
                      style={{ color: APP_COLORS.textSecondary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = APP_COLORS.textPrimary}
                      onMouseLeave={(e) => e.currentTarget.style.color = APP_COLORS.textMuted}
                      onClick={() => {
                        const fullDetection = `${detection.engine}/${detection.result}`;
                        navigator.clipboard.writeText(fullDetection);
                        toast.success('Copied: ' + fullDetection);
                      }}
                    />
                  </div>
                ))}
                </div>
              </ScrollArea>
                      <div 
                        className={`${TYPOGRAPHY.caption.xs} mt-2 pt-2 border-t`}
                        style={{ color: APP_COLORS.textSecondary, borderColor: `${APP_COLORS.warning}30` }}
                      >
                        💡 {suspiciousDetections.length} security vendors flagged this as suspicious
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }
