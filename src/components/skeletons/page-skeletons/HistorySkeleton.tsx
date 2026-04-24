'use client';

import {
  SkeletonBadge,
  SkeletonButton,
  SkeletonCard,
  SkeletonCircle,
  SkeletonInput,
  SkeletonLine,
  SkeletonTitle,
} from '../SkeletonPrimitives';
import AnalysisCardSkeleton from './AnalysisCardSkeleton';

export default function HistorySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonTitle width={260} height={24} />
          <SkeletonLine width={180} height={12} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SkeletonButton width={100} height={34} />
          <SkeletonBadge width={60} height={28} />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <SkeletonInput width={320} height={42} />
        <SkeletonBadge width={110} height={36} />
        <SkeletonBadge width={110} height={36} />
        <SkeletonBadge width={110} height={36} />
        <SkeletonBadge width={110} height={36} />
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <SkeletonBadge width={36} height={36} />
          <SkeletonBadge width={36} height={36} />
          <SkeletonBadge width={36} height={36} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} style={{ flex: 1, minWidth: 180 }}>
            <SkeletonCard height={72}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SkeletonCircle size={28} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  <SkeletonTitle width="50%" height={18} />
                  <SkeletonLine width="40%" height={10} />
                </div>
              </div>
            </SkeletonCard>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <AnalysisCardSkeleton key={index} />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
        <SkeletonBadge width={80} height={34} />
        <SkeletonBadge width={34} height={34} />
        <SkeletonBadge width={34} height={34} />
        <SkeletonBadge width={34} height={34} />
        <SkeletonBadge width={80} height={34} />
      </div>
    </div>
  );
}
