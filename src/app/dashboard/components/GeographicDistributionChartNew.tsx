'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Globe, MapPin, Loader2 } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';

interface GeoData {
  country: string;
  countryName: string;
  count: number;
  maliciousCount: number;
  suspiciousCount: number;
  harmlessCount: number;
  undetectedCount: number;
  threatCount: number;
  threatPercentage: number;
  verdictBreakdown?: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
  };
}

// ✅ FIXED: Use colors from your APP_COLORS system
const countryColors = [
  APP_COLORS.primary,           // #3b82f6 - Blue
  APP_COLORS.accentPurple,      // #a78bfa - Purple
  APP_COLORS.accentCyan,        // #06b6d4 - Cyan
  APP_COLORS.accentIndigo,      // #6366f1 - Indigo
  APP_COLORS.accentPink,        // #ec4899 - Pink
  APP_COLORS.accentTeal,        // #14b8a6 - Teal
  APP_COLORS.accentViolet,      // #8b5cf6 - Violet
  APP_COLORS.accentOrange,      // #f97316 - Orange
  APP_COLORS.success,           // #34d399 - Green
  APP_COLORS.accentBlue,        // #3b82f6 - Blue
];

export function GeographicDistributionChart() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<GeoData[]>([]);
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
          setData(result.geoDistribution || []);
        }
      } catch (error) {
        console.error('Error fetching geographic data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  const getBarColor = useCallback((threatPercentage: number) => {
    if (threatPercentage >= 70) return APP_COLORS.danger;
    if (threatPercentage >= 40) return APP_COLORS.warning;
    if (threatPercentage >= 20) return APP_COLORS.warningLight;
    return APP_COLORS.success;
  }, []);

  const getCountryColor = useCallback((index: number) => {
    return countryColors[index % countryColors.length];
  }, []);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const malicious = item.maliciousCount || item.verdictBreakdown?.malicious || 0;
      const suspicious = item.suspiciousCount || item.verdictBreakdown?.suspicious || 0;
      const harmless = item.harmlessCount || item.verdictBreakdown?.harmless || 0;
      const undetected = item.undetectedCount || item.verdictBreakdown?.undetected || 0;

      return (
        <div
          className="rounded-xl p-4 shadow-2xl border backdrop-blur-md max-w-sm"
          style={{
            backgroundColor: `${APP_COLORS.surface}f5`,
            borderColor: APP_COLORS.border,
          }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: APP_COLORS.borderSoft }}>
            <MapPin className="h-4 w-4" style={{ color: APP_COLORS.primary }} />
            <span
              className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              {item.countryName || item.country}
            </span>
          </div>
          <div className="space-y-2">
            {/* Total IOCs */}
            <div className="flex items-center justify-between gap-6">
              <span
                className={TYPOGRAPHY.caption.md}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Total IOCs:
              </span>
              <span
                className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {item.count.toLocaleString()}
              </span>
            </div>

            {/* Verdict breakdown */}
            <div className="border-t pt-2 mt-2" style={{ borderColor: APP_COLORS.borderSoft }}>
              <p
                className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} mb-1.5`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Verdict Breakdown:
              </p>
              <div className="space-y-1 ml-2">
                {malicious > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={TYPOGRAPHY.caption.md}
                      style={{ color: APP_COLORS.danger }}
                    >
                      🔴 Malicious:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono}`}
                      style={{ color: APP_COLORS.danger }}
                    >
                      {malicious.toLocaleString()}
                    </span>
                  </div>
                )}
                {suspicious > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={TYPOGRAPHY.caption.md}
                      style={{ color: APP_COLORS.warning }}
                    >
                      🟠 Suspicious:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono}`}
                      style={{ color: APP_COLORS.warning }}
                    >
                      {suspicious.toLocaleString()}
                    </span>
                  </div>
                )}
                {harmless > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={TYPOGRAPHY.caption.md}
                      style={{ color: APP_COLORS.success }}
                    >
                      🟢 Harmless:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono}`}
                      style={{ color: APP_COLORS.success }}
                    >
                      {harmless.toLocaleString()}
                    </span>
                  </div>
                )}
                {undetected > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={TYPOGRAPHY.caption.md}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      ⚪ Undetected:
                    </span>
                    <span
                      className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono}`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      {undetected.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Threat percentage */}
            <div className="border-t pt-2 mt-2 flex items-center justify-between gap-6" style={{ borderColor: APP_COLORS.borderSoft }}>
              <span
                className={TYPOGRAPHY.caption.md}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Threat Rate:
              </span>
              <span
                className={`${TYPOGRAPHY.label.lg} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: getBarColor(item.threatPercentage) }}
              >
                {item.threatPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }, [getBarColor]);

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
                  backgroundColor: `${APP_COLORS.primary}20`,
                  border: `1px solid ${APP_COLORS.primary}40`,
                }}
              >
                <Globe className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Geographic Distribution
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
                Loading geographic data...
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
                backgroundColor: `${APP_COLORS.primary}20`,
                border: `1px solid ${APP_COLORS.primary}40`,
              }}
            >
              <Globe className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
            </div>
            <div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Geographic Distribution
              </CardTitle>
              <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                IOCs by country location
              </p>
            </div>
          </div>

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
                  data={data.slice(0, 8)}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="country"
                    tick={{
                      fill: APP_COLORS.textSecondary,
                      fontSize: 10,
                      fontWeight: 500
                    }}
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
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: `${APP_COLORS.primary}10` }} />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {data.slice(0, 8).map((entry, index) => {
                      const baseColor = getCountryColor(index);
                      const isHighThreat = entry.threatPercentage >= 50;
                      const finalColor = isHighThreat ? getBarColor(entry.threatPercentage) : baseColor;

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={finalColor}
                          opacity={hoveredIndex === null || hoveredIndex === index ? 0.95 : 0.6}
                          style={{
                            transition: 'all 0.3s ease',
                            filter: hoveredIndex === index ? 'brightness(1.1)' : 'none',
                          }}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Country List Grid */}
            <div className="grid grid-cols-2 gap-2">
              {data.slice(0, 4).map((item, index) => {
                const countryColor = getCountryColor(index);
                const threatColor = getBarColor(item.threatPercentage);
                const isHighThreat = item.threatPercentage >= 50;
                const displayColor = isHighThreat ? threatColor : countryColor;

                return (
                  <div
                    key={item.country}
                    className="flex items-center justify-between p-2 rounded-lg border transition-all duration-200 cursor-pointer"
                    style={{
                      background: hoveredIndex === index
                        ? `linear-gradient(135deg, ${displayColor}18 0%, ${displayColor}08 100%)`
                        : `linear-gradient(135deg, ${displayColor}08 0%, transparent 100%)`,
                      borderColor: hoveredIndex === index
                        ? `${displayColor}50`
                        : APP_COLORS.border,
                      boxShadow: hoveredIndex === index ? `0 2px 8px ${displayColor}25` : 'none',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: displayColor }}
                      />
                      <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: displayColor }} />
                      <span
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold} truncate`}
                        style={{ color: hoveredIndex === index ? displayColor : APP_COLORS.textPrimary }}
                        title={item.countryName || item.country}
                      >
                        {item.countryName || item.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <Badge
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.semibold}`}
                        style={{
                          backgroundColor: `${displayColor}20`,
                          color: displayColor,
                          border: `1px solid ${displayColor}40`,
                        }}
                      >
                        {item.count}
                      </Badge>
                      <Badge
                        className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`}
                        style={{
                          backgroundColor: `${threatColor}25`,
                          color: threatColor,
                          border: `1px solid ${threatColor}50`,
                        }}
                      >
                        {item.threatPercentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <NoGraphData
            icon={<Globe />}
            iconColor={APP_COLORS.primary}
            title="No geographic data available"
            subtitle="Data will appear as IOCs are analyzed"
          />
        )}
      </CardContent>
    </Card>
  );
}
