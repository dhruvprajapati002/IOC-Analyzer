'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import { apiFetch } from '@/lib/apiFetch';

interface RiskDataPoint {
  date: string;
  score: number;
  threats: number;
}

export function RiskScoreTrend() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<RiskDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const response = await apiFetch(`/api/dashboard-v2?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();

          // Calculate risk score from daily trends
          const riskData: RiskDataPoint[] = (result.dailyTrends || []).map((day: any) => {
            const threatRatio = day.total > 0 ? (day.threats / day.total) * 100 : 0;
            return {
              date: new Date(day.dateLabel).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              score: Math.round(threatRatio),
              threats: day.threats,
            };
          });

          setData(riskData);
        }
      } catch (error) {
        console.error('Error fetching risk data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  const stats = useMemo(() => {
    if (data.length === 0) return { current: 0, trend: 0, status: 'stable' };

    const current = data[data.length - 1]?.score || 0;
    const previous = data[0]?.score || 0;
    const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    const status = trend > 10 ? 'increasing' : trend < -10 ? 'decreasing' : 'stable';

    return { current, trend, status };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="px-3 py-2 rounded-lg border shadow-lg"
          style={{
            backgroundColor: APP_COLORS.backgroundSoft,
            borderColor: APP_COLORS.border,
          }}
        >
          <p className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} mb-1`} style={{ color: APP_COLORS.textPrimary }}>
            {data.date}
          </p>
          <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.danger }}>
            Risk Score: {data.score}%
          </p>
          <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
            Threats: {data.threats}
          </p>
        </div>
      );
    }
    return null;
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return APP_COLORS.danger;
    if (score >= 40) return APP_COLORS.warning;
    return APP_COLORS.success;
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
              className="p-1 rounded-md"
              style={{
                backgroundColor: `${getRiskColor(stats.current)}20`,
                border: `1px solid ${getRiskColor(stats.current)}40`,
              }}
            >
              <Activity className="h-3.5 w-3.5" style={{ color: getRiskColor(stats.current) }} />
            </div>
            <div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Risk Score Trend
              </CardTitle>
              <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                Security posture over time
              </p>
            </div>
          </div>
          <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3 px-4">
        {!loading && data.length === 0 ? (
          <NoGraphData
            icon={<Activity />}
            iconColor={APP_COLORS.success}
            title="No risk score data"
            subtitle="Data will appear as IOCs are analyzed"
          />
        ) : (
        <>
        {/* Current Risk Score */}
        <div
          className="flex items-center justify-between p-3 rounded-lg border mb-3"
          style={{
            backgroundColor: `${getRiskColor(stats.current)}10`,
            borderColor: `${getRiskColor(stats.current)}30`,
          }}
        >
          <div>
            <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
              Current Risk Score
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={`${TYPOGRAPHY.data.lg} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: getRiskColor(stats.current) }}
              >
                {stats.current}%
              </span>
              {stats.status !== 'stable' && (
                <div className="flex items-center gap-1">
                  {stats.status === 'increasing' ? (
                    <TrendingUp className="h-3.5 w-3.5" style={{ color: APP_COLORS.danger }} />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" style={{ color: APP_COLORS.success }} />
                  )}
                  <span
                    className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold}`}
                    style={{ color: stats.status === 'increasing' ? APP_COLORS.danger : APP_COLORS.success }}
                  >
                    {Math.abs(stats.trend).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full ${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`}
            style={{
              backgroundColor: getRiskColor(stats.current),
              color: APP_COLORS.textPrimary,
            }}
          >
            {stats.current >= 70 ? 'High Risk' : stats.current >= 40 ? 'Medium Risk' : 'Low Risk'}
          </div>
        </div>

        {/* Trend Chart */}
        <ResponsiveContainer width="100%" height={180} minHeight={180}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getRiskColor(stats.current)} stopOpacity={0.3} />
                <stop offset="95%" stopColor={getRiskColor(stats.current)} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: APP_COLORS.textMuted, fontSize: 10 }}
              axisLine={{ stroke: APP_COLORS.border }}
            />
            <YAxis
              tick={{ fill: APP_COLORS.textMuted, fontSize: 10 }}
              axisLine={{ stroke: APP_COLORS.border }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke={getRiskColor(stats.current)}
              strokeWidth={2}
              fill="url(#riskGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
        </>
        )}
      </CardContent>
    </Card>
  );
}
