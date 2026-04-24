'use client';

import type { ReactNode } from 'react';
import { APP_COLORS } from '@/lib/colors';
import SkeletonBase from './SkeletonBase';

export function SkeletonLine({
  width = '100%',
  height = 14,
  className = '',
}: {
  width?: string | number;
  height?: number;
  className?: string;
}) {
  return <SkeletonBase width={width} height={height} borderRadius={6} className={className} />;
}

export function SkeletonTitle({
  width = '60%',
  height = 20,
}: {
  width?: string | number;
  height?: number;
}) {
  return <SkeletonBase width={width} height={height} borderRadius={6} />;
}

export function SkeletonBadge({
  width = 64,
  height = 24,
}: {
  width?: number;
  height?: number;
}) {
  return <SkeletonBase width={width} height={height} borderRadius={999} />;
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <SkeletonBase width={size} height={size} borderRadius={999} />;
}

export function SkeletonBlock({
  width = '100%',
  height = 200,
  radius = 12,
}: {
  width?: string | number;
  height?: number;
  radius?: number;
}) {
  return <SkeletonBase width={width} height={height} borderRadius={radius} />;
}

export function SkeletonCard({
  height = 200,
  children,
}: {
  height?: number;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        background: APP_COLORS.surface,
        border: `1px solid ${APP_COLORS.border}`,
        borderRadius: 16,
        padding: 20,
        overflow: 'hidden',
      }}
    >
      {children ?? <SkeletonBlock height={height} />}
    </div>
  );
}

export function SkeletonButton({
  width = 100,
  height = 38,
}: {
  width?: number;
  height?: number;
}) {
  return <SkeletonBase width={width} height={height} borderRadius={10} />;
}

export function SkeletonInput({
  width = '100%',
  height = 44,
}: {
  width?: string | number;
  height?: number;
}) {
  return <SkeletonBase width={width} height={height} borderRadius={10} />;
}
