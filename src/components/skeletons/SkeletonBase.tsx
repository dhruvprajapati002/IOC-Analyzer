'use client';

import type { CSSProperties } from 'react';
import { APP_COLORS } from '@/lib/colors';

interface SkeletonBaseProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: CSSProperties;
}

export default function SkeletonBase({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className = '',
  style,
}: SkeletonBaseProps) {
  return (
    <div
      className={`skeleton-shimmer ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
        // Keep theme token fallback when global class is overridden.
        background: `linear-gradient(90deg, ${APP_COLORS.backgroundSoft} 0%, ${APP_COLORS.surfaceMutedDeep} 40%, ${APP_COLORS.backgroundSoft} 80%)`,
        backgroundSize: '300% 100%',
        animation: 'skeletonShimmer 1.8s ease-in-out infinite',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
