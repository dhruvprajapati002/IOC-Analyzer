import Link from 'next/link';
import { AlertCircle, Filter, SearchX } from 'lucide-react';
import { APP_COLORS, BUTTON_STYLES } from '@/lib/colors';

interface EmptyStateProps {
  variant: 'empty' | 'no-results' | 'error';
  message?: string;
  onClearFilters?: () => void;
  onRetry?: () => void;
}

export function EmptyState({ variant, message, onClearFilters, onRetry }: EmptyStateProps) {
  if (variant === 'error') {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border p-8 text-center" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
        <AlertCircle className="mb-3 h-16 w-16" style={{ color: APP_COLORS.danger }} />
        <h3 className="text-xl font-black" style={{ color: APP_COLORS.textPrimary }}>Failed to load analysis history</h3>
        <p className="mt-2 text-sm" style={{ color: APP_COLORS.textMuted }}>{message || 'An unexpected error occurred.'}</p>
        <button type="button" className={`${BUTTON_STYLES.primary} mt-4`} onClick={onRetry}>Try Again</button>
      </div>
    );
  }

  if (variant === 'no-results') {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border p-8 text-center" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
        <Filter className="mb-3 h-16 w-16" style={{ color: APP_COLORS.textMuted }} />
        <h3 className="text-xl font-black" style={{ color: APP_COLORS.textPrimary }}>No results match your filters</h3>
        <p className="mt-2 text-sm" style={{ color: APP_COLORS.textMuted }}>Try adjusting your search or clearing filters</p>
        <button type="button" className={`${BUTTON_STYLES.secondary} mt-4`} onClick={onClearFilters}>Clear Filters</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border p-8 text-center" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <SearchX className="mb-3 h-16 w-16" style={{ color: APP_COLORS.textMuted }} />
      <h3 className="text-xl font-black" style={{ color: APP_COLORS.textPrimary }}>No analyses yet</h3>
      <p className="mt-2 text-sm" style={{ color: APP_COLORS.textMuted }}>Start by searching an IP, domain, URL, or file hash</p>
      <Link href="/analyze" className={`${BUTTON_STYLES.primary} mt-4`}>Go to Search</Link>
    </div>
  );
}
