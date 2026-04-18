'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Loader2, Target } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';

interface ThreatVector {
  name: string;
  count: number;
  severity: string;
  detectionRate: number;
  riskLevel: string;
  color: string;
  description: string;
  percentage: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const threat = payload[0].payload;
    return (
      <div
        className="rounded-xl p-4 shadow-2xl border backdrop-blur-md max-w-xs"
        style={{
          backgroundColor: `${APP_COLORS.surface}f5`,
          borderColor: APP_COLORS.border,
        }}
      >
        <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: APP_COLORS.borderSoft }}>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: threat.color }}
          />
          <span
            className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold}`}
            style={{ color: APP_COLORS.textPrimary }}
          >
            {threat.name}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={TYPOGRAPHY.caption.md} style={{ color: APP_COLORS.textSecondary }}>
              Detections
            </span>
            <span
              className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontFamily.mono}`}
              style={{ color: threat.color }}
            >
              {threat.count.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={TYPOGRAPHY.caption.md} style={{ color: APP_COLORS.textSecondary }}>
              Detection Rate
            </span>
            <span
              className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontFamily.mono}`}
              style={{ color: APP_COLORS.success }}
            >
              {threat.detectionRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={TYPOGRAPHY.caption.md} style={{ color: APP_COLORS.textSecondary }}>
              Risk Level
            </span>
            <Badge
              className={TYPOGRAPHY.label.xs}
              style={{
                backgroundColor: `${threat.color}20`,
                color: threat.color,
                border: `1px solid ${threat.color}40`,
              }}
            >
              {threat.riskLevel}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className={TYPOGRAPHY.caption.md} style={{ color: APP_COLORS.textSecondary }}>
              Percentage
            </span>
            <span
              className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontFamily.mono}`}
              style={{ color: APP_COLORS.primary }}
            >
              {threat.percentage.toFixed(1)}%
            </span>
          </div>
          <div
            className="border-t pt-2 mt-2"
            style={{ borderColor: APP_COLORS.borderSoft }}
          >
            <p
              className={TYPOGRAPHY.caption.sm}
              style={{ color: APP_COLORS.textSecondary }}
            >
              {threat.description}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function TopThreatsGraph() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [threats, setThreats] = useState<ThreatVector[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data when timeRange changes
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await apiFetch(`/api/dashboard-v2?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();

          setThreats(result.threatVectors || []);
        }
      } catch (error) {
        console.error('Error fetching threat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  const topThreats = useMemo(() => {
    return threats
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [threats]);

  const severityStats = useMemo(() => {
    return {
      critical: topThreats.filter(t => t.severity === 'critical').length,
      high: topThreats.filter(t => t.severity === 'high').length,
      medium: topThreats.filter(t => t.severity === 'medium').length,
      total: topThreats.reduce((sum, t) => sum + t.count, 0),
    };
  }, [topThreats]);

  if (isLoading) {
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
                className="p-1.5 rounded-lg"
                style={{
                  backgroundColor: `${APP_COLORS.danger}20`,
                  border: `1px solid ${APP_COLORS.danger}40`,
                }}
              >
                <Flame className="h-4 w-4" style={{ color: APP_COLORS.danger }} />
              </div>
              <CardTitle
                className={TYPOGRAPHY.heading.h5}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Top Threat Vectors
              </CardTitle>
            </div>
            <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
          </div>
        </CardHeader>

        <CardContent className="pt-1 px-4 pb-3">
          <div className="h-[340px] flex items-center justify-center">
            <div className="text-center">
              <Loader2
                className="h-8 w-8 animate-spin mx-auto mb-2"
                style={{ color: APP_COLORS.primary }}
              />
              <p className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`} style={{ color: APP_COLORS.textSecondary }}>
                Loading threat data...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              className="p-1.5 rounded-lg"
              style={{
                backgroundColor: `${APP_COLORS.danger}20`,
                border: `1px solid ${APP_COLORS.danger}40`,
              }}
            >
              <Flame className="h-4 w-4" style={{ color: APP_COLORS.danger }} />
            </div>
            <div>
              <CardTitle
                className={TYPOGRAPHY.heading.h5}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Top Threat Vectors
              </CardTitle>
              <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                Most detected threat categories
              </p>
            </div>
          </div>

          {/* Individual Time Filter */}
          <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>

      <CardContent className="pt-1 px-4 pb-3">
        {topThreats.length > 0 ? (
          <div className="h-[340px]">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <BarChart
                  data={topThreats}
                  layout="vertical"
                  margin={{ top: 5, right: 15, bottom: 5, left: 5 }}
                >
                  <XAxis
                    type="number"
                    tick={{
                      fill: APP_COLORS.textMuted,
                      fontSize: 11,
                      fontWeight: 500,
                      fontFamily: 'monospace'
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={85}
                    tick={{
                      fill: APP_COLORS.textMuted,
                      fontSize: 11,
                      fontWeight: 600
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: `${APP_COLORS.primary}10` }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 8, 8, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {topThreats.map((threat, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={threat.color}
                        opacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div
              className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t"
              style={{ borderColor: APP_COLORS.borderSoft }}
            >
              <div className="text-center">
                <div
                  className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.danger }}
                >
                  {severityStats.critical}
                </div>
                <div className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                  Critical
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.warning }}
                >
                  {severityStats.high}
                </div>
                <div className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                  High
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: APP_COLORS.success }}
                >
                  {severityStats.medium}
                </div>
                <div className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                  Medium
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  {severityStats.total.toLocaleString()}
                </div>
                <div className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                  Total
                </div>
              </div>
            </div>
          </div>
        ) : (
          <NoGraphData
            icon={<Target />}
            iconColor={APP_COLORS.warning}
            title="No threat vectors detected"
            subtitle="Threats will appear as malicious IOCs are analyzed"
            height="h-[340px]"
          />
        )}
      </CardContent>
    </Card>
  );
}
