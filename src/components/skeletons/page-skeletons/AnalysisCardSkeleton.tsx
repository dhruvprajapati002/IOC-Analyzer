'use client';

import { APP_COLORS } from '@/lib/colors';
import {
  SkeletonBadge,
  SkeletonLine,
} from '../SkeletonPrimitives';
import SkeletonBase from '../SkeletonBase';

export default function AnalysisCardSkeleton() {
  return (
    <div
      style={{
        background: APP_COLORS.surface,
        border: `1px solid ${APP_COLORS.border}`,
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <SkeletonBadge width={36} height={20} />
          <SkeletonLine width={180} height={13} />
        </div>
        <SkeletonBadge width={72} height={24} />
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SkeletonLine width="40%" height={10} />
            <SkeletonBase height={4} borderRadius={2} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <SkeletonBase width={80} height={6} borderRadius={3} />
        <SkeletonBadge width={56} height={20} />
        <SkeletonLine width={60} height={10} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        <SkeletonBadge width={90} height={22} />
        <SkeletonLine width={120} height={11} />
        <SkeletonLine width={60} height={10} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <SkeletonBadge width={64} height={22} />
          <SkeletonBadge width={64} height={22} />
          <SkeletonBadge width={64} height={22} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <SkeletonBadge width={32} height={22} />
          <SkeletonBadge width={68} height={22} />
        </div>
      </div>
    </div>
  );
}
