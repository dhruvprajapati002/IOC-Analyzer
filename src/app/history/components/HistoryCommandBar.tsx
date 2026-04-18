'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { APP_COLORS, BUTTON_STYLES, INPUT_STYLES } from '@/lib/colors';

export interface HistoryCommandBarProps {
  search: string;
  typeFilter: 'all' | 'ip' | 'domain' | 'url' | 'hash';
  verdict: 'all' | 'malicious' | 'suspicious' | 'harmless' | 'undetected';
  source: 'all' | 'ip_search' | 'domain_search' | 'url_search' | 'hash_search' | 'file_analysis';
  sortBy: 'newest' | 'oldest' | 'highest_risk' | 'most_detections';
  pageSize: 10 | 25 | 50;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: 'all' | 'ip' | 'domain' | 'url' | 'hash') => void;
  onVerdictFilterChange: (value: 'all' | 'malicious' | 'suspicious' | 'harmless' | 'undetected') => void;
  onSourceFilterChange: (value: 'all' | 'ip_search' | 'domain_search' | 'url_search' | 'hash_search' | 'file_analysis') => void;
  onSortByChange: (value: 'newest' | 'oldest' | 'highest_risk' | 'most_detections') => void;
  onPageSizeChange: (value: 10 | 25 | 50) => void;
  onClearFilters: () => void;
}

const pillBase: React.CSSProperties = {
  background: APP_COLORS.surface,
  border: `1px solid ${APP_COLORS.border}`,
  borderRadius: 20,
  padding: '6px 14px',
  fontSize: 13,
  color: APP_COLORS.textSecondary,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export function HistoryCommandBar({
  search,
  typeFilter,
  verdict,
  source,
  sortBy,
  pageSize,
  onSearchChange,
  onTypeFilterChange,
  onVerdictFilterChange,
  onSourceFilterChange,
  onSortByChange,
  onPageSizeChange,
  onClearFilters,
}: HistoryCommandBarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    if (localSearch === search) {
      return;
    }

    const timer = setTimeout(() => onSearchChange(localSearch), 500);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, search]);

  const hasFilters = useMemo(() => {
    return Boolean(
      search ||
      typeFilter !== 'all' ||
      verdict !== 'all' ||
      source !== 'all' ||
      sortBy !== 'newest'
    );
  }, [search, source, sortBy, typeFilter, verdict]);

  const getPillStyle = (active: boolean): React.CSSProperties => {
    if (!active) return pillBase;
    return {
      ...pillBase,
      border: `1px solid ${APP_COLORS.primary}`,
      borderLeft: `3px solid ${APP_COLORS.primary}`,
      color: APP_COLORS.primary,
      fontWeight: 700,
    };
  };

  return (
    <div
      className="rounded-2xl border p-3 md:p-4"
      style={{
        background: APP_COLORS.surface,
        border: `1px solid ${APP_COLORS.border}`,
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full md:w-auto md:min-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: APP_COLORS.textMuted }} />
          <input
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Search IOC, domain, hash, label..."
            className={`${INPUT_STYLES.base} w-full pl-9 pr-9`}
            style={{ color: APP_COLORS.textPrimary }}
          />
          {localSearch ? (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1"
              style={{ color: APP_COLORS.textMuted }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <select
          aria-label="Filter by IOC type"
          title="Filter by IOC type"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as any)}
          style={getPillStyle(typeFilter !== 'all')}
        >
          <option value="all">All Types</option>
          <option value="ip">IP Address</option>
          <option value="domain">Domain</option>
          <option value="url">URL</option>
          <option value="hash">File Hash</option>
        </select>

        <select
          aria-label="Filter by verdict"
          title="Filter by verdict"
          value={verdict}
          onChange={(event) => onVerdictFilterChange(event.target.value as any)}
          style={getPillStyle(verdict !== 'all')}
        >
          <option value="all">All Verdicts</option>
          <option value="malicious">Malicious</option>
          <option value="suspicious">Suspicious</option>
          <option value="harmless">Harmless</option>
          <option value="undetected">Undetected</option>
        </select>

        <select
          aria-label="Filter by source"
          title="Filter by source"
          value={source}
          onChange={(event) => onSourceFilterChange(event.target.value as any)}
          style={getPillStyle(source !== 'all')}
        >
          <option value="all">All Sources</option>
          <option value="ip_search">IP Search</option>
          <option value="domain_search">Domain Search</option>
          <option value="url_search">URL Search</option>
          <option value="hash_search">Hash Search</option>
          <option value="file_analysis">File Analysis</option>
        </select>

        <select
          aria-label="Sort results"
          title="Sort results"
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value as any)}
          style={getPillStyle(sortBy !== 'newest')}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest_risk">Highest Risk</option>
          <option value="most_detections">Most Detections</option>
        </select>

        <div className="ml-auto flex items-center gap-1 rounded-full border px-1 py-1" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          {[10, 25, 50].map((size) => {
            const active = pageSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => onPageSizeChange(size as 10 | 25 | 50)}
                className={active ? BUTTON_STYLES.primary : BUTTON_STYLES.ghost}
                style={
                  active
                    ? { padding: '4px 10px', fontSize: 12, borderRadius: 999 }
                    : { padding: '4px 10px', fontSize: 12, borderRadius: 999, color: APP_COLORS.textSecondary }
                }
              >
                {size}
              </button>
            );
          })}
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className={BUTTON_STYLES.ghost}
            style={{ borderRadius: 12, border: `1px solid ${APP_COLORS.border}` }}
          >
            <X className="mr-1 inline h-4 w-4" />
            Clear Filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
