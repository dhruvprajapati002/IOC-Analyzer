'use client';

import { APP_COLORS } from '@/lib/colors';
import { SkeletonLine } from '../SkeletonPrimitives';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  hasHeader?: boolean;
}

function widthForCol(index: number) {
  const widths = [80, 110, 140, 170, 200, 120, 160];
  return widths[index % widths.length];
}

export default function TableSkeleton({ rows = 8, cols = 5, hasHeader = true }: TableSkeletonProps) {
  return (
    <div
      style={{
        background: APP_COLORS.surface,
        border: `1px solid ${APP_COLORS.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {hasHeader ? (
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: 16,
            borderBottom: `1px solid ${APP_COLORS.border}`,
          }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonLine key={`header-${colIndex}`} width={Math.min(120, widthForCol(colIndex))} height={11} />
          ))}
        </div>
      ) : null}

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          style={{
            display: 'flex',
            gap: 12,
            padding: '12px 16px',
            background: rowIndex % 2 === 0 ? APP_COLORS.surface : APP_COLORS.backgroundSoft,
          }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonLine key={`row-${rowIndex}-col-${colIndex}`} width={widthForCol(colIndex)} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}
