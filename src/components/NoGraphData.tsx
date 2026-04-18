import React from 'react';
import { APP_COLORS } from '@/lib/colors';

export interface NoGraphDataProps {
  icon?: React.ReactNode;
  iconColor?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  height?: string;
}

export function NoGraphData({
  icon,
  iconColor = APP_COLORS.textMuted,
  title = 'No data available',
  subtitle,
  className = '',
  height = 'h-full'
}: NoGraphDataProps) {
  return (
    <div
      className={`flex ${height} w-full items-center justify-center p-4 text-center rounded-lg ${className}`}
      style={{
        backgroundColor: APP_COLORS.surfaceSoft,
        color: APP_COLORS.textMuted,
        border: `1px dashed ${APP_COLORS.borderSoft}`
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-2">
        {icon ? (
          <div style={{ color: iconColor }}>{icon}</div>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: iconColor }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        <span className="text-sm font-medium" style={{ color: APP_COLORS.textPrimary }}>{title}</span>
        {subtitle && <span className="text-xs">{subtitle}</span>}
      </div>
    </div>
  );
}
