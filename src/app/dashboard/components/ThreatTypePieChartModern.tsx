'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { Shield } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { useAuth } from '@/contexts/AuthContext';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import ReactECharts from 'echarts-for-react';
import { apiFetch } from '@/lib/apiFetch';

interface ThreatTypeData {
  type?: string;
  name?: string;
  value?: number;
  percentage?: number;
  color: string;
  count: number;
  description?: string;
}

export function ThreatTypePieChart() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<ThreatTypeData[]>([]);
  const [loading, setLoading] = useState(false);

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
          setData(result.threatTypes || result.threatTypeDistribution || []);
        }
      } catch (error) {
        console.error('Error fetching threat type data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  // Normalize display labels
  const normalizeLabel = (label?: string) => {
    if (!label) return '';
    const normalized = label.toString().trim();
    if (normalized.toLowerCase() === 'harmless') return 'Clean';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  // Process and normalize data from API
  const threatTypeData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter(item => item.count > 0)
      .map(item => ({
        name: normalizeLabel(item.type || item.name),
        value: item.count,
        percentage: item.percentage || item.value || 0,
        count: item.count,
        color: item.color,
        description: item.description || '',
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // ECharts pie option - Smaller and Centered
  const pieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '<strong style="font-size: 13px;">{b}</strong><br/><span style="font-size: 12px;">Count: {c}</span><br/><span style="font-size: 12px;">Percentage: {d}%</span>',
      backgroundColor: APP_COLORS.backgroundSoft,
      borderColor: APP_COLORS.border,
      borderWidth: 1,
      textStyle: {
        color: APP_COLORS.textPrimary,
        fontSize: 12,
      },
      padding: 12,
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 8px;',
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12,
      icon: 'circle',
      formatter: (name: string) => {
        const item = threatTypeData.find(d => d.name === name);
        if (item) {
          const count = item.count.toLocaleString();
          const percent = item.percentage.toFixed(1);
          return `{name|${name}}\n{stats|${count} (${percent}%)}`;
        }
        return name;
      },
      textStyle: {
        color: APP_COLORS.textPrimary,
        fontSize: 11,
        fontWeight: 500,
        rich: {
          name: {
            fontSize: 11,
            fontWeight: 600,
            color: APP_COLORS.textPrimary,
            lineHeight: 18,
          },
          stats: {
            fontSize: 10,
            fontWeight: 500,
            color: APP_COLORS.textSecondary,
            fontFamily: 'monospace',
            lineHeight: 16,
          },
        },
      },
    },
    color: threatTypeData.map(item => item.color),
    series: [
      {
        name: 'Threat Classification',
        type: 'pie',
        radius: ['38%', '58%'], // ✅ Smaller radius
        center: ['35%', '50%'], // ✅ Better centered
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: APP_COLORS.surface,
          borderWidth: 2.5,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            shadowBlur: 14,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
          scale: true,
          scaleSize: 6,
        },
        labelLine: {
          show: false,
        },
        data: threatTypeData.map((item) => ({
          value: item.count,
          name: item.name,
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 50,
      },
    ],
  }), [threatTypeData]);

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
                <Shield className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Threat Classification
              </CardTitle>
            </div>
            <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-4 px-4">
          <div
            className="h-[280px] flex items-center justify-center"
          >
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent mx-auto mb-3"
                style={{
                  borderColor: `${APP_COLORS.primary} transparent transparent transparent`
                }}
              />
              <p
                className={`${TYPOGRAPHY.caption.md} ${TYPOGRAPHY.fontWeight.medium}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Loading threat distribution...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!threatTypeData || threatTypeData.length === 0) {
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
                <Shield className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Threat Classification
              </CardTitle>
            </div>
            <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-4 px-4">
          <NoGraphData
            icon={<Shield />}
            iconColor={APP_COLORS.primary}
            title="No threat data available"
            subtitle="Analyze IOCs to see threat distribution"
            height="h-[280px]"
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
                backgroundColor: `${APP_COLORS.primary}20`,
                border: `1px solid ${APP_COLORS.primary}40`,
              }}
            >
              <Shield className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
            </div>
            <CardTitle
              className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
              style={{ color: APP_COLORS.textPrimary }}
            >
              Threat Classification
            </CardTitle>
          </div>
          <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-4 px-4">
        {/* Compact Centered ECharts Donut */}
        <ReactECharts
          option={pieOption}
          style={{ height: '280px', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </CardContent>
    </Card>
  );
}
