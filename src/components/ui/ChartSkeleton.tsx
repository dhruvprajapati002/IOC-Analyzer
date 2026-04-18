'use client';

import { LOADING_STYLES } from '@/lib/loaders';
import { BarChart3 } from 'lucide-react';

export function ChartSkeleton({ height = 'h-80' }: { height?: string }) {
  return (
    <div className={`w-full ${height} rounded-2xl bg-gradient-to-br from-t-bg/30 to-t-bgDeep/50 backdrop-blur-sm border border-t-border/50 p-6 space-y-6 animate-pulse`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={`${LOADING_STYLES.skeletonText} h-5 w-32`} />
          <div className="flex items-center gap-2 p-2 bg-t-surface/50 rounded-lg">
          <BarChart3 className="h-4 w-4 text-t-textMuted" />
          <div className={`${LOADING_STYLES.skeletonText} h-3 w-12`} />
        </div>
      </div>
      
      {/* Chart area */}
      <div className="space-y-3">
        <div className={`${LOADING_STYLES.skeleton} h-8 w-full`} />
        <div className="flex gap-2">
          <div className={`${LOADING_STYLES.skeleton} h-6 w-3/4`} />
          <div className={`${LOADING_STYLES.skeleton} h-6 w-1/4`} />
        </div>
        <div className="flex gap-2">
          <div className={`${LOADING_STYLES.skeleton} h-6 w-1/2`} />
          <div className={`${LOADING_STYLES.skeleton} h-6 w-1/3`} />
        </div>
      </div>
    </div>
  );
}
