'use client';

import {
  SkeletonBadge,
  SkeletonCard,
  SkeletonCircle,
  SkeletonLine,
  SkeletonTitle,
} from '../SkeletonPrimitives';
import ChartCardSkeleton from './ChartCardSkeleton';

export default function AnalyzeSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard>
        <div style={{ height: 44, borderRadius: 10, width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
          <SkeletonBadge width={120} height={22} />
          <SkeletonBadge width={64} height={22} />
          <SkeletonLine width={160} height={13} />
          <SkeletonLine width={80} height={11} className="ml-auto" />
        </div>
      </SkeletonCard>

      <SkeletonLine width={180} height={10} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SkeletonCard>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <SkeletonCircle size={160} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <SkeletonTitle width="40%" height={16} />
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <SkeletonLine width="40%" height={12} />
                    <SkeletonLine width="15%" height={12} />
                  </div>
                ))}
                <SkeletonLine width="50%" height={12} />
              </div>
            </div>
          </SkeletonCard>
        </div>
        <SkeletonCard>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <SkeletonCircle size={52} />
            <SkeletonTitle width="70%" height={32} />
            <SkeletonLine width="50%" height={11} />
            <SkeletonLine width="60%" height={11} />
            <div style={{ display: 'flex', gap: 8 }}>
              <SkeletonLine width={70} height={12} />
              <SkeletonLine width={70} height={12} />
            </div>
          </div>
        </SkeletonCard>
      </div>

      <SkeletonLine width={200} height={10} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ChartCardSkeleton height={220} hasLegend={false} />
        <ChartCardSkeleton height={220} />
        <SkeletonCard>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <SkeletonBadge key={idx} width={72} height={26} />
            ))}
          </div>
        </SkeletonCard>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <SkeletonCard key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <SkeletonCircle size={24} />
                <SkeletonLine width={160} height={14} />
              </div>
              <SkeletonBadge width={28} height={28} />
            </div>
          </SkeletonCard>
        ))}
      </div>

      <SkeletonLine width={220} height={10} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SkeletonCard>
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SkeletonLine width="60%" height={10} />
                <SkeletonLine height={13} />
              </div>
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SkeletonCircle size={24} />
              <SkeletonLine width={140} height={14} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonBadge key={idx} width={56} height={22} />
              ))}
            </div>
          </div>
        </SkeletonCard>
      </div>

      <SkeletonLine width={200} height={10} />
      <SkeletonCard>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 200 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <SkeletonCircle size={20} />
                  <SkeletonLine width="60%" height={12} />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 6 }).map((__, rowIdx) => (
                    <div key={rowIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <SkeletonLine width="50%" height={9} />
                      <SkeletonLine height={12} />
                    </div>
                  ))}
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
