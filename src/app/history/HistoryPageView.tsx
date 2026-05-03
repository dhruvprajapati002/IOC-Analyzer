'use client';

import { Download, FileJson, History } from 'lucide-react';
import { ProtectedPage } from '@/components/ProtectedPage';
import { APP_COLORS, BUTTON_STYLES } from '@/lib/colors';
import { HistoryCommandBar } from './components/HistoryCommandBar';
import { HistoryKPIStrip } from './components/HistoryKPIStrip';
import { AnalysisCardGrid } from './components/AnalysisCardGrid';
import { EmptyState } from './components/EmptyState';
import { IOCDetailPanel } from './components/IOCDetailPanel';
import { useHistoryQueryState } from './hooks/useHistoryQueryState';
import { useHistoryRecords } from './hooks/useHistoryRecords';
import { HistorySkeleton } from '@/components/skeletons';

export default function HistoryPageView() {
  return (
    <ProtectedPage>
      <HistoryPageContent />
    </ProtectedPage>
  );
}

function HistoryPageContent() {
  const query = useHistoryQueryState();
  const { records, loading, error, pagination, kpiStats, refetch, exportCSV, exportJSON } = useHistoryRecords({
    search: query.search,
    typeFilter: query.typeFilter,
    verdict: query.verdict,
    source: query.source,
    sortBy: query.sortBy,
    page: query.page,
    pageSize: query.pageSize,
  });

  const hasActiveFilters = Boolean(
    query.search ||
    query.typeFilter !== 'all' ||
    query.verdict !== 'all' ||
    query.source !== 'all' ||
    query.sortBy !== 'newest'
  );

  const showDetailMode = Boolean(query.selectedIOC);

  return (
    <div style={{ background: APP_COLORS.background }}>
      <div className="mx-auto w-full max-w-[1920px] px-4 py-4 sm:px-6 lg:px-8">
          {showDetailMode && query.selectedIOC ? (
            <IOCDetailPanel
              ioc={query.selectedIOC}
              iocType={query.selectedType}
              onClose={query.closeDetail}
            />
          ) : (
            loading ? (
              <HistorySkeleton />
            ) : (
            <div className="flex flex-col gap-4">
              <HistoryCommandBar
                search={query.search}
                typeFilter={query.typeFilter}
                verdict={query.verdict}
                source={query.source}
                sortBy={query.sortBy}
                pageSize={query.pageSize}
                onSearchChange={query.setSearch}
                onTypeFilterChange={query.setTypeFilter}
                onVerdictFilterChange={query.setVerdict}
                onSourceFilterChange={query.setSource}
                onSortByChange={query.setSortBy}
                onPageSizeChange={query.setPageSize}
                onClearFilters={query.clearFilters}
              />

              <div className="flex items-center justify-between gap-4">
                <HistoryKPIStrip
                  stats={kpiStats}
                  activeVerdict={query.verdict}
                  onVerdictSelect={(value) => query.setVerdict(value)}
                />
                
                <div className="relative group">
                  <button
                    type="button"
                    className={BUTTON_STYLES.secondary}
                  >
                    <Download className="mr-1 inline h-4 w-4" />
                    Download Report
                  </button>
                  <div className="absolute right-0 mt-2 hidden w-48 flex-col rounded-md border bg-white p-1 shadow-lg group-hover:flex z-10" style={{ backgroundColor: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
                    <button
                      type="button"
                      onClick={exportCSV}
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-black/10"
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      <Download className="h-4 w-4" />
                      Export as CSV
                    </button>
                    <button
                      type="button"
                      onClick={exportJSON}
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-black/10"
                      style={{ color: APP_COLORS.textPrimary }}
                    >
                      <FileJson className="h-4 w-4" />
                      Export as JSON
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <EmptyState variant="error" message={error} onRetry={refetch} />
              ) : records.length === 0 ? (
                <EmptyState
                  variant={hasActiveFilters ? 'no-results' : 'empty'}
                  onClearFilters={query.clearFilters}
                />
              ) : (
                <AnalysisCardGrid
                  records={records}
                  pagination={pagination}
                  pageSize={query.pageSize}
                  onPageChange={query.setPage}
                  onOpenDetail={query.openDetail}
                />
              )}
            </div>
            )
          )}
        </div>
    </div>
  );
}
