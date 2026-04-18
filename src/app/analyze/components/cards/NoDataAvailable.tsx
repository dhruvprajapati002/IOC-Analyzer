'use client';

import { SearchX } from 'lucide-react';
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

interface NoDataAvailableProps {
  message?: string;
  icon?: React.ReactNode;
  small?: boolean;
}

export function NoDataAvailable({
  message = 'No data available',
  icon,
  small = false,
}: NoDataAvailableProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div style={{ color: APP_COLORS.textMuted }}>
        {icon || <SearchX className={small ? 'h-6 w-6' : 'h-8 w-8'} />}
      </div>
      <p
        className={small ? 'text-xs italic' : 'text-sm italic'}
        style={{ color: APP_COLORS.textMuted }}
      >
        {message}
      </p>
    </div>
  );
}
