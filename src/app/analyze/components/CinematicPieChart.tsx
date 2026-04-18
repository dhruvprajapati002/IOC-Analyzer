'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { APP_COLORS, CARD_STYLES, CHART_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface CinematicPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  className?: string;
  isLoading?: boolean;
  title?: string;
}

export function CinematicPieChart({ 
  data, 
  className = '', 
  isLoading = false,
  title = 'Threat Distribution'
}: CinematicPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color 
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const sortedData = [...chartData].sort((a, b) => b.value - a.value);

  if (isLoading) {
    return <ChartSkeleton height="h-96" />;
  }

  return (
    <motion.div
      className={`w-full ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* ✅ REMOVED Header Section - Saves ~80px height */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
        {/* LEFT: Chart */}
        <div className="h-80 w-full relative">
          {/* Center total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              <motion.div
                className={`${TYPOGRAPHY.data.xl} ${TYPOGRAPHY.fontWeight.black} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: APP_COLORS.primary }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {total.toLocaleString()}
              </motion.div>
              <div 
                className={`${TYPOGRAPHY.caption.xs} ${TYPOGRAPHY.fontWeight.bold} uppercase tracking-wider mt-1`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                TOTAL
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={450}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={800}
                animationEasing="ease-out"
                stroke="none"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: activeIndex === null || activeIndex === index ? 1 : 0.3,
                      filter: activeIndex === index 
                        ? `drop-shadow(0 0 20px ${entry.color}80)` 
                        : 'none',
                      transform: activeIndex === index ? 'scale(1.08)' : 'scale(1)',
                      transformOrigin: 'center center',
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT: Information Panel */}
        <div className="space-y-3 h-80 flex flex-col">
          {/* Stats Header */}
          <div 
            className={`flex items-center justify-between ${TYPOGRAPHY.caption.xs} pb-2 border-b flex-shrink-0`}
            style={{ borderColor: `${APP_COLORS.border}` }}
          >
            <span 
              className={`${TYPOGRAPHY.fontWeight.bold} uppercase`}
              style={{ color: APP_COLORS.textSecondary }}
            >
              Category
            </span>
            <div className="flex items-center gap-8">
              <span 
                className={`${TYPOGRAPHY.fontWeight.bold} uppercase`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Share
              </span>
              <span 
                className={`${TYPOGRAPHY.fontWeight.bold} uppercase w-16 text-right`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Count
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex-1 flex flex-col justify-center space-y-2">
            {sortedData.map((item, index) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
              const isActive = activeIndex === index;

              return (
                <motion.button
                  key={item.name}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 group border"
                  style={{
                    backgroundColor: isActive ? `${APP_COLORS.surfaceSoft}` : 'transparent',
                    borderColor: isActive ? `${APP_COLORS.borderSoft}` : 'transparent',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-md"
                      style={{ 
                        backgroundColor: item.color,
                      }}
                      animate={isActive ? { scale: 1.3 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <span 
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold} truncate`}
                      style={{ color: isActive ? APP_COLORS.textPrimary : APP_COLORS.textSecondary }}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <motion.span 
                      className={`${TYPOGRAPHY.body.md} ${TYPOGRAPHY.fontWeight.bold} min-w-[3rem]`}
                      style={{ color: isActive ? item.color : APP_COLORS.textMuted }}
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    >
                      {percentage}%
                    </motion.span>
                    <span 
                      className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.medium} ${TYPOGRAPHY.fontFamily.mono} min-w-[3rem]`}
                      style={{ color: APP_COLORS.textSecondary }}
                    >
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div 
            className="pt-2 mt-2 border-t flex-shrink-0"
            style={{ borderColor: `${APP_COLORS.border}` }}
          >
            <div 
              className="flex items-center justify-between p-2.5 rounded-lg"
              style={{
                backgroundColor: `${APP_COLORS.backgroundSoft}`,
                
              }}
            >
              <span 
                className={`${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.semibold}`}
                style={{ color: APP_COLORS.textSecondary }}
              >
                Total Analyzed
              </span>
              <span 
                className={`${TYPOGRAPHY.data.md} ${TYPOGRAPHY.fontWeight.black} ${TYPOGRAPHY.fontFamily.mono}`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
