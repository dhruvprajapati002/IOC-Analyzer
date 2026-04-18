'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Globe, Eye, Database } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface MultiSourceDataCardProps {
  multiSourceData: {
    virustotal?: any;
    greynoise?: any;
    ipqs?: any;
    threatfox?: any;
    malwarebazaar?: any;
    urlhaus?: any;
  } | null;
  sources_available?: string[];
  sources_failed?: string[];
}

export function MultiSourceDataCard({
  multiSourceData,
}: MultiSourceDataCardProps) {
  if (
    !multiSourceData ||
    Object.keys(multiSourceData).filter(
      (k) => multiSourceData[k as keyof typeof multiSourceData],
    ).length === 0
  ) {
    return null;
  }

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'virustotal':
        return Shield;
      case 'greynoise':
        return Globe;
      case 'ipqualityscore':
      case 'ipqs':
        return Eye;
      case 'threatfox':
      case 'malwarebazaar':
      case 'urlhaus':
        return Database;
      default:
        return Shield;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'malicious':
        return APP_COLORS.danger;
      case 'suspicious':
        return APP_COLORS.warning;
      case 'clean':
      case 'harmless':
        return APP_COLORS.success;
      default:
        return APP_COLORS.textMuted;
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case 'malicious':
        return XCircle;
      case 'suspicious':
        return AlertTriangle;
      case 'clean':
      case 'harmless':
        return CheckCircle2;
      default:
        return Shield;
    }
  };

  const sources = [
    {
      name: 'VirusTotal',
      key: 'virustotal',
      data: multiSourceData.virustotal,
      getVerdict: (d: any) => d?.verdict || 'unknown',
      getDetails: (d: any) => {
        const items: { label: string; value: string }[] = [];
        
        if (d?.stats) {
          const total =
            (d.stats.malicious || 0) +
            (d.stats.harmless || 0) +
            (d.stats.suspicious || 0) +
            (d.stats.undetected || 0);
          items.push({
            label: 'Engines',
            value: `${d.stats.malicious || 0} malicious / ${total} total`,
          });
        }
        
        if (d?.categories && d.categories.length > 0) {
          items.push({
            label: 'Categories',
            value: d.categories.slice(0, 3).join(', '),
          });
        }
        
        if (d?.popular_threat_label || d?.suggested_threat_label) {
          items.push({
            label: 'Threat Label',
            value: d.popular_threat_label || d.suggested_threat_label,
          });
        }
        
        return items;
      },
    },
    {
      name: 'GreyNoise',
      key: 'greynoise',
      data: multiSourceData.greynoise,
      getVerdict: (d: any) => d?.classification || d?.verdict || 'unknown',
      getDetails: (d: any) => {
        const items: { label: string; value: string }[] = [];
        
        if (d?.classification) {
          items.push({ label: 'Classification', value: d.classification });
        }
        
        if (d?.name) {
          items.push({ label: 'Actor', value: d.name });
        }
        
        if (d?.noise !== undefined) {
          items.push({ label: 'Noise', value: d.noise ? 'Yes' : 'No' });
        }
        
        if (d?.riot !== undefined) {
          items.push({ label: 'RIOT', value: d.riot ? 'Yes' : 'No' });
        }
        
        if (d?.last_seen) {
          items.push({
            label: 'Last Seen',
            value: new Date(d.last_seen).toLocaleDateString(),
          });
        }
        
        if (d?.tags && d.tags.length > 0) {
          items.push({ label: 'Tags', value: d.tags.slice(0, 3).join(', ') });
        }
        
        return items;
      },
    },
    {
      name: 'IPQualityScore',
      key: 'ipqs',
      data: multiSourceData.ipqs,
      getVerdict: (d: any) => {
        const score = d?.fraud_score || 0;
        if (score > 75) return 'malicious';
        if (score > 50) return 'suspicious';
        if (score > 0) return 'clean';
        return 'unknown';
      },
      getDetails: (d: any) => {
        const items: { label: string; value: string }[] = [];
        
        if (typeof d?.fraud_score === 'number') {
          items.push({ label: 'Fraud Score', value: `${d.fraud_score}%` });
        }
        
        if (d?.is_tor !== undefined || d?.tor !== undefined) {
          const isTor = d?.is_tor || d?.tor;
          items.push({ label: 'Tor', value: isTor ? 'Yes' : 'No' });
        }
        
        if (d?.is_vpn !== undefined || d?.vpn !== undefined) {
          const isVpn = d?.is_vpn || d?.vpn;
          items.push({ label: 'VPN', value: isVpn ? 'Yes' : 'No' });
        }
        
        if (d?.is_proxy !== undefined || d?.proxy !== undefined) {
          const isProxy = d?.is_proxy || d?.proxy;
          items.push({ label: 'Proxy', value: isProxy ? 'Yes' : 'No' });
        }
        
        if (d?.bot_status !== undefined) {
          items.push({ label: 'Bot', value: d.bot_status ? 'Yes' : 'No' });
        }
        
        if (d?.ISP) {
          items.push({ label: 'ISP', value: d.ISP });
        }
        
        if (d?.recent_abuse) {
          items.push({ label: 'Recent Abuse', value: '⚠ Yes' });
        }
        
        if (d?.is_crawler) {
          items.push({ label: 'Crawler', value: '🤖 Yes' });
        }
        
        return items;
      },
    },
    {
      name: 'ThreatFox',
      key: 'threatfox',
      data: multiSourceData.threatfox,
      getVerdict: (d: any) => (d ? 'malicious' : 'unknown'),
      getDetails: (d: any) => {
        const items: { label: string; value: string }[] = [];
        
        if (d?.threat_type) {
          items.push({ label: 'Threat Type', value: d.threat_type });
        }
        
        if (d?.malware_printable) {
          items.push({ label: 'Malware', value: d.malware_printable });
        }
        
        if (d?.malware) {
          items.push({ label: 'Family', value: d.malware });
        }
        
        if (d?.confidence_level) {
          items.push({ label: 'Confidence', value: `${d.confidence_level}%` });
        }
        
        if (d?.first_seen) {
          items.push({
            label: 'First Seen',
            value: new Date(d.first_seen).toLocaleDateString(),
          });
        }
        
        if (d?.tags && Array.isArray(d.tags) && d.tags.length > 0) {
          items.push({ label: 'Tags', value: d.tags.slice(0, 3).join(', ') });
        }
        
        return items;
      },
    },
    {
      name: 'MalwareBazaar',
      key: 'malwarebazaar',
      data: multiSourceData.malwarebazaar,
      getVerdict: (d: any) => (d ? 'malicious' : 'unknown'),
      getDetails: (d: any) => {
        const items: { label: string; value: string }[] = [];
        
        if (d?.signature) {
          items.push({ label: 'Signature', value: d.signature });
        }
        
        if (d?.file_type) {
          items.push({ label: 'File Type', value: d.file_type });
        }
        
        if (d?.file_name) {
          items.push({ label: 'File Name', value: d.file_name });
        }
        
        if (d?.file_size) {
          items.push({
            label: 'File Size',
            value: `${(d.file_size / 1024).toFixed(1)} KB`,
          });
        }
        
        if (d?.first_seen) {
          items.push({
            label: 'First Seen',
            value: new Date(d.first_seen).toLocaleDateString(),
          });
        }
        
        if (d?.tags && Array.isArray(d.tags) && d.tags.length > 0) {
          items.push({ label: 'Tags', value: d.tags.slice(0, 3).join(', ') });
        }
        
        return items;
      },
    },
    {
      name: 'URLhaus',
      key: 'urlhaus',
      data: multiSourceData.urlhaus,
      getVerdict: (d: any) =>
        d?.url_status === 'online'
          ? 'malicious'
          : d?.url_status === 'offline'
          ? 'suspicious'
          : 'unknown',
      getDetails: (d: any) => {
        const items: { label: string; value: string }[] = [];
        
        if (d?.threat) {
          items.push({ label: 'Threat', value: d.threat });
        }
        
        if (d?.url_status) {
          items.push({ label: 'Status', value: d.url_status.toUpperCase() });
        }
        
        if (d?.host) {
          items.push({ label: 'Host', value: d.host });
        }
        
        if (d?.date_added) {
          items.push({
            label: 'Date Added',
            value: new Date(d.date_added).toLocaleDateString(),
          });
        }
        
        if (d?.reporter) {
          items.push({ label: 'Reporter', value: d.reporter });
        }
        
        if (d?.tags && Array.isArray(d.tags) && d.tags.length > 0) {
          items.push({ label: 'Tags', value: d.tags.slice(0, 3).join(', ') });
        }
        
        return items;
      },
    },
  ].filter((s) => s.data);

  if (sources.length === 0) return null;

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-md"
            style={{
              backgroundColor: `${APP_COLORS.primary}20`,
              border: `1px solid ${APP_COLORS.primary}40`,
            }}
          >
            <Database
              className="h-4 w-4"
              style={{ color: APP_COLORS.primary }}
            />
          </div>
          <CardTitle
            className={`${TYPOGRAPHY.heading.h3}`}
            style={{ color: APP_COLORS.textPrimary }}
          >
            Cyber Intelligence Analysis
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-1 pb-4 px-4">
        <div className="space-y-3">
          {sources.map((source) => {
            const Icon = getSourceIcon(source.key);
            const verdict = source.getVerdict(source.data);
            const verdictColor = getVerdictColor(verdict);
            const VerdictIcon = getVerdictIcon(verdict);
            const details = source.getDetails(source.data);

            return (
              <div
                key={source.key}
                className="rounded-lg border  px-3 py-3 transition-all duration-200 "
                style={{
                  backgroundColor: `${APP_COLORS.surface}`,
                  borderColor: APP_COLORS.border,
                }}
              
              >
                {/* Header with icon and verdict */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="p-1.5 rounded-md"
                    style={{
                      backgroundColor: `${verdictColor}15`,
                      border: `1px solid ${verdictColor}40`,
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: verdictColor }}
                    />
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${verdictColor}20`,
                      color: verdictColor,
                    }}
                  >
                    <VerdictIcon className="h-3 w-3" />
                    {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
                  </span>
                </div>

                {/* Details in rows */}
                {details && details.length > 0 && (
                  <div className="space-y-2">
                    {details.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span
                          className={`${TYPOGRAPHY.body.sm} font-medium min-w-[100px]`}
                          style={{ color: APP_COLORS.textSecondary }}
                        >
                          {item.label}:
                        </span>
                        <span
                          className={`${TYPOGRAPHY.body.sm} flex-1`}
                          style={{ color: APP_COLORS.textPrimary }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
