'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { File, Shield, AlertTriangle, FileType, Loader2 } from 'lucide-react';
import { NoGraphData } from "@/components/NoGraphData";
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { TimeFilterDropdown } from './TimeFilterDropdown';
import { apiFetch } from '@/lib/apiFetch';

interface FileAnalysisData {
  totalFiles: number;
  avgFileSize: number;
  maliciousFiles: number;
  cleanFiles: number;
  detectionRate: number;
  topFileTypes: Array<{
    type: string;
    count: number;
  }>;
}

const fileTypeColors = [
  APP_COLORS.primary,
  APP_COLORS.accentPurple,
  APP_COLORS.warning,
  APP_COLORS.success,
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div
        className="rounded-lg p-2.5 shadow-xl border"
        style={{
          backgroundColor: APP_COLORS.backgroundSoft,
          borderColor: APP_COLORS.border,
        }}
      >
        <div className={`${TYPOGRAPHY.caption.sm} ${TYPOGRAPHY.fontWeight.bold} mb-1`} style={{ color: APP_COLORS.textPrimary }}>
          {item.type}
        </div>
        <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
          {item.count.toLocaleString()} files
        </div>
      </div>
    );
  }
  return null;
};

export function FileAnalysisGraph() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [fileData, setFileData] = useState<FileAnalysisData>({
    totalFiles: 0,
    avgFileSize: 0,
    maliciousFiles: 0,
    cleanFiles: 0,
    detectionRate: 0,
    topFileTypes: []
  });
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
          setFileData(result.fileAnalysis || {
            totalFiles: 0,
            avgFileSize: 0,
            maliciousFiles: 0,
            cleanFiles: 0,
            detectionRate: 0,
            topFileTypes: []
          });
        }
      } catch (error) {
        console.error('Error fetching file analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  // Loading state
  if (loading) {
    return (
      <Card
        className={`${CARD_STYLES.base} transition-all duration-300 hover:shadow-lg h-full`}
        style={{
          backgroundColor: APP_COLORS.backgroundSoft,
          borderColor: APP_COLORS.border,
        }}
      >
        <CardHeader className="pb-1 px-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="p-1 rounded-md"
                style={{
                  backgroundColor: `${APP_COLORS.primary}20`,
                  border: `1px solid ${APP_COLORS.primary}40`,
                }}
              >
                <File className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
              </div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                File Analysis
              </CardTitle>
            </div>
            <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-3 px-4">
          <div className="h-44 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" style={{ color: APP_COLORS.primary }} />
              <p className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textSecondary }}>
                Loading file data...
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
      <CardHeader className="pb-1 px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-md"
              style={{
                backgroundColor: `${APP_COLORS.primary}20`,
                border: `1px solid ${APP_COLORS.primary}40`,
              }}
            >
              <File className="h-3.5 w-3.5" style={{ color: APP_COLORS.primary }} />
            </div>
            <div>
              <CardTitle
                className={`${TYPOGRAPHY.heading.h5} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                File Analysis
              </CardTitle>
              <p className={TYPOGRAPHY.caption.xs} style={{ color: APP_COLORS.textSecondary }}>
                File type distribution
              </p>
            </div>
          </div>

          {/* Individual Time Filter */}
          <TimeFilterDropdown value={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-3 px-4">
        {/* Total Files Badge */}
        <div className="mb-3">
          <Badge
            className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} px-2 py-0.5`}
            style={{
              backgroundColor: `${APP_COLORS.primary}15`,
              color: APP_COLORS.primary,
              border: `1px solid ${APP_COLORS.primary}30`,
            }}
          >
            {fileData.totalFiles.toLocaleString()} Total Files
          </Badge>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Malicious Files */}
          <div
            className="p-2 rounded-lg border"
            style={{
              backgroundColor: `${APP_COLORS.danger}08`,
              borderColor: `${APP_COLORS.danger}30`,
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3" style={{ color: APP_COLORS.danger }} />
              <span
                className={`${TYPOGRAPHY.caption.xs}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Malicious
              </span>
            </div>
            <div
              className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
              style={{ color: APP_COLORS.danger }}
            >
              {fileData.maliciousFiles.toLocaleString()}
            </div>
            <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textDim }}>
              {fileData.totalFiles > 0 ? ((fileData.maliciousFiles / fileData.totalFiles) * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* Clean Files */}
          <div
            className="p-2 rounded-lg border"
            style={{
              backgroundColor: `${APP_COLORS.success}08`,
              borderColor: `${APP_COLORS.success}30`,
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Shield className="h-3 w-3" style={{ color: APP_COLORS.success }} />
              <span
                className={`${TYPOGRAPHY.caption.xs}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Clean
              </span>
            </div>
            <div
              className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
              style={{ color: APP_COLORS.success }}
            >
              {fileData.cleanFiles.toLocaleString()}
            </div>
            <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textDim }}>
              {fileData.totalFiles > 0 ? ((fileData.cleanFiles / fileData.totalFiles) * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* Detection Rate */}
          <div
            className="p-2 rounded-lg border"
            style={{
              backgroundColor: `${APP_COLORS.primary}08`,
              borderColor: `${APP_COLORS.primary}30`,
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <FileType className="h-3 w-3" style={{ color: APP_COLORS.primary }} />
              <span
                className={`${TYPOGRAPHY.caption.xs}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Detection
              </span>
            </div>
            <div
              className={`${TYPOGRAPHY.data.sm} ${TYPOGRAPHY.fontWeight.bold} ${TYPOGRAPHY.fontFamily.mono}`}
              style={{ color: APP_COLORS.primary }}
            >
              {fileData.detectionRate.toFixed(1)}%
            </div>
            <div className={`${TYPOGRAPHY.caption.xs}`} style={{ color: APP_COLORS.textDim }}>
              Accuracy
            </div>
          </div>
        </div>

        {/* Top File Types Bar Chart - Compact */}
        {fileData.topFileTypes && fileData.topFileTypes.length > 0 ? (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                Top File Types
              </span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%" minHeight={112}>
                <BarChart
                  data={fileData.topFileTypes.slice(0, 4)}
                  layout="vertical"
                  margin={{ top: 0, right: 5, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="type"
                    width={50}
                    tick={{
                      fill: APP_COLORS.textSecondary,
                      fontSize: 10,
                      fontWeight: 600
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: `${APP_COLORS.primary}10` }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                    {fileData.topFileTypes.slice(0, 4).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={fileTypeColors[index % fileTypeColors.length]}
                        opacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <NoGraphData
            icon={<File />}
            iconColor={APP_COLORS.primary}
            title="No file types available"
            height="h-28"
          />
        )}
      </CardContent>
    </Card>
  );
}
