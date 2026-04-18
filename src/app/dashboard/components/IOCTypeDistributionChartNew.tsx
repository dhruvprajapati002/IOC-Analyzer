'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { Database, Loader2 } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tr } from 'zod/v4/locales';
import { apiFetch } from '@/lib/apiFetch';

interface IOCTypeData {
  type: string;
  count: number;
  color: string;
  icon: string;
}

export function IOCTypeDistributionChart() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<IOCTypeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fetch data when timeRange changes
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
          setData(result.iocTypeDistribution || []);
        }
      } catch (error) {
        console.error('Error fetching IOC type data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  const totalCount = useMemo(() => {
    return data.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : '0';

      return (
        <div
          className="rounded-xl p-4 shadow-2xl border backdrop-blur-md"
          style={{
            backgroundColor: `${APP_COLORS.surface}f5`,
            borderColor: APP_COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-3 pb-2 border-b" style={{ borderColor: APP_COLORS.borderSoft }}>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span
              className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              {item.type}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <span
                className={TYPOGRAPHY.caption.md}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Count:
              </span>
              <span
                className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {item.count.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span
                className={TYPOGRAPHY.caption.md}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Percentage:
              </span>
              <span
                className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: item.color }}
              >
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }, [totalCount]);

  // Center label for donut chart
  const CenterLabel = useCallback(() => {
    return (
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
        <tspan
          x="50%"
          dy="-0.5em"
          className={`${TYPOGRAPHY.data.md} ${TYPOGRAPHY.fontWeight.bold}`}
          fill={APP_COLORS.textPrimary}
        >
          {totalCount.toLocaleString()}
        </tspan>
        <tspan
          x="50%"
          dy="1.5em"
          className={TYPOGRAPHY.caption.sm}
          fill={APP_COLORS.textMuted}
        >
          Total IOCs
        </tspan>
      </text>
    );
  }, [totalCount]);

  // Loading state
  if (loading) {
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
                  backgroundColor: `${APP_COLORS.accentPurple}20`,
                  border: `1px solid ${APP_COLORS.accentPurple}40`,
                }}
              >
                <Database className="h-3.5 w-3.5" style={{ color: APP_COLORS.accentPurple }} />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                IOC Type Distribution
              </CardTitle>
            </div>
            <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-3 px-4">
          <div
            className="h-56 flex items-center justify-center rounded-lg border"
            style={{
              backgroundColor: APP_COLORS.surfaceSoft,
              borderColor: APP_COLORS.border,
            }}
          >
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" style={{ color: APP_COLORS.accentPurple }} />
              <p className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                Loading IOC data...
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
              className="p-1 rounded-md"
              style={{
                backgroundColor: `${APP_COLORS.accentPurple}20`,
                border: `1px solid ${APP_COLORS.accentPurple}40`,
              }}
            >
              <Database className="h-3.5 w-3.5" style={{ color: APP_COLORS.accentPurple }} />
            </div>
            <div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                IOC Type Distribution
              </CardTitle>
              <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                Breakdown by indicator type
              </p>
            </div>
          </div>

          {/* Individual Time Filter */}
          <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3 px-4">
        {data.length > 0 ? (
          <>
            {/* Donut Chart with Center Label */}
            <div className="h-44 mb-2">
              <ResponsiveContainer width="100%" height="100%" minHeight={176}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="count"
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={APP_COLORS.surface}
                        strokeWidth={2}
                        opacity={hoveredIndex === null || hoveredIndex === index ? 0.95 : 0.5}
                        style={{
                          transition: 'opacity 0.3s ease',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                    <Label content={<CenterLabel />} position="center" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* IOC Type List Grid */}
            <div className="grid grid-cols-2 gap-2">
              {data.map((item, index) => {
                const percentage = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: hoveredIndex === index ? `${item.color}10` : 'transparent',
                      borderColor: hoveredIndex === index ? `${item.color}40` : APP_COLORS.border,
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium} truncate`}
                        style={{ color: APP_COLORS.textPrimary }}
                        title={item.type}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <Badge
                        className={`${TYPOGRAPHY.caption.xs}`}
                        style={{
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                          border: `1px solid ${item.color}30`,
                        }}
                      >
                        {item.count}
                      </Badge>
                      <Badge
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`}
                        style={{
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                          border: `1px solid ${item.color}40`,
                        }}
                      >
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <NoGraphData
            icon={<Database />}
            iconColor={APP_COLORS.accentPurple}
            title="No IOC types available"
            subtitle="Data will appear as IOCs are analyzed"
          />
        )}
      </CardContent>
    </Card>
  );
}
