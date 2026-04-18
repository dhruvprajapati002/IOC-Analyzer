'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { mapAPIRecordToViewModel, HistoryRecord } from '../utils/historyMappers';

export interface HistoryQueryParams {
  search: string;
  typeFilter: 'all' | 'ip' | 'domain' | 'url' | 'hash';
  verdict: 'all' | 'malicious' | 'suspicious' | 'harmless' | 'undetected';
  source: 'all' | 'ip_search' | 'domain_search' | 'url_search' | 'hash_search' | 'file_analysis';
  sortBy: 'newest' | 'oldest' | 'highest_risk' | 'most_detections';
  page: number;
  pageSize: 10 | 25 | 50;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface KpiStats {
  total: number;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  unknown: number;
}

const EMPTY_PAGINATION: Pagination = {
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const EMPTY_KPI: KpiStats = {
  total: 0,
  malicious: 0,
  suspicious: 0,
  harmless: 0,
  undetected: 0,
  unknown: 0,
};

function mapSort(sortBy: HistoryQueryParams['sortBy']) {
  if (sortBy === 'oldest') return { sortBy: 'searched_at', sortOrder: 'asc' };
  if (sortBy === 'highest_risk') return { sortBy: 'riskScore', sortOrder: 'desc' };
  if (sortBy === 'most_detections') return { sortBy: 'malicious', sortOrder: 'desc' };
  return { sortBy: 'searched_at', sortOrder: 'desc' };
}

function sortClient(records: HistoryRecord[], sortBy: HistoryQueryParams['sortBy']): HistoryRecord[] {
  const copy = [...records];

  if (sortBy === 'oldest') {
    return copy.sort((a, b) => new Date(a.searchedAt).getTime() - new Date(b.searchedAt).getTime());
  }

  if (sortBy === 'highest_risk') {
    return copy.sort((a, b) => (b.riskScore ?? -1) - (a.riskScore ?? -1));
  }

  if (sortBy === 'most_detections') {
    return copy.sort((a, b) => {
      const aDetections = (a.stats.malicious ?? 0) + (a.stats.suspicious ?? 0);
      const bDetections = (b.stats.malicious ?? 0) + (b.stats.suspicious ?? 0);
      return bDetections - aDetections;
    });
  }

  return copy.sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime());
}

function aggregateKpi(records: HistoryRecord[]): KpiStats {
  return records.reduce<KpiStats>((acc, row) => {
    acc.total += 1;
    if (row.verdict === 'malicious') acc.malicious += 1;
    else if (row.verdict === 'suspicious') acc.suspicious += 1;
    else if (row.verdict === 'harmless' || row.verdict === 'clean') acc.harmless += 1;
    else if (row.verdict === 'undetected') acc.undetected += 1;
    else acc.unknown += 1;
    return acc;
  }, { ...EMPTY_KPI });
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useHistoryRecords(params: HistoryQueryParams) {
  const { token } = useAuth();
  const {
    search,
    typeFilter,
    verdict,
    source,
    sortBy,
    page,
    pageSize,
  } = params;
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const lastRequestKeyRef = useRef<string>('');

  const buildSearchParams = useCallback((custom?: Partial<HistoryQueryParams>) => {
    const merged: HistoryQueryParams = {
      search,
      typeFilter,
      verdict,
      source,
      sortBy,
      page,
      pageSize,
      ...custom,
    };

    const query = new URLSearchParams({
      page: String(merged.page),
      limit: String(merged.pageSize),
      ...mapSort(merged.sortBy),
    });

    if (merged.search) query.set('search', merged.search);
    if (merged.typeFilter !== 'all') query.set('type', merged.typeFilter);
    if (merged.verdict !== 'all') query.set('verdict', merged.verdict);
    if (merged.source !== 'all') query.set('source', merged.source);

    return query;
  }, [page, pageSize, search, sortBy, source, typeFilter, verdict]);

  const fetchRecords = useCallback(async (custom?: Partial<HistoryQueryParams>, force = false) => {
    if (!token) return;

    const searchParams = buildSearchParams(custom);
    const requestKey = `${token}:${searchParams.toString()}`;

    if (!force && requestKey === lastRequestKeyRef.current) {
      return;
    }

    lastRequestKeyRef.current = requestKey;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/history-v2?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch history (${response.status})`);
      }

      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error || 'Failed to fetch history');
      }

      const mapped = Array.isArray(payload?.data?.records)
        ? payload.data.records.map((row: any) => mapAPIRecordToViewModel(row))
        : [];

      setRecords(sortClient(mapped, custom?.sortBy ?? sortBy));

      const serverPagination = payload?.data?.pagination ?? {};
      setPagination({
        currentPage: Number(serverPagination.currentPage ?? page),
        totalPages: Number(serverPagination.totalPages ?? 0),
        totalCount: Number(serverPagination.totalCount ?? 0),
        hasNextPage: Boolean(serverPagination.hasNextPage),
        hasPrevPage: Boolean(serverPagination.hasPrevPage),
      });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to fetch history');
      setRecords([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [buildSearchParams, page, sortBy, token]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const kpiStats = useMemo(() => aggregateKpi(records), [records]);

  const exportCommon = useCallback(async (format: 'csv' | 'json') => {
    if (!token) return;

    try {
      const searchParams = buildSearchParams({ page: 1, pageSize: 50 });
      searchParams.set('limit', '1000');
      const response = await apiFetch(`/api/history-v2?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error || 'Failed to export data');
      }

      const mapped: HistoryRecord[] = Array.isArray(payload?.data?.records)
        ? payload.data.records.map((row: any) => mapAPIRecordToViewModel(row))
        : [];

      const stamp = new Date().toISOString().slice(0, 10);

      if (format === 'json') {
        downloadBlob(`ioc-history-${stamp}.json`, JSON.stringify(mapped, null, 2), 'application/json');
        return;
      }

      const header = [
        'IOC',
        'Type',
        'Verdict',
        'Severity',
        'Source',
        'Malicious',
        'Suspicious',
        'Harmless',
        'Undetected',
        'RiskScore',
        'SearchedAt',
      ];

      const lines = mapped.map((row) => [
        `"${row.ioc}"`,
        row.type,
        row.verdict,
        row.severity,
        row.source ?? '',
        String(row.stats.malicious),
        String(row.stats.suspicious),
        String(row.stats.harmless),
        String(row.stats.undetected),
        row.riskScore ?? '',
        `"${row.searchedAt}"`,
      ].join(','));

      downloadBlob(`ioc-history-${stamp}.csv`, [header.join(','), ...lines].join('\n'), 'text/csv');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to export history');
    }
  }, [buildSearchParams, token]);

  return {
    records,
    loading,
    error,
    pagination,
    kpiStats,
    refetch: () => void fetchRecords(undefined, true),
    exportCSV: () => void exportCommon('csv'),
    exportJSON: () => void exportCommon('json'),
  };
}
