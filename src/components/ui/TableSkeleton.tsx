'use client';

import React from 'react';
import { LOADING_STYLES } from '@/lib/loaders';

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-t-border/50 bg-t-bgDeep/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1.5fr_2fr_1.5fr_2fr_1fr] gap-4 p-4 border-b border-t-border/50 bg-t-bg/50">
        {['Type', 'IOC', 'Status', 'First Seen', 'Actions'].map((header, i) => (
          <div key={i} className={`${LOADING_STYLES.skeletonText} h-5 w-full`} />
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-t-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1.5fr_2fr_1.5fr_2fr_1fr] gap-4 p-4 hover:bg-t-bg/30 transition-colors">
            <div className={`${LOADING_STYLES.skeletonText} h-4 w-3/4`} />
            <div className={`${LOADING_STYLES.skeletonText} h-4 w-full`} />
            <div className={`${LOADING_STYLES.skeletonText} h-3 w-1/2`} />
            <div className={`${LOADING_STYLES.skeletonText} h-4 w-2/3`} />
            <div className="flex justify-end gap-1">
              <div className={`${LOADING_STYLES.dot} bg-t-surfaceMuted`} />
              <div className={`${LOADING_STYLES.dot} bg-t-surfaceMuted animation-delay-100`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
