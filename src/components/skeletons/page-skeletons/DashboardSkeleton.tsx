'use client';

import {
  SkeletonBadge,
  SkeletonBlock,
  SkeletonButton,
  SkeletonCard,
  SkeletonCircle,
  SkeletonLine,
  SkeletonTitle,
} from '../SkeletonPrimitives';
import ChartCardSkeleton from './ChartCardSkeleton';

export default function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1900px] px-4 py-6 md:px-6" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonTitle width={280} height={22} />
            <SkeletonLine width={200} height={12} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <SkeletonBadge width={52} height={30} />
            <SkeletonBadge width={52} height={30} />
            <SkeletonBadge width={52} height={30} />
            <SkeletonButton width={90} height={34} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 100 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <SkeletonCircle size={32} />
                  <SkeletonBadge width={50} height={20} />
                </div>
                <SkeletonTitle width="55%" height={28} />
                <SkeletonLine width="70%" height={10} />
                <SkeletonBlock height={32} radius={4} />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>

      <ChartCardSkeleton height={280} hasLegend={true} hasFilter={true} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCardSkeleton height={260} hasLegend={true} />
        <ChartCardSkeleton height={260} />
        <ChartCardSkeleton height={220} hasLegend={false} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCardSkeleton height={280} hasLegend={false} hasFilter={true} />
        <ChartCardSkeleton height={280} hasLegend={true} />
      </div>

      <SkeletonCard>
        <SkeletonTitle width="35%" height={16} />
        <div style={{ marginTop: 8 }}>
          <SkeletonLine width="50%" height={11} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <SkeletonBadge width={24} height={24} />
              <SkeletonLine width="30%" height={12} />
              <SkeletonBadge width={48} height={20} />
              <SkeletonBadge width={60} height={20} />
              <SkeletonBlock width="12%" height={12} radius={4} />
              <SkeletonLine width="8%" height={12} />
              <SkeletonBadge width={56} height={24} />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCardSkeleton height={180} />
        <ChartCardSkeleton height={280} />
        <SkeletonCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonTitle width="50%" height={14} />
            <SkeletonBadge width={44} height={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <SkeletonCircle size={8} />
                <SkeletonLine width="60%" height={11} />
                <SkeletonBadge width={52} height={18} />
                <SkeletonLine width="15%" height={10} />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
