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
    <div className="flex h-[calc(100vh-3rem)] flex-col" style={{ background: APP_COLORS.background }}>
      <div className="flex-shrink-0 border-b" style={{ borderColor: APP_COLORS.border }}>
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="inline-flex items-center gap-2 text-xl font-black md:text-2xl" style={{ color: APP_COLORS.textPrimary }}>
              <History className="h-5 w-5 md:h-6 md:w-6" style={{ color: APP_COLORS.primary }} />
              Analysis History
            </h1>
            <p className="text-xs md:text-sm" style={{ color: APP_COLORS.textMuted }}>
              Search, filter, and inspect IOC intelligence over time.
            </p>
          </div>

          {!showDetailMode ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={BUTTON_STYLES.secondary}
                onClick={exportCSV}
              >
                <Download className="mr-1 inline h-4 w-4" />
                CSV
              </button>
              <button
                type="button"
                className={BUTTON_STYLES.secondary}
                onClick={exportJSON}
              >
                <FileJson className="mr-1 inline h-4 w-4" />
                JSON
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-[1920px] px-4 py-4 sm:px-6 lg:px-8">
          {showDetailMode && query.selectedIOC ? (
            <IOCDetailPanel
              ioc={query.selectedIOC}
              iocType={query.selectedType}
              onClose={query.closeDetail}
            />
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
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

              <HistoryKPIStrip
                stats={kpiStats}
                activeVerdict={query.verdict}
                onVerdictSelect={(value) => query.setVerdict(value)}
              />

              {error ? (
                <EmptyState variant="error" message={error} onRetry={refetch} />
              ) : records.length === 0 && !loading ? (
                <EmptyState
                  variant={hasActiveFilters ? 'no-results' : 'empty'}
                  onClearFilters={query.clearFilters}
                />
              ) : (
                <AnalysisCardGrid
                  records={records}
                  loading={loading}
                  pagination={pagination}
                  pageSize={query.pageSize}
                  onPageChange={query.setPage}
                  onOpenDetail={query.openDetail}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
