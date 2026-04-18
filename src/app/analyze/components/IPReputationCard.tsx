'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  MapPin,
  ExternalLink,
  Shield,
  Info,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Wifi,
  Building2,
  Navigation,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  APP_COLORS,
  CARD_STYLES,
  RISK_COLORS
} from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import * as Flags from 'country-flag-icons/react/3x2';
import { hasFlag } from 'country-flag-icons';

interface IPReputationCardProps {
  ipReputation: Array<{
    ip: string;
    reputation: {
      riskScore: number;
      verdict: string;
      riskLevel: string;
      confidence: number;
      riskDetails?: {
        badge: string;
        label: string;
        description: string;
        recommendation: string;
      };
    };
    geolocation: {
      countryName: string;
      countryCode?: string;
      city: string;
      region: string;
      isp: string;
      asn: string;
      asnName?: string;
      latitude: number;
      longitude: number;
      timezone?: string;
    };
     // ✅ Add this
    abuseipdb?: {
      abuseConfidenceScore: number;
      usageType: string;
      isWhitelisted: boolean;
      totalReports: number;
    };
    threats?: {
      categories: string[];
      tags?: string[];
    };
  }>;
}

function CountryFlagIcon({ countryCode, className, style }: { countryCode: string; className?: string; style?: React.CSSProperties }) {
  const upperCode = countryCode?.toUpperCase() || 'XX';
  
  if (!hasFlag(upperCode)) {
    return (
      <div className={className} style={style}>
        <span style={{ fontSize: '1.5rem' }}>🌐</span>
      </div>
    );
  }
  
  const FlagComponent = Flags[upperCode as keyof typeof Flags];
  
  if (!FlagComponent) {
    return (
      <div className={className} style={style}>
        <span style={{ fontSize: '1.5rem' }}>🌐</span>
      </div>
    );
  }
  
  return <FlagComponent className={className} style={style} title={countryCode} />;
}

function safeRenderGeoValue(value: any, countryCode?: string): string {
  // Handle string values
  if (typeof value === 'string' && value && value !== 'Unknown') return value;
  
  // Handle object with names.en property
  if (typeof value === 'object' && value?.names?.en) return value.names.en;
  
  // Handle object with names property (get first available language)
  if (typeof value === 'object' && value?.names && typeof value.names === 'object') {
    const firstValue = Object.values(value.names)[0] as string;
    if (firstValue && firstValue !== 'Unknown') return firstValue;
  }
  
  // Handle object with name property (common in some APIs)
  if (typeof value === 'object' && value?.name) {
    if (typeof value.name === 'string') return value.name;
    if (typeof value.name === 'object' && value.name?.en) return value.name.en;
  }
  
  // Fallback to countryCode if provided
  if (countryCode && countryCode !== 'XX') {
    // Get country name from country code using Intl API
    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const countryName = regionNames.of(countryCode.toUpperCase());
      if (countryName) return countryName;
    } catch (e) {
      // Fallback silently
    }
  }
  
  // Final fallback
  return value?.toString() || 'Unknown';
}

function getRiskScoreColor(riskScore: number) {
  if (riskScore >= 75) return RISK_COLORS.critical.primary;
  if (riskScore >= 50) return RISK_COLORS.high.primary;
  if (riskScore >= 25) return RISK_COLORS.medium.primary;
  if (riskScore > 0) return RISK_COLORS.low.primary;
  return RISK_COLORS.clean.primary;
}

function getRiskLevelIcon(riskScore: number, color: string) {
  const iconClass = 'h-4 w-4';
  const style = { color };

  if (riskScore >= 75) return <AlertCircle className={iconClass} style={style} />;
  if (riskScore >= 50) return <AlertTriangle className={iconClass} style={style} />;
  if (riskScore >= 25) return <TrendingUp className={iconClass} style={style} />;
  return <Shield className={iconClass} style={style} />;
}

