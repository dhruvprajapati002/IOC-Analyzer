'use client';

import {
  SkeletonBadge,
  SkeletonBlock,
  SkeletonCard,
  SkeletonCircle,
  SkeletonLine,
  SkeletonTitle,
} from '../SkeletonPrimitives';

interface ChartCardSkeletonProps {
  height?: number;
  hasLegend?: boolean;
  hasFilter?: boolean;
}

export default function ChartCardSkeleton({
  height = 220,
  hasLegend = false,
  hasFilter = false,
}: ChartCardSkeletonProps) {
  return (
    <SkeletonCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <SkeletonTitle width="45%" height={14} />
          <SkeletonLine width="30%" height={10} />
        </div>
        {hasFilter ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBadge width={48} height={26} />
            <SkeletonBadge width={48} height={26} />
            <SkeletonBadge width={48} height={26} />
          </div>
        ) : null}
      </div>
      <SkeletonBlock height={height} radius={8} />
      {hasLegend ? (
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SkeletonCircle size={10} />
              <SkeletonLine width={60} height={10} />
            </div>
          ))}
        </div>
      ) : null}
    </SkeletonCard>
  );
}
