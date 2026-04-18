'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, Search, X } from 'lucide-react';
import {
  APP_COLORS,
  CHART_COLORS,
  RISK_COLORS,
  STATUS_BADGE,
  BUTTON_STYLES,
  INPUT_STYLES,
  SHADOWS,
  LOADING_STYLES,
} from '@/lib/colors';
import { getRelativeTime, truncateMiddle } from '@/app/analyze/utils/analyzeFormatters';

type RecentEntry = {
  value: string;
  type: string;
  createdAt: number;
};

interface RecentSearchChipsProps {
  latestSearch?: string;
  latestType?: string;
  onSelect: (value: string) => void;
}

const STORAGE_KEY = 'recentIOCSearches';

function readEntries(): RecentEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function persistEntries(entries: RecentEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 5)));
}

export function RecentSearchChips({ latestSearch, latestType, onSelect }: RecentSearchChipsProps) {
  const [entries, setEntries] = useState<RecentEntry[]>([]);

  useEffect(() => {
    setEntries(readEntries());
  }, []);

  useEffect(() => {
    if (!latestSearch) return;

    setEntries((prev) => {
      const cleaned = latestSearch.trim();
      if (!cleaned) return prev;

      const next: RecentEntry[] = [
        {
          value: cleaned,
          type: latestType || 'unknown',
          createdAt: Date.now(),
        },
        ...prev.filter((entry) => entry.value !== cleaned),
      ].slice(0, 5);

      persistEntries(next);
      return next;
    });
  }, [latestSearch, latestType]);

  const hasEntries = entries.length > 0;

  const rendered = useMemo(
    () =>
      entries.map((entry) => (
        <div
          key={`${entry.value}-${entry.createdAt}`}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
          style={{
            borderColor: APP_COLORS.border,
            backgroundColor: APP_COLORS.backgroundSoft,
          }}
        >
          <button
            type="button"
            onClick={() => onSelect(entry.value)}
            className="inline-flex items-center gap-2"
          >
            <Search className="h-3 w-3" style={{ color: APP_COLORS.primary }} />
            <span
              className="text-xs font-semibold"
              style={{ color: APP_COLORS.textSecondary }}
              title={entry.value}
            >
              {truncateMiddle(entry.value, 20)}
            </span>
            <span className="text-[10px]" style={{ color: APP_COLORS.textMuted }}>
              {entry.type}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: APP_COLORS.textMuted }}>
              <Clock3 className="h-3 w-3" />
              {getRelativeTime(new Date(entry.createdAt))}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEntries((prev) => {
                const next = prev.filter((item) => item.createdAt !== entry.createdAt);
                persistEntries(next);
                return next;
              });
            }}
            className="rounded-full p-0.5"
            aria-label="Remove recent search"
            style={{ color: APP_COLORS.textMuted }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )),
    [entries, onSelect]
  );

  if (!hasEntries) return null;

  return <div className="flex flex-wrap items-center gap-2">{rendered}</div>;
}
