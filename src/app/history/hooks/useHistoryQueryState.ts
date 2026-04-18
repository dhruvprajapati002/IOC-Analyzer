'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type HistorySort = 'newest' | 'oldest' | 'highest_risk' | 'most_detections';
export type HistoryTypeFilter = 'all' | 'ip' | 'domain' | 'url' | 'hash';
export type HistoryVerdictFilter = 'all' | 'malicious' | 'suspicious' | 'harmless' | 'undetected';
export type HistorySourceFilter = 'all' | 'ip_search' | 'domain_search' | 'url_search' | 'hash_search' | 'file_analysis';
export type HistoryPageSize = 10 | 25 | 50;

interface QueryState {
  search: string;
  typeFilter: HistoryTypeFilter;
  verdict: HistoryVerdictFilter;
  source: HistorySourceFilter;
  sortBy: HistorySort;
  page: number;
  pageSize: HistoryPageSize;
  selectedIOC: string | null;
  selectedType: string | null;
}

const DEFAULT_STATE: QueryState = {
  search: '',
  typeFilter: 'all',
  verdict: 'all',
  source: 'all',
  sortBy: 'newest',
  page: 1,
  pageSize: 10,
  selectedIOC: null,
  selectedType: null,
};

function parsePage(value: string | null): number {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 1;
}

function parsePageSize(value: string | null): HistoryPageSize {
  if (value === '25') return 25;
  if (value === '50') return 50;
  return 10;
}

function parseSort(value: string | null): HistorySort {
  if (value === 'oldest' || value === 'highest_risk' || value === 'most_detections') {
    return value;
  }
  return 'newest';
}

function parseType(value: string | null): HistoryTypeFilter {
  if (value === 'ip' || value === 'domain' || value === 'url' || value === 'hash') {
    return value;
  }
  return 'all';
}

function parseVerdict(value: string | null): HistoryVerdictFilter {
  if (value === 'malicious' || value === 'suspicious' || value === 'harmless' || value === 'undetected') {
    return value;
  }
  return 'all';
}

function parseSource(value: string | null): HistorySourceFilter {
  if (
    value === 'ip_search' ||
    value === 'domain_search' ||
    value === 'url_search' ||
    value === 'hash_search' ||
    value === 'file_analysis'
  ) {
    return value;
  }
  return 'all';
}

export function useHistoryQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? '';

  const state = useMemo<QueryState>(() => {
    const currentParams = new URLSearchParams(searchParamsString);
    const search = currentParams.get('q') ?? '';
    const selectedIOC = currentParams.get('ioc') ?? null;
    const selectedType = currentParams.get('iocType') ?? currentParams.get('type') ?? null;

    return {
      search,
      typeFilter: parseType(currentParams.get('typeFilter')),
      verdict: parseVerdict(currentParams.get('verdict')),
      source: parseSource(currentParams.get('source')),
      sortBy: parseSort(currentParams.get('sortBy')),
      page: parsePage(currentParams.get('page')),
      pageSize: parsePageSize(currentParams.get('pageSize')),
      selectedIOC,
      selectedType,
    };
  }, [searchParamsString]);

  const setQuery = useCallback((updates: Partial<QueryState>) => {
    const params = new URLSearchParams(searchParamsString);

    const currentState: QueryState = {
      search: params.get('q') ?? '',
      typeFilter: parseType(params.get('typeFilter')),
      verdict: parseVerdict(params.get('verdict')),
      source: parseSource(params.get('source')),
      sortBy: parseSort(params.get('sortBy')),
      page: parsePage(params.get('page')),
      pageSize: parsePageSize(params.get('pageSize')),
      selectedIOC: params.get('ioc'),
      selectedType: params.get('iocType') ?? params.get('type'),
    };

    const nextState: QueryState = {
      ...currentState,
      ...updates,
    };

    if (nextState.search) params.set('q', nextState.search);
    else params.delete('q');

    if (nextState.typeFilter !== 'all') params.set('typeFilter', nextState.typeFilter);
    else params.delete('typeFilter');

    if (nextState.verdict !== 'all') params.set('verdict', nextState.verdict);
    else params.delete('verdict');

    if (nextState.source !== 'all') params.set('source', nextState.source);
    else params.delete('source');

    if (nextState.sortBy !== 'newest') params.set('sortBy', nextState.sortBy);
    else params.delete('sortBy');

    if (nextState.page > 1) params.set('page', String(nextState.page));
    else params.delete('page');

    if (nextState.pageSize !== 10) params.set('pageSize', String(nextState.pageSize));
    else params.delete('pageSize');

    if (nextState.selectedIOC) params.set('ioc', nextState.selectedIOC);
    else params.delete('ioc');

    if (nextState.selectedType) params.set('iocType', nextState.selectedType);
    else params.delete('iocType');

    const nextQuery = params.toString();
    const currentQuery = searchParamsString;

    if (nextQuery === currentQuery) {
      return;
    }

    const basePath = pathname || '/history';
    const target = nextQuery ? `${basePath}?${nextQuery}` : basePath;
    router.push(target, { scroll: false });
  }, [pathname, router, searchParamsString]);

  const openDetail = useCallback((ioc: string, type: string) => {
    setQuery({ selectedIOC: ioc, selectedType: type });
  }, [setQuery]);

  const closeDetail = useCallback(() => {
    setQuery({ selectedIOC: null, selectedType: null });
  }, [setQuery]);

  const clearFilters = useCallback(() => {
    setQuery({
      search: DEFAULT_STATE.search,
      typeFilter: DEFAULT_STATE.typeFilter,
      verdict: DEFAULT_STATE.verdict,
      source: DEFAULT_STATE.source,
      sortBy: DEFAULT_STATE.sortBy,
      page: DEFAULT_STATE.page,
      pageSize: state.pageSize,
    });
  }, [setQuery, state.pageSize]);

  const setSearch = useCallback((search: string) => setQuery({ search, page: 1 }), [setQuery]);
  const setTypeFilter = useCallback((typeFilter: HistoryTypeFilter) => setQuery({ typeFilter, page: 1 }), [setQuery]);
  const setVerdict = useCallback((verdict: HistoryVerdictFilter) => setQuery({ verdict, page: 1 }), [setQuery]);
  const setSource = useCallback((source: HistorySourceFilter) => setQuery({ source, page: 1 }), [setQuery]);
  const setSortBy = useCallback((sortBy: HistorySort) => setQuery({ sortBy, page: 1 }), [setQuery]);
  const setPage = useCallback((page: number) => setQuery({ page }), [setQuery]);
  const setPageSize = useCallback((pageSize: HistoryPageSize) => setQuery({ pageSize, page: 1 }), [setQuery]);

  return {
    ...state,
    setSearch,
    setTypeFilter,
    setVerdict,
    setSource,
    setSortBy,
    setPage,
    setPageSize,
    openDetail,
    closeDetail,
    clearFilters,
  };
}
