'use client';

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  APP_COLORS,
  CHART_COLORS,
  RISK_COLORS,
  STATUS_BADGE,
  BUTTON_STYLES,
  INPUT_STYLES,
  SHADOWS,
  LOADING_STYLES,
} from '@/lib/colors';

interface PieItem {
  name: string;
  value: number;
  color: string;
}

interface CinematicPieChartProps {
  data: PieItem[];
  total: number;
  activeIndex: number | null;
  onActiveIndexChange: (index: number | null) => void;
}

export function CinematicPieChart({
  data,
  total,
  activeIndex,
  onActiveIndexChange,
}: CinematicPieChartProps) {
  return (
    <div className="relative h-[280px] w-full">
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl font-black" style={{ color: APP_COLORS.textPrimary }}>
            {total.toLocaleString()}
          </p>
          <p className="text-xs uppercase tracking-wide" style={{ color: APP_COLORS.textMuted }}>
            Total
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={2}
            cx="50%"
            cy="50%"
            onMouseEnter={(_, index) => onActiveIndexChange(index)}
            onMouseLeave={() => onActiveIndexChange(null)}
            animationDuration={500}
          >
            {data.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
                fill={entry.color}
                radius={activeIndex === index ? 103 : 95}
                style={{
                  transition: 'all 220ms ease',
                  opacity: activeIndex === null || activeIndex === index ? 1 : 0.45,
                }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              border: `1px solid ${APP_COLORS.border}`,
              borderRadius: 12,
              background: APP_COLORS.surface,
              color: APP_COLORS.textPrimary,
              fontSize: 12,
            }}
            formatter={(value) => {
              const resolvedValue = Array.isArray(value) ? value[0] : value;
              const numericValue =
                typeof resolvedValue === 'number'
                  ? resolvedValue
                  : Number(resolvedValue ?? 0);

              const displayValue = Number.isFinite(numericValue)
                ? numericValue.toLocaleString()
                : String(resolvedValue ?? 0);

              return [displayValue, 'Count'];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
