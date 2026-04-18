'use client';

import { useState } from 'react';
import { ProtectedPage } from '@/components/ProtectedPage';
import { MyAnalysesTable } from '@/app/history/components/MyAnalysesTable';
import { HistoryStats } from '@/app/history/components/HistoryStats';
import { HistoryStats as StatsType } from '@/app/history/components/types';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

export default function HistoryPage() {
  return (
    <ProtectedPage>
      <HistoryPageContent />
    </ProtectedPage>
  );
}

function HistoryPageContent() {
  const [refreshKey] = useState(0);
  const [stats, setStats] = useState<StatsType | null>(null);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: "calc(100vh - 3rem)",
        backgroundColor: APP_COLORS.background,
      }}
    >
      {/* Toolbar: Stats */}
      <div
        className="flex-shrink-0"
        style={{ borderColor: APP_COLORS.border }}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            {stats && <HistoryStats stats={stats} compact />}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <MyAnalysesTable key={refreshKey} onStatsUpdate={setStats} />
        </div>
      </div>
    </div>
  );
}
