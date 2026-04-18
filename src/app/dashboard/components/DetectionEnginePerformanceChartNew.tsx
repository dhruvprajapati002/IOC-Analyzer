'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shield, Activity, Loader2 } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';

interface EnginePerformance {
  engine: string;
  detections: number;
  accuracy: number;
  falsePositives: number;
}

export function DetectionEnginePerformanceChart() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<EnginePerformance[]>([]);
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

          if (result.detectionEngines) {
            // Map API data to component structure
            const mappedData = result.detectionEngines.map((item: any) => ({
              engine: item.engine || 'Unknown',
              detections: item.totalDetections || 0,
              accuracy: item.detectionRate || 0,
              falsePositives: Math.max(0, (item.totalDetections || 0) - (item.maliciousDetections || 0))
            }));
            setData(mappedData);
          }
        }
      } catch (error) {
        console.error('Error fetching engine performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  const getAccuracyColor = useCallback((accuracy: number) => {
    if (accuracy >= 90) return APP_COLORS.success;
    if (accuracy >= 70) return APP_COLORS.warning;
    return APP_COLORS.danger;
  }, []);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;

      return (
        <div
          className="rounded-xl p-4 shadow-2xl border backdrop-blur-md"
          style={{
            backgroundColor: `${APP_COLORS.surface}f5`,
            borderColor: APP_COLORS.border,
          }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: APP_COLORS.borderSoft }}>
            <Shield className="h-4 w-4" style={{ color: APP_COLORS.primary }} />
            <span
              className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              {item.engine}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <span
                className={TYPOGRAPHY.caption.md}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Detections:
              </span>
              <span
                className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {item.detections.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span
                className={TYPOGRAPHY.caption.md}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Accuracy:
              </span>
              <span
                className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: getAccuracyColor(item.accuracy) }}
              >
                {item.accuracy.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span
                className={TYPOGRAPHY.caption.md}
                style={{ color: APP_COLORS.textSecondary }}
              >
                False Positives:
              </span>
              <span
                className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: APP_COLORS.danger }}
              >
                {item.falsePositives}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }, [getAccuracyColor]);

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
                  backgroundColor: `${APP_COLORS.success}20`,
                  border: `1px solid ${APP_COLORS.success}40`,
                }}
              >
                <Activity className="h-3.5 w-3.5" style={{ color: APP_COLORS.success }} />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Detection Engines
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
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" style={{ color: APP_COLORS.primary }} />
              <p className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                Loading engine data...
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
                backgroundColor: `${APP_COLORS.success}20`,
                border: `1px solid ${APP_COLORS.success}40`,
              }}
            >
              <Activity className="h-3.5 w-3.5" style={{ color: APP_COLORS.success }} />
            </div>
            <div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Detection Engines
              </CardTitle>
              <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                Engine accuracy and performance
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
            {/* Bar Chart */}
            <div className="h-44 mb-3">
              <ResponsiveContainer width="100%" height="100%" minHeight={176}>
                <BarChart
                  data={data}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="engine"
                    tick={{
                      fill: APP_COLORS.textSecondary,
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                    axisLine={{ stroke: APP_COLORS.border }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: APP_COLORS.textSecondary,
                      fontSize: 10
                    }}
                    axisLine={{ stroke: APP_COLORS.border }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: `${APP_COLORS.primary}10` }}
                  />
                  <Bar
                    dataKey="detections"
                    radius={[6, 6, 0, 0]}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getAccuracyColor(entry.accuracy)}
                        opacity={hoveredIndex === null || hoveredIndex === index ? 0.9 : 0.5}
                        style={{
                          transition: 'opacity 0.3s ease',
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Engine Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              {data.slice(0, 6).map((item, index) => (
                <div
                  key={item.engine}
                  className="flex items-center justify-between p-2 rounded-lg border transition-all duration-200"
                  style={{
                    backgroundColor: hoveredIndex === index ? `${getAccuracyColor(item.accuracy)}10` : 'transparent',
                    borderColor: hoveredIndex === index ? `${getAccuracyColor(item.accuracy)}40` : APP_COLORS.border,
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Shield className="h-3 w-3 flex-shrink-0" style={{ color: getAccuracyColor(item.accuracy) }} />
                    <span
                      className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.medium} truncate`}
                      style={{ color: APP_COLORS.textPrimary }}
                      title={item.engine}
                    >
                      {item.engine}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <Badge
                      className={`${TYPOGRAPHY.caption.xs}`}
                      style={{
                        backgroundColor: `${APP_COLORS.primary}15`,
                        color: APP_COLORS.primary,
                        border: `1px solid ${APP_COLORS.primary}30`,
                      }}
                    >
                      {item.detections}
                    </Badge>
                    <Badge
                      className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`}
                      style={{
                        backgroundColor: `${getAccuracyColor(item.accuracy)}15`,
                        color: getAccuracyColor(item.accuracy),
                        border: `1px solid ${getAccuracyColor(item.accuracy)}30`,
                      }}
                    >
                      {item.accuracy.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <NoGraphData
            icon={<Activity />}
            iconColor={APP_COLORS.success}
            title="No engine data available"
            subtitle="Data will appear as detections are processed"
          />
        )}
      </CardContent>
    </Card>
  );
}