export function IPReputationCard({ ipReputation }: IPReputationCardProps) {
  if (!ipReputation || ipReputation.length === 0) return null;

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardHeader className="p-0">
        {ipReputation.map((ipData, index) => {
          const riskScore = ipData.reputation.riskScore || 0;
          const riskColor = getRiskScoreColor(riskScore);

          const countryCode = ipData.geolocation.countryCode || 'XX';
          const countryValue = safeRenderGeoValue(ipData.geolocation.countryName, countryCode);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* ✅ COMPACT Header Section */}
              <div
                className="px-4 py-2.5 border-0 flex items-center justify-between"
                style={{
                  borderColor: APP_COLORS.border,
                }}
              >
                {/* Left: Card Title */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{
                      backgroundColor: `${APP_COLORS.primary}15`,
                      border: `1px solid ${APP_COLORS.primary}30`,
                    }}
                  >
                    <Globe className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
                  </div>
                  <div className={`${TYPOGRAPHY.heading.h3} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                    IP Reputation Analysis
                  </div>
                </div>

                {/* Center: IP + Verdict + Flag */}
                <div className="flex items-center gap-2.5">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                  >
                    {getRiskLevelIcon(riskScore, riskColor)}
                  </motion.div>

                  <div>
                    <motion.div
                      className={`${TYPOGRAPHY.data.xs} ${TYPOGRAPHY.fontWeight.black} ${TYPOGRAPHY.fontFamily.mono} leading-none`}
                      style={{ color: APP_COLORS.primary }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {ipData.ip}
                    </motion.div>
                    <motion.div
                      className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wide`}
                      style={{ color: riskColor }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      {ipData.reputation.verdict}
                    </motion.div>
                  </div>

                  {/* ✅ Flag WITHOUT background - just the flag */}
                  <motion.div
                    className="flex items-center justify-center"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, type: 'spring' }}
                  >
                    <CountryFlagIcon 
                      countryCode={countryCode} 
                      className="w-8 h-6 rounded shadow-sm"
                      style={{ objectFit: 'cover' }}
                    />
                  </motion.div>
                </div>

                {/* Right: Creative Risk Score Badge */}
                <motion.div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 shadow-sm"
                  style={{
                    backgroundColor: `${riskColor}10`,
                    borderColor: riskColor,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                >
                  {/* Animated pulsing dot */}
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: riskColor }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.6, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  
                  {/* Score */}
                  <motion.div
                    className={`${TYPOGRAPHY.data.md} ${TYPOGRAPHY.fontWeight.black} ${TYPOGRAPHY.fontFamily.mono} leading-none`}
                    style={{ color: riskColor }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, type: 'spring', bounce: 0.5 }}
                  >
                    {riskScore}
                  </motion.div>
                  
                  {/* Label */}
                  <div
                    className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase`}
                    style={{ color: riskColor }}
                  >
                    RISK
                  </div>
                </motion.div>
              </div>

              {/* Content Grid - 4 Columns */}
              <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Location */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4" style={{ color: APP_COLORS.accentCyan }} />
                    <span className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase`} style={{ color: APP_COLORS.textSecondary }}>
                      Location
                    </span>
                  </div>
                  <div className={`${TYPOGRAPHY.body.lg} ${TYPOGRAPHY.fontWeight.bold} mb-1`} style={{ color: APP_COLORS.textPrimary }}>
                    {safeRenderGeoValue(ipData.geolocation.city)}
                  </div>
                  <div className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.medium} mb-2`} style={{ color: APP_COLORS.textSecondary }}>
                    {safeRenderGeoValue(ipData.geolocation.region)}
                  </div>
                  <div className="flex items-center gap-2">
                    <CountryFlagIcon 
                      countryCode={countryCode} 
                      className="w-7 h-5 rounded flex-shrink-0 shadow-sm"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold}`} style={{ color: APP_COLORS.textPrimary }}>
                      {countryValue}
                    </div>
                  </div>
                </div>

                {/* Coordinates */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="h-4 w-4" style={{ color: APP_COLORS.accentCyan }} />
                    <span className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase`} style={{ color: APP_COLORS.textSecondary }}>
                      Coordinates
                    </span>
                  </div>
                  <div className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold} ${TYPOGRAPHY.fontFamily.mono} mb-1`} style={{ color: APP_COLORS.textPrimary }}>
                    {ipData.geolocation.latitude.toFixed(4)}
                  </div>
                  <div className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.semibold} ${TYPOGRAPHY.fontFamily.mono} mb-2`} style={{ color: APP_COLORS.textPrimary }}>
                    {ipData.geolocation.longitude.toFixed(4)}
                  </div>
                  {ipData.geolocation.timezone && (
                    <div className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} mb-2`} style={{ color: APP_COLORS.textSecondary }}>
                      🕐 {ipData.geolocation.timezone}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const mapsUrl = `https://www.google.com/maps?q=${ipData.geolocation.latitude},${ipData.geolocation.longitude}`;
                      window.open(mapsUrl, '_blank');
                    }}
                    className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} inline-flex items-center gap-1 transition-opacity hover:opacity-70`}
                    style={{ color: APP_COLORS.accentCyan }}
                  >
                    View Map <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Network */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wifi className="h-4 w-4" style={{ color: APP_COLORS.accentBlue }} />
                    <span className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase`} style={{ color: APP_COLORS.textSecondary }}>
                      Network
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className={`${TYPOGRAPHY.label.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase mb-1`} style={{ color: APP_COLORS.textDim }}>
                        ISP
                      </div>
                      <div className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
                        {safeRenderGeoValue(ipData.geolocation.isp)}
                      </div>
                    </div>
                    <div>
                      <div className={`${TYPOGRAPHY.label.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase mb-1`} style={{ color: APP_COLORS.textDim }}>
                        ASN
                      </div>
                      <div className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`} style={{ color: APP_COLORS.textPrimary }}>
                        {safeRenderGeoValue(ipData.geolocation.asn)}
                      </div>
                      {ipData.geolocation.asnName && (
                        <div className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} mt-1`} style={{ color: APP_COLORS.textSecondary }}>
                          {ipData.geolocation.asnName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

               {/* Risk Analysis + AbuseIPDB */}
<div>
  <div className="flex items-center gap-2 mb-3">
    <Activity className="h-4 w-4" style={{ color: riskColor }} />
    <span className={`${TYPOGRAPHY.label.sm} ${TYPOGRAPHY.fontWeight.bold} uppercase`} style={{ color: APP_COLORS.textSecondary }}>
      Risk Analysis
    </span>
  </div>
  
  
  {/* AbuseIPDB Data - Add this section */}
  {ipData.abuseipdb && (
    <div className="space-y-2 mt-3">
      
      
      {/* Abuse Confidence Score */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium}`} style={{ color: APP_COLORS.textSecondary }}>
            Confidence
          </span>
          <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.black}`} style={{ color: riskColor }}>
            {ipData.abuseipdb.abuseConfidenceScore}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: APP_COLORS.borderSoft }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ 
              backgroundColor: ipData.abuseipdb.abuseConfidenceScore >= 75 ? RISK_COLORS.critical.primary :
                             ipData.abuseipdb.abuseConfidenceScore >= 50 ? RISK_COLORS.high.primary :
                             ipData.abuseipdb.abuseConfidenceScore >= 25 ? RISK_COLORS.medium.primary :
                             RISK_COLORS.low.primary
            }}
            initial={{ width: 0 }}
            animate={{ width: `${ipData.abuseipdb.abuseConfidenceScore}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>

      {/* Total Reports */}
      <div className="flex items-center justify-between">
        <span className={`${TYPOGRAPHY.caption.lg} ${TYPOGRAPHY.fontWeight.medium}`} style={{ color: APP_COLORS.textSecondary }}>
          Reports
        </span>
        <span className={`${TYPOGRAPHY.caption.lg} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
          {ipData.abuseipdb.totalReports}
        </span>
      </div>

      {/* Usage Type */}
      <div>
        <span className={`${TYPOGRAPHY.caption.lg} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textSecondary }}>
          Usage Type
        </span>
        <br />
        <span className={`${TYPOGRAPHY.caption.lg} ${TYPOGRAPHY.fontWeight.medium}`} style={{ color: APP_COLORS.textPrimary }}>
          {ipData.abuseipdb.usageType}
        </span>
      </div>
    </div>
  )}

  {/* Risk Details (if available) */}
  {ipData.reputation.riskDetails && (
    <div
      className={`${TYPOGRAPHY.body.xs} ${TYPOGRAPHY.fontWeight.semibold} flex items-start gap-2 p-2 rounded-lg border mt-2`}
      style={{
        backgroundColor: riskColor + '10',
        borderColor: riskColor + '30',
        color: riskColor,
      }}
    >
      <span className="flex-shrink-0">💡</span>
      <span className="line-clamp-2">{ipData.reputation.riskDetails.recommendation}</span>
    </div>
  )}
</div>

              </div>

              {/* Compact Confidence Footer */}
              {/* {ipData.reputation.confidence !== undefined && (
                <div
                  className="px-5 py-2 border-t flex items-center gap-3"
                  style={{
                    borderColor: APP_COLORS.border,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" style={{ color: APP_COLORS.textSecondary }} />
                    <span className={`${TYPOGRAPHY.label.xs} ${TYPOGRAPHY.fontWeight.semibold} uppercase`} style={{ color: APP_COLORS.textSecondary }}>
                      Confidence
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="h-1.5 flex-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: APP_COLORS.borderSoft }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: APP_COLORS.success }}
                        initial={{ width: 0 }}
                        animate={{ width: `${ipData.reputation.confidence * 100}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <span className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.black} ${TYPOGRAPHY.fontFamily.mono}`} style={{ color: APP_COLORS.textPrimary }}>
                      {(ipData.reputation.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )} */}
            </motion.div>
          );
        })}
      </CardHeader>
    </Card>
  );
}
