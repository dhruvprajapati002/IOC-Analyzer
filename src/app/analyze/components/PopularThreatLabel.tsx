'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Target, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  APP_COLORS,
  CARD_STYLES,
  THREAT_COLORS,
  STATUS_BADGE
} from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface PopularThreatLabelProps {
  label: string;
  suggestedLabel?: string;
  popularClassification?: {
    suggested_threat_label?: string;
    popular_threat_name?: Array<{count: number; value: string}>;
    popular_threat_category?: Array<{count: number; value: string}>;
  };
  threatStats: {
    totalDetections: number;
    maliciousEngines: number;
    suspiciousEngines: number;
  };
  threatOverview?: {
    totalAnalyzed: number;
    malicious: number;
    suspicious: number;
    clean: number;
  } | null;
  riskScore?: number;
  riskLevel?: 'critical' | 'high' | 'medium' | 'low';
  verdict?: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown';
  className?: string;
}

export function PopularThreatLabel({
  label,
  suggestedLabel,
  popularClassification,
  threatStats,
  threatOverview,
  riskScore,
  riskLevel,
  verdict,
  className = '',
}: PopularThreatLabelProps) {
  const getThreatSeverity = () => {
    if (riskLevel) return riskLevel;

    if (threatOverview && threatOverview.totalAnalyzed > 0) {
      const threatPercent =
        ((threatOverview.malicious + threatOverview.suspicious) /
          threatOverview.totalAnalyzed) *
        100;

      if (threatPercent > 70) return 'critical';
      if (threatPercent > 40) return 'high';
      if (threatPercent > 20) return 'medium';
      return 'low';
    }

    const threatPercent =
      (threatStats.maliciousEngines / threatStats.totalDetections) * 100;

    if (threatPercent > 70) return 'critical';
    if (threatPercent > 40) return 'high';
    if (threatPercent > 20) return 'medium';
    if (threatPercent > 0) return 'low';
    return 'clean';
  };
 
  const severity = getThreatSeverity();
  const threatColor = THREAT_COLORS[severity as keyof typeof THREAT_COLORS] || THREAT_COLORS.low;

  const getThreatMetrics = () => {
    let threatPercent: number;
    let totalEngines: number;
    let maliciousCount: number;
    let suspiciousCount: number;

    if (typeof riskScore === 'number' && riskScore >= 0 && riskScore <= 100) {
      threatPercent = riskScore;
      if (threatOverview && threatOverview.totalAnalyzed > 0) {
        totalEngines = threatOverview.totalAnalyzed;
        maliciousCount = threatOverview.malicious;
        suspiciousCount = threatOverview.suspicious;
      } else {
        totalEngines = threatStats.totalDetections;
        maliciousCount = threatStats.maliciousEngines;
        suspiciousCount = threatStats.suspiciousEngines;
      }
    } else if (threatOverview && threatOverview.totalAnalyzed > 0) {
      totalEngines = threatOverview.totalAnalyzed;
      maliciousCount = threatOverview.malicious;
      suspiciousCount = threatOverview.suspicious;
      threatPercent = ((maliciousCount + suspiciousCount) / totalEngines) * 100;
    } else {
      totalEngines = threatStats.totalDetections;
      maliciousCount = threatStats.maliciousEngines;
      suspiciousCount = threatStats.suspiciousEngines;
      threatPercent =
        ((maliciousCount + suspiciousCount) / totalEngines) * 100;
    }

    const finalRiskScore = Math.round(threatPercent);

    if (threatPercent > 70)
      return {
        level: 'CRITICAL',
        color: APP_COLORS.danger,
        bg: STATUS_BADGE.malicious,
        riskScore: finalRiskScore,
        totalEngines,
        maliciousCount,
        suspiciousCount,
      };
    if (threatPercent > 40)
      return {
        level: 'HIGH',
        color: APP_COLORS.warning,
        bg: STATUS_BADGE.suspicious,
        riskScore: finalRiskScore,
        totalEngines,
        maliciousCount,
        suspiciousCount,
      };
    if (threatPercent > 20)
      return {
        level: 'MODERATE',
        color: APP_COLORS.accentYellow,
        bg: 'bg-t-accentYellow/10 border-t-accentYellow/30',
        riskScore: finalRiskScore,
        totalEngines,
        maliciousCount,
        suspiciousCount,
      };
    return {
      level: 'LOW',
      color: APP_COLORS.success,
      bg: STATUS_BADGE.clean,
      riskScore: finalRiskScore,
      totalEngines,
      maliciousCount,
      suspiciousCount,
    };
  };

  const threatMetrics = getThreatMetrics();
  

  const cardVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  };

  return (
    <motion.div
      className={`h-full ${className}`}
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <Card
        className={`${CARD_STYLES.base} h-full border-1 transition-all hover:shadow-lg`}
        style={{
          backgroundColor: APP_COLORS.backgroundSoft,
          borderColor: APP_COLORS.border,
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {/* LEFT: Icon + Title */}
            <div className="flex items-center space-x-2.5">
              <div
                className="p-1.5 rounded-lg border"
                style={{
                  backgroundColor: `${APP_COLORS.primary}15`,
                  borderColor: `${APP_COLORS.primary}30`,
                }}
              >
                <Target
                  className="h-3.5 w-3.5"
                  style={{ color: APP_COLORS.primary }}
                />
              </div>
              <div>
                <CardTitle
                  className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}  tracking-wide`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Popular Threat Label
                </CardTitle>
              </div>
            </div>

            
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-6">
            {/* ✅ Animated Triangle Icon - REDUCED MARGIN */}
            <motion.div
              className="mb-3"
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{
                scale: 1,
                rotate: 0,
                opacity: 1,
                transition: {
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                },
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <AlertTriangle
                  className="h-20 w-20"
                  style={{
                    color: threatColor.primary,
                    filter: `drop-shadow(0 0 15px ${threatColor.primarySoft})`,
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Threat Label */}
            <motion.div
              className="text-center mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.4, duration: 0.5, ease: 'easeOut' },
              }}
            >
              <motion.div
                className={`${TYPOGRAPHY.data.xl} ${TYPOGRAPHY.fontWeight.black} uppercase tracking-wide`}
                style={{ color: threatColor.primary }}
                animate={{
                  textShadow: [
                    `0 0 15px ${threatColor.primarySoft}`,
                    `0 0 25px ${threatColor.primarySoft}`,
                    `0 0 15px ${threatColor.primarySoft}`,
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {label}
              </motion.div>
              
              {/* Suggested Threat Label (if different) */}
              {suggestedLabel && suggestedLabel.toLowerCase() !== label.toLowerCase() && (
                <div className="mt-2">
                  <div
                    className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} uppercase mb-1`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Suggested Classification
                  </div>
                  <div
                    className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`}
                    style={{ color: APP_COLORS.dangerDark }}
                  >
                    {suggestedLabel}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Subtitle */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: 0.6, duration: 0.4 },
              }}
            >
              <div
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Most commonly identified threat signature
              </div>
            </motion.div>

            <div className="w-full max-w-sm space-y-4">


              {/* ✅ Stats Row MOVED TO BOTTOM */}
              <motion.div
                className="flex items-center justify-center gap-6 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 1.2, duration: 0.4 },
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: APP_COLORS.danger }}
                  />
                  <span
                    className={`${TYPOGRAPHY.body.lg} ${TYPOGRAPHY.fontWeight.semibold}`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Malicious:
                  </span>
                  <span
                    className={`${TYPOGRAPHY.heading.h2} ${TYPOGRAPHY.fontWeight.black}`}
                    style={{ color: APP_COLORS.danger }}
                  >
                    {threatMetrics.maliciousCount}
                  </span>
                </div>

                <div
                  className="h-4 w-px"
                  style={{ backgroundColor: APP_COLORS.borderSoft }}
                />

                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: APP_COLORS.warning }}
                  />
                  <span
                    className={`${TYPOGRAPHY.body.lg} ${TYPOGRAPHY.fontWeight.semibold}`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    Suspicious:
                  </span>
                  <span
                    className={`${TYPOGRAPHY.heading.h2} ${TYPOGRAPHY.fontWeight.black}`}
                    style={{ color: APP_COLORS.warning }}
                  >
                    {threatMetrics.suspiciousCount}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
