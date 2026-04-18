"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { APP_COLORS, CHART_COLORS, CARD_STYLES } from "@/lib/colors";
import { TYPOGRAPHY } from "@/lib/typography";
import { TrendingUp, TrendingDown, Activity, Loader2 } from "lucide-react";
import { NoGraphData } from "@/components/NoGraphData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeFilterDropdown } from "./TimeFilterDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

interface WeeklyData {
  day: string;
  dateLabel?: string;
  displayTime?: string;
  displayDate?: string;
  threats: number;
  clean: number;
  total: number;
}

// Add hoveredLine prop to CustomTooltip
// ✅ FIXED: Get data directly from payload instead of matching labels
const CustomTooltip = ({ active, payload, label, hoveredLine }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;

    if (!dataPoint) return null;

    const threats = dataPoint.threats || 0;
    const total = dataPoint.total || 0;

    // ✅ Get display label
    const displayLabel = dataPoint.displayDate || dataPoint.day || label;

    // ✅ Filter payload based on hoveredLine
    const filteredPayload = hoveredLine
      ? payload.filter((p: any) => p.name === hoveredLine)
      : payload;

    if (filteredPayload.length === 0) return null;

    // ✅ Calculate threat percentage (handle zero case)
    const threatPercentage =
      total > 0 ? ((threats / total) * 100).toFixed(1) : "0.0";

    return (
      <div
        className="rounded-xl p-3 shadow-2xl border backdrop-blur-md max-w-sm"
        style={{
          backgroundColor: `${APP_COLORS.surface}f5`,
          borderColor: APP_COLORS.border,
        }}
      >
        <div
          className="flex items-center justify-between gap-4 mb-2 pb-2 border-b"
          style={{ borderColor: APP_COLORS.borderSoft }}
        >
          <p
            className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
            style={{ color: APP_COLORS.textPrimary }}
          >
            {displayLabel}
          </p>
          <div
            className={`${TYPOGRAPHY.caption.sm} px-2 py-0.5 rounded`}
            style={{
              backgroundColor:
                total === 0
                  ? `${APP_COLORS.textMuted}20`
                  : `${APP_COLORS.accentPurple}20`,
              color:
                total === 0 ? APP_COLORS.textMuted : APP_COLORS.accentPurple,
            }}
          >
            {total} {total === 1 ? "IOC" : "IOCs"}
          </div>
        </div>

        {/* ✅ Show message for zero data */}
        {total === 0 ? (
          <div className="text-center py-2">
            <p
              className={`${TYPOGRAPHY.caption.md} ${TYPOGRAPHY.fontWeight.medium}`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              No IOCs analyzed on this day
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Show filtered items */}
            {filteredPayload.map((entry: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span
                    className={`${TYPOGRAPHY.caption.md} ${TYPOGRAPHY.fontWeight.medium}`}
                    style={{ color: APP_COLORS.textSecondary }}
                  >
                    {entry.name === "clean"
                      ? "Clean (Harmless)"
                      : "Threats (Malicious + Suspicious)"}
                  </span>
                </div>
                <span
                  className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold}`}
                  style={{ color: entry.color }}
                >
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}

            {/* Only show threat rate if there are threats */}
            {threats > 0 && (!hoveredLine || hoveredLine === "threats") && (
              <div
                className="border-t pt-1.5 mt-1.5 flex items-center justify-between"
                style={{ borderColor: APP_COLORS.borderSoft }}
              >
                <span
                  className={`${TYPOGRAPHY.caption.md} ${TYPOGRAPHY.fontWeight.medium}`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  Threat Rate
                </span>
                <div className="flex items-center gap-1">
                  {parseFloat(threatPercentage) > 15 ? (
                    <TrendingUp
                      className="h-3.5 w-3.5"
                      style={{ color: APP_COLORS.danger }}
                    />
                  ) : (
                    <TrendingDown
                      className="h-3.5 w-3.5"
                      style={{ color: APP_COLORS.success }}
                    />
                  )}
                  <span
                    className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold}`}
                    style={{
                      color:
                        parseFloat(threatPercentage) > 15
                          ? APP_COLORS.danger
                          : APP_COLORS.warning,
                    }}
                  >
                    {threatPercentage}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function ThreatTrendChart() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<"threats" | "clean" | null>(
    null,
  );

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
          setWeeklyData(result.dailyTrends || []);
        }
      } catch (error) {
        console.error("Error fetching trend data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  // Calculate stats for display
  const stats = useMemo(() => {
    const totalThreats = weeklyData.reduce((sum, d) => sum + d.threats, 0);
    const totalClean = weeklyData.reduce((sum, d) => sum + d.clean, 0);
    const total = totalThreats + totalClean;
    const threatRate =
      total > 0 ? ((totalThreats / total) * 100).toFixed(1) : "0";

    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(weeklyData.length / 2);
    const firstHalf = weeklyData
      .slice(0, midPoint)
      .reduce((sum, d) => sum + d.threats, 0);
    const secondHalf = weeklyData
      .slice(midPoint)
      .reduce((sum, d) => sum + d.threats, 0);
    const trend =
      secondHalf > firstHalf
        ? "up"
        : secondHalf < firstHalf
          ? "down"
          : "stable";

    return { totalThreats, totalClean, total, threatRate, trend };
  }, [weeklyData]);

  // Event handlers
  const handleLegendMouseEnter = useCallback((dataKey: "threats" | "clean") => {
    setHoveredLine(dataKey);
  }, []);

  const handleLegendMouseLeave = useCallback(() => {
    setHoveredLine(null);
  }, []);

  // Format X-axis labels based on time range
  const formatXAxisLabel = useCallback(
    (value: string, index: number) => {
      const dataPoint = weeklyData[index];

      if (timeRange === "daily") {
        // For daily: show hour (e.g., "14:00")
        return dataPoint?.displayTime || value;
      } else if (timeRange === "weekly") {
        // For weekly: show day name (e.g., "Mon")
        const dayName = dataPoint?.day || value;
        return dayName ? dayName.slice(0, 3) : value;
      } else {
        // For monthly: show date (e.g., "Jan 15")
        if (dataPoint?.displayDate) {
          const parts = dataPoint.displayDate.split(", ");
          return parts[0]; // e.g., "Jan 15"
        }
        return value;
      }
    },
    [timeRange, weeklyData],
  );
  // Loading state
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
                className="p-1 rounded-md"
                style={{
                  backgroundColor: `${APP_COLORS.success}20`,
                  border: `1px solid ${APP_COLORS.success}40`,
                }}
              >
                <Activity
                  className="h-3.5 w-3.5"
                  style={{ color: APP_COLORS.success }}
                />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Detection Trends
              </CardTitle>
            </div>
            <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-3">
          <div className="h-[240px] w-full flex items-center justify-center">
            <div className="text-center">
              <Loader2
                className="h-8 w-8 animate-spin mx-auto mb-2"
                style={{ color: APP_COLORS.primary }}
              />
              <p
                className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Loading trend data...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!weeklyData || weeklyData.length === 0) {
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
                <Activity
                  className="h-3.5 w-3.5"
                  style={{ color: APP_COLORS.success }}
                />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Detection Trends
              </CardTitle>
            </div>
            <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-3">
          <NoGraphData
            icon={<Activity />}
            iconColor={APP_COLORS.success}
            title="No trend data available"
            subtitle="Data will appear as IOCs are analyzed"
            height="h-[240px]"
          />
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
              <Activity
                className="h-3.5 w-3.5"
                style={{ color: APP_COLORS.success }}
              />
            </div>
            <CardTitle
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Detection Trends
            </CardTitle>
          </div>

          {/* Individual Time Filter */}
          <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 pb-3">
        {/* Mini Stats Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div>
              <p
                className={TYPOGRAPHY.caption.xs}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Total Threats
              </p>
              <p
                className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.danger }}
              >
                {stats.totalThreats.toLocaleString()}
              </p>
            </div>
            <div>
              <p
                className={TYPOGRAPHY.caption.xs}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Clean Files
              </p>
              <p
                className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.success }}
              >
                {stats.totalClean.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p
              className={TYPOGRAPHY.caption.xs}
              style={{ color: APP_COLORS.textSecondary }}
            >
              Threat Rate
            </p>
            <div className="flex items-center gap-1 justify-end">
              <p
                className={`${TYPOGRAPHY.label.md} ${TYPOGRAPHY.fontFamily.mono} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{
                  color:
                    parseFloat(stats.threatRate) > 15
                      ? APP_COLORS.danger
                      : APP_COLORS.warning,
                }}
              >
                {stats.threatRate}%
              </p>
              {stats.trend !== "stable" &&
                (stats.trend === "up" ? (
                  <TrendingUp
                    className="h-3.5 w-3.5"
                    style={{ color: APP_COLORS.danger }}
                  />
                ) : (
                  <TrendingDown
                    className="h-3.5 w-3.5"
                    style={{ color: APP_COLORS.success }}
                  />
                ))}
            </div>
          </div>
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={200} debounce={300}>
            <LineChart
              data={weeklyData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={`${APP_COLORS.border}25`}
                vertical={false}
              />

              <XAxis
                dataKey="dateLabel" // ✅ Use unique dateLabel instead of day
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: APP_COLORS.textMuted,
                  fontSize: 11,
                  fontWeight: 500,
                }}
                tickFormatter={(value, index) => {
                  const dataPoint = weeklyData[index];
                  if (!dataPoint) return "";

                  if (timeRange === "daily") {
                    return dataPoint.displayTime || ""; // "05:00"
                  } else if (timeRange === "weekly") {
                    return dataPoint.day.slice(0, 3); // "Tue", "Wed"
                  } else {
                    // Monthly - show date
                    const parts = dataPoint.displayDate?.split(", ");
                    return parts?.[0] || ""; // "Mon, Jan 19" → "Mon"
                  }
                }}
                interval={0}
                height={25}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: APP_COLORS.textMuted,
                  fontSize: 11,
                  fontWeight: 500,
                }}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                width={35}
                tickCount={5}
              />

              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} hoveredLine={hoveredLine} />
                )} // ✅ Pass hoveredLine
                cursor={{
                  stroke: APP_COLORS.primary,
                  strokeWidth: 2,
                  strokeDasharray: "3 3",
                  opacity: 0.3,
                }}
              />

              <Legend
                verticalAlign="bottom"
                height={40}
                iconType="circle"
                content={({ payload }) => (
                  <div className="flex gap-3 justify-center pt-2">
                    {payload &&
                      payload.map((entry: any) => {
                        const dataKey = entry.value;
                        const isHovered = hoveredLine === dataKey;
                        const isFaded = hoveredLine !== null && !isHovered;

                        return (
                          <div
                            key={`legend-${dataKey}`}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer border`}
                            style={{
                              backgroundColor: isHovered
                                ? `${entry.color}12`
                                : "transparent",
                              borderColor: isHovered
                                ? `${entry.color}50`
                                : `${entry.color}25`,
                              opacity: isFaded ? 0.4 : 1,
                              transform: isHovered
                                ? "translateY(-2px)"
                                : "translateY(0)",
                              boxShadow: isHovered
                                ? `0 4px 12px ${entry.color}20`
                                : "none",
                            }}
                            onMouseEnter={() => handleLegendMouseEnter(dataKey)}
                            onMouseLeave={handleLegendMouseLeave}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: entry.color,
                                boxShadow: isHovered
                                  ? `0 0 8px ${entry.color}`
                                  : "none",
                              }}
                            />
                            <span
                              className={`${TYPOGRAPHY.label.sm} transition-colors`}
                              style={{
                                color: isHovered
                                  ? APP_COLORS.textPrimary
                                  : APP_COLORS.textMuted,
                                fontWeight: isHovered ? 600 : 500,
                              }}
                            >
                              {dataKey === "clean" ? "Clean" : "Threats"}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              />

              <Line
                type="monotone"
                dataKey="clean"
                stroke={CHART_COLORS.clean}
                strokeWidth={hoveredLine === "clean" ? 3 : 2.5}
                dot={{
                  fill: CHART_COLORS.clean,
                  strokeWidth: 0,
                  r: hoveredLine === "clean" ? 4 : 3,
                }}
                activeDot={{
                  r: 6,
                  fill: CHART_COLORS.clean,
                  strokeWidth: 2,
                  stroke: APP_COLORS.surface,
                }}
                opacity={hoveredLine === "threats" ? 0.3 : 1}
                animationDuration={600}
                animationEasing="ease-in-out"
              />

              <Line
                type="monotone"
                dataKey="threats"
                stroke={CHART_COLORS.malicious}
                strokeWidth={hoveredLine === "threats" ? 3 : 2.5}
                dot={{
                  fill: CHART_COLORS.malicious,
                  strokeWidth: 0,
                  r: hoveredLine === "threats" ? 4 : 3,
                }}
                activeDot={{
                  r: 6,
                  fill: CHART_COLORS.malicious,
                  strokeWidth: 2,
                  stroke: APP_COLORS.surface,
                }}
                opacity={hoveredLine === "clean" ? 0.3 : 1}
                animationDuration={600}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
