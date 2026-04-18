'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HistoryFilters } from './HistoryFilters';
import { HistoryTable } from './HistoryTable';
import { ErrorAlert } from './ErrorAlert';
import { IOCDetailPanel } from './IOCDetailPanel';
import { IOCRecord, HistoryStats as StatsType } from './types';
import { apiFetch } from '@/lib/apiFetch';

interface MyAnalysesTableProps {
  onStatsUpdate?: (stats: StatsType | null) => void; // ✅ NEW: Callback prop
}

export function MyAnalysesTable({ onStatsUpdate }: MyAnalysesTableProps) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [records, setRecords] = useState<IOCRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedIOC, setSelectedIOC] = useState<string | null>(null);

  const fetchRecords = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: 'searched_at',
        sortOrder: 'desc'
      });

      if (searchQuery) searchParams.set('search', searchQuery);
      if (typeFilter !== 'all') searchParams.set('type', typeFilter);
      if (verdictFilter !== 'all') searchParams.set('verdict', verdictFilter);
      if (sourceFilter !== 'all') searchParams.set('source', sourceFilter);

      const response = await apiFetch(`/api/history-v2?${searchParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const result = await response.json();

      if (result.success) {
        setRecords(result.data.records);
        setPagination(result.data.pagination);

        // ✅ Calculate stats
        const statsData: StatsType = {
          total: result.data.pagination.totalCount,
          byVerdict: {
            malicious: 0,
            suspicious: 0,
            harmless: 0,
            undetected: 0
          }
        };

        result.data.records.forEach((r: IOCRecord) => {
          if (r.verdict === 'malicious') statsData.byVerdict.malicious++;
          else if (r.verdict === 'suspicious') statsData.byVerdict.suspicious++;
          else if (r.verdict === 'harmless') statsData.byVerdict.harmless++;
          else statsData.byVerdict.undetected++;
        });

        // ✅ Send stats to parent
        onStatsUpdate?.(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
      onStatsUpdate?.(null); // ✅ Clear stats on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, typeFilter, verdictFilter, sourceFilter, itemsPerPage, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchRecords();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, verdictFilter, sourceFilter, itemsPerPage]);

  const exportData = async (format: 'csv' | 'json') => {
    try {
      if (!token) return;

      const searchParams = new URLSearchParams({
        page: '1',
        limit: '1000',
        sortBy: 'searched_at',
        sortOrder: 'desc'
      });

      if (searchQuery) searchParams.set('search', searchQuery);
      if (typeFilter !== 'all') searchParams.set('type', typeFilter);
      if (verdictFilter !== 'all') searchParams.set('verdict', verdictFilter);
      if (sourceFilter !== 'all') searchParams.set('source', sourceFilter);

      const response = await apiFetch(`/api/history-v2?${searchParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        const data = result.data.records;

        if (format === 'csv') {
          const headers = ['IOC', 'Type', 'Verdict', 'Source', 'Malicious', 'Suspicious', 'Clean', 'Undetected', 'Label', 'Analyzed'];
          const csvData = [
            headers.join(','),
            ...data.map((record: IOCRecord) => [
              `"${record.ioc}"`,
              record.type,
              record.verdict,
              record.source || 'unknown',
              record.stats.malicious,
              record.stats.suspicious,
              record.stats.harmless,
              record.stats.undetected,
              `"${record.label || ''}"`,
              `"${new Date(record.searchedAt).toISOString()}"`
            ].join(','))
          ].join('\n');

          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ioc-history-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ioc-history-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Main Content - Table */}
        <div className="flex-1 min-w-0 flex flex-col">
          {error && <ErrorAlert message={error} />}

          {/* ✅ REMOVED: HistoryStats - now in header */}

          <HistoryFilters
            searchQuery={searchQuery}
            typeFilter={typeFilter}
            verdictFilter={verdictFilter}
            sourceFilter={sourceFilter}
            onSearchChange={setSearchQuery}
            onTypeFilterChange={setTypeFilter}
            onVerdictFilterChange={setVerdictFilter}
            onExport={exportData}
          />

          <div className="flex-1 min-h-0 mt-4">
            <HistoryTable
              records={records}
              loading={loading}
              currentPage={currentPage}
              totalPages={pagination?.totalPages || 0}
              pagination={pagination}
              onPageChange={setCurrentPage}
              onViewDetails={setSelectedIOC}
              selectedIOC={selectedIOC}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>

        {/* Detail Panel */}
        <div
          className={`h-full transition-all duration-300 ease-in-out flex-shrink-0 ${selectedIOC ? 'w-[420px] sm:w-[450px] lg:w-[480px] xl:w-[520px]' : 'w-0'
            } overflow-hidden`}
        >
          {selectedIOC && (
            <IOCDetailPanel
              ioc={selectedIOC}
              onClose={() => setSelectedIOC(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
