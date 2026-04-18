'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, AlertTriangle, Shield, Clock } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/apiFetch';

interface ThreatItem {
  ioc: string;
  type: string;
  verdict: string;
  timestamp: string;
  severity: string;
}

export function RealTimeThreatFeed() {
  const { token } = useAuth();
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentThreats = async () => {
      if (!token) return;

      try {
        const response = await apiFetch('/api/dashboard-v2?range=daily', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          // Mock recent threats - you'd fetch this from a dedicated endpoint
          const mockThreats: ThreatItem[] = [
            { ioc: '192.168.1.100', type: 'IP', verdict: 'malicious', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), severity: 'critical' },
            { ioc: 'malware-site.com', type: 'Domain', verdict: 'suspicious', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), severity: 'high' },
            { ioc: 'abc123...', type: 'Hash', verdict: 'malicious', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), severity: 'critical' },
          ];
          setThreats(mockThreats);
        }
      } catch (error) {
        console.error('Error fetching threats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentThreats();
    const interval = setInterval(fetchRecentThreats, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [token]);

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'malicious': return APP_COLORS.danger;
      case 'suspicious': return APP_COLORS.warning;
      default: return APP_COLORS.textMuted;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all hover:shadow-lg h-full`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-md animate-pulse"
              style={{
                backgroundColor: `${APP_COLORS.danger}20`,
                border: `1px solid ${APP_COLORS.danger}40`,
              }}
            >
              <Radio className="h-3.5 w-3.5" style={{ color: APP_COLORS.danger }} />
            </div>
            <div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Live Threat Feed
              </CardTitle>
              <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                Real-time threat detections
              </p>
            </div>
          </div>
          <Badge
            className={`${TYPOGRAPHY.caption.xs} px-2 py-0.5`}
            style={{
              backgroundColor: `${APP_COLORS.success}15`,
              color: APP_COLORS.success,
              border: `1px solid ${APP_COLORS.success}30`,
            }}
          >
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3 px-4">
        <div className="space-y-2">
          {threats.length > 0 ? (
            threats.map((threat, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg border transition-all hover:border-opacity-60"
                style={{
                  backgroundColor: APP_COLORS.surfaceSoft,
                  borderColor: getVerdictColor(threat.verdict) + '30',
                }}
              >
                <AlertTriangle
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: getVerdictColor(threat.verdict) }}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.semibold} truncate`}
                    style={{ color: APP_COLORS.textPrimary }}
                  >
                    {threat.ioc}
                  </p>
                  <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                    {threat.type} • {threat.verdict}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="h-3 w-3" style={{ color: APP_COLORS.textSecondary }} />
                  <span
                    className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontFamily.mono}`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    {getTimeAgo(threat.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <NoGraphData
              icon={<Shield />}
              iconColor={APP_COLORS.textSecondary}
              title="No recent threats detected"
              height="h-32"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
