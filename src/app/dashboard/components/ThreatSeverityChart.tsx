'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const totalValue = payload.reduce((sum: number, item: any) => sum + item.value, 0);
    return (
      <div
        className="rounded-lg p-2.5 shadow-xl border"
        style={{
          backgroundColor: APP_COLORS.backgroundSoft,
          borderColor: APP_COLORS.border,
        }}
      >
        <div className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} mb-1.5`} style={{ color: APP_COLORS.textPrimary }}>
          Threat Breakdown
        </div>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                {item.name}
              </span>
            </div>
            <span className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`} style={{ color: APP_COLORS.textPrimary }}>
              {item.value} ({((item.value / totalValue) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
        <div
          className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} mt-2 pt-1.5 border-t`}
          style={{ color: APP_COLORS.textPrimary, borderColor: APP_COLORS.borderSoft }}
        >
          Total: {totalValue}
        </div>
      </div>
    );
  }
  return null;
};

export function ThreatSeverityChart() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

          setData(result.threatIntelligence || null);
        }
      } catch (error) {
        console.error('Error fetching severity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  const threatData = useMemo(() => {
    if (!data) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

    const critical = data.totalCritical || 0;
    const high = data.totalHigh || 0;
    const medium = data.totalMedium || 0;
    const low = data.totalLow || 0;

    return { critical, high, medium, low, total: critical + high + medium + low };
  }, [data]);

  const chartData = useMemo(() => {
    if (threatData.total === 0) return [];

    return [{
      name: 'Threat Distribution',
      Critical: threatData.critical,
      High: threatData.high,
      Medium: threatData.medium,
      Low: threatData.low,
    }];
  }, [threatData]);

  if (loading) {
    return (
      <Card
        className={`${CARD_STYLES.base} transition-all duration-300 hover:shadow-lg h-full`}
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
                  backgroundColor: `${APP_COLORS.danger}20`,
                  border: `1px solid ${APP_COLORS.danger}40`,
                }}
              >
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: APP_COLORS.danger }} />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Threat Severity
              </CardTitle>
            </div>
            <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-3 px-4">
          <div
            className="h-52 flex items-center justify-center rounded-lg border"
            style={{
              backgroundColor: APP_COLORS.surfaceSoft,
              borderColor: APP_COLORS.border,
            }}
          >
            <div className="text-center">
              <Loader2
                className="h-6 w-6 mx-auto mb-2 animate-spin"
                style={{ color: APP_COLORS.primary }}
              />
              <p className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                Loading severity data...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${CARD_STYLES.base} transition-all duration-300 hover:shadow-lg h-full`}
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
                backgroundColor: `${APP_COLORS.danger}20`,
                border: `1px solid ${APP_COLORS.danger}40`,
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: APP_COLORS.danger }} />
            </div>
            <CardTitle
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Threat Severity
            </CardTitle>
          </div>

          {/* Individual Time Filter */}
          <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3 px-4">
        {threatData.total > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div
                className="p-2 rounded-lg text-center border"
                style={{
                  backgroundColor: `${APP_COLORS.danger}02`,
                  borderColor: `${APP_COLORS.danger}30`,
                }}
              >
                <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                  Critical
                </div>
                <div
                  className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                  style={{ color: APP_COLORS.danger }}
                >
                  {threatData.critical}
                </div>
                <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textDim }}>
                  {threatData.total > 0 ? ((threatData.critical / threatData.total) * 100).toFixed(0) : 0}%
                </div>
              </div>

              <div
                className="p-2 rounded-lg text-center border"
                style={{
                  backgroundColor: `${APP_COLORS.warning}08`,
                  borderColor: `${APP_COLORS.warning}30`,
                }}
              >
                <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                  High
                </div>
                <div
                  className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                  style={{ color: APP_COLORS.warning }}
                >
                  {threatData.high}
                </div>
                <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textDim }}>
                  {threatData.total > 0 ? ((threatData.high / threatData.total) * 100).toFixed(0) : 0}%
                </div>
              </div>

              <div
                className="p-2 rounded-lg text-center border"
                style={{
                  backgroundColor: `${APP_COLORS.accentPurple}08`,
                  borderColor: `${APP_COLORS.accentPurple}30`,
                }}
              >
                <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                  Medium
                </div>
                <div
                  className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                  style={{ color: APP_COLORS.accentPurple }}
                >
                  {threatData.medium}
                </div>
                <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textDim }}>
                  {threatData.total > 0 ? ((threatData.medium / threatData.total) * 100).toFixed(0) : 0}%
                </div>
              </div>

              <div
                className="p-2 rounded-lg text-center border"
                style={{
                  backgroundColor: `${APP_COLORS.success}08`,
                  borderColor: `${APP_COLORS.success}30`,
                }}
              >
                <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                  Low
                </div>
                <div
                  className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                  style={{ color: APP_COLORS.success }}
                >
                  {threatData.low}
                </div>
                <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textDim }}>
                  {threatData.total > 0 ? ((threatData.low / threatData.total) * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>

            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%" minHeight={224}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, bottom: 10, left: 80 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: APP_COLORS.textSecondary, fontSize: 10 }}
                    axisLine={{ stroke: APP_COLORS.border }}
                    tickLine={{ stroke: APP_COLORS.border }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: APP_COLORS.textSecondary, fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: APP_COLORS.border }}
                    tickLine={{ stroke: APP_COLORS.border }}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: `${APP_COLORS.primary}10` }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" iconSize={8} />
                  <Bar dataKey="Critical" stackId="a" fill={APP_COLORS.danger} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="High" stackId="a" fill={APP_COLORS.warning} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Medium" stackId="a" fill={APP_COLORS.accentPurple} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Low" stackId="a" fill={APP_COLORS.success} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <NoGraphData
            icon={<Shield />}
            iconColor={APP_COLORS.danger}
            title="No severity data available"
            subtitle="Threat severity will appear as IOCs are analyzed"
            height="h-52"
          />
        )}
      </CardContent>
    </Card>
  );
}
