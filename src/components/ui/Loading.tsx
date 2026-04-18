'use client';

import { LOADING_STYLES, LOADING_CONTAINER } from '@/lib/loaders';
import { Loader2 } from 'lucide-react';

export function LoadingDots() {
  return (
    <div className={LOADING_STYLES.dots}>
      <div className={`${LOADING_STYLES.dot} animate-bounce`} />
      <div className={`${LOADING_STYLES.dot} ${LOADING_STYLES.dot} animation-delay-100`} />
      <div className={`${LOADING_STYLES.dot} ${LOADING_STYLES.dot} animation-delay-200`} />
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  
  return (
    <div className={`${sizeClass} ${LOADING_STYLES.spinner}`} />
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-t-bgDeep/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={LOADING_CONTAINER.base}>
        <div className={LOADING_CONTAINER.spinner} />
        <div className={LOADING_CONTAINER.text}>{message}</div>
        <LoadingDots />
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={LOADING_STYLES.skeleton + ' h-32 p-6'}>
          <div className={`${LOADING_STYLES.skeletonText} h-6 w-3/4 mb-4`} />
          <div className={`${LOADING_STYLES.skeletonText} h-4 w-1/2 mb-2`} />
          <div className={`${LOADING_STYLES.skeletonText} h-4 w-1/4`} />
        </div>
      ))}
    </div>
  );
}
