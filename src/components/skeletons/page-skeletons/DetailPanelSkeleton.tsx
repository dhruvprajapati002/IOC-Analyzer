'use client';

import {
  SkeletonBadge,
  SkeletonButton,
  SkeletonCard,
  SkeletonCircle,
  SkeletonLine,
  SkeletonTitle,
} from '../SkeletonPrimitives';
import SkeletonBase from '../SkeletonBase';
import { APP_COLORS } from '@/lib/colors';

export default function DetailPanelSkeleton() {
  return (
    <div className="h-full min-h-0">
      <div className="rounded-2xl border" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.surface }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            padding: 20,
            borderBottom: `1px solid ${APP_COLORS.border}`,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <SkeletonBadge width={64} height={32} />
            <SkeletonBadge width={36} height={20} />
            <SkeletonLine width={220} height={16} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBadge width={120} height={44} />
            <SkeletonButton width={100} height={34} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, padding: '0 20px 20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 38%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard height={200}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <SkeletonCircle size={48} />
                <SkeletonTitle width="50%" height={28} />
                <SkeletonBadge width={80} height={24} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <SkeletonLine width={80} height={11} />
                  <SkeletonLine width={80} height={11} />
                </div>
              </div>
            </SkeletonCard>

            <SkeletonCard height={160}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SkeletonCircle size={120} />
              </div>
            </SkeletonCard>

            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonCard key={idx} height={72}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <SkeletonLine width="50%" height={22} />
                    <SkeletonLine width="60%" height={10} />
                  </div>
                </SkeletonCard>
              ))}
            </div>

            <SkeletonCard>
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <SkeletonLine width="60%" height={10} />
                    <SkeletonLine width="80%" height={13} />
                  </div>
                ))}
              </div>
            </SkeletonCard>
          </div>

          <div style={{ flex: '0 0 62%', minWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard height={220}>
              <div style={{ display: 'flex', gap: 16 }}>
                <SkeletonCircle size={120} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <SkeletonLine key={idx} height={12} />
                  ))}
                </div>
              </div>
            </SkeletonCard>

            <SkeletonCard>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <SkeletonBadge key={idx} width={80} height={24} />
                ))}
              </div>
              <SkeletonLine height={12} />
              <div style={{ marginTop: 8 }}>
                <SkeletonLine width="60%" height={12} />
              </div>
            </SkeletonCard>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} style={{ width: 160 }}>
                  <SkeletonCard height={120}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <SkeletonCircle size={20} />
                        <SkeletonLine width="60%" height={12} />
                      </div>
                      <SkeletonLine height={10} />
                      <SkeletonLine height={10} />
                      <SkeletonLine height={10} />
                    </div>
                  </SkeletonCard>
                </div>
              ))}
            </div>

            <SkeletonCard>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <SkeletonBase key={idx} width={100} height={64} borderRadius={10} />
                ))}
              </div>
            </SkeletonCard>
          </div>
        </div>
      </div>
    </div>
  );
}
