'use client';

import { Globe } from 'lucide-react';
import {
  APP_COLORS,
  CHART_COLORS,
  RISK_COLORS,
  STATUS_BADGE,
  BUTTON_STYLES,
  INPUT_STYLES,
  SHADOWS,
  LOADING_STYLES,
} from '@/lib/colors';
import { CardShell } from '@/app/analyze/components/cards/CardShell';
import { formatDateTime } from '@/app/analyze/utils/analyzeFormatters';

interface IPReputationCardProps {
  data: Array<{
    ip: string;
    reputation: {
      riskScore: number;
      verdict: string;
      riskLevel: string;
      confidence?: number;
    };
    geolocation?: {
      countryName?: string;
      countryCode?: string;
      city?: string;
      region?: string;
      isp?: string;
      asn?: string;
      asnName?: string;
      timezone?: string;
    };
    abuseipdb?: {
      abuseConfidenceScore?: number;
      totalReports?: number;
      numDistinctUsers?: number;
      lastReportedAt?: string;
      usageType?: string;
    };
  }>;
}

function scoreColor(score: number) {
  if (score > 70) return RISK_COLORS.critical.primary;
  if (score >= 40) return APP_COLORS.warning;
  return APP_COLORS.success;
}

export function IPReputationCard({ data }: IPReputationCardProps) {
  const item = data[0];
  if (!item) return null;

  const abuseScore = item.abuseipdb?.abuseConfidenceScore || 0;
  const abuseColor = scoreColor(abuseScore);

  return (
    <CardShell
      title="IP Reputation & Geolocation"
      icon={<Globe className="h-4 w-4" />}
      iconColor={APP_COLORS.accentCyan}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌐</span>
            <div>
              <p className="text-lg font-bold" style={{ color: APP_COLORS.textPrimary }}>
                {item.geolocation?.countryName || 'Unknown Country'}
              </p>
              <p className="text-sm" style={{ color: APP_COLORS.textSecondary }}>
                {item.geolocation?.city || 'Unknown City'}, {item.geolocation?.region || 'Unknown Region'}
              </p>
            </div>
          </div>

          <p className="text-xs font-mono" style={{ color: APP_COLORS.textSecondary }}>
            ISP: {item.geolocation?.isp || 'Unknown'}
          </p>
          <p className="text-xs font-mono" style={{ color: APP_COLORS.textSecondary }}>
            Organization: {item.geolocation?.asnName || 'Unknown'}
          </p>

          <span
            className="inline-flex rounded-full px-2 py-1 text-xs font-mono"
            style={{ backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.textPrimary }}
          >
            ASN: {item.geolocation?.asn || 'N/A'}
          </span>

          <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
            Timezone: {item.geolocation?.timezone || 'Unknown'}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>
            Abuse Intelligence
          </p>

          <div>
            <p className="text-3xl font-black" style={{ color: abuseColor }}>
              {abuseScore}
            </p>
            <div className="mt-2 h-1.5 rounded" style={{ backgroundColor: APP_COLORS.borderSoft }}>
              <div
                className="h-1.5 rounded transition-all"
                style={{ width: `${Math.min(100, Math.max(0, abuseScore))}%`, backgroundColor: abuseColor }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <p style={{ color: APP_COLORS.textSecondary }}>
              Total Reports: <span style={{ color: APP_COLORS.textPrimary }}>{item.abuseipdb?.totalReports || 0}</span>
            </p>
            <p style={{ color: APP_COLORS.textSecondary }}>
              Distinct Reporters: <span style={{ color: APP_COLORS.textPrimary }}>{item.abuseipdb?.numDistinctUsers || 0}</span>
            </p>
            <p style={{ color: APP_COLORS.textSecondary }}>
              Last Reported: <span style={{ color: APP_COLORS.textPrimary }}>{formatDateTime(item.abuseipdb?.lastReportedAt)}</span>
            </p>
            <p style={{ color: APP_COLORS.textSecondary }}>
              Usage Type: <span style={{ color: APP_COLORS.textPrimary }}>{item.abuseipdb?.usageType || 'Unknown'}</span>
            </p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}
