import { ChevronLeft, ChevronRight } from 'lucide-react';
import { APP_COLORS, BUTTON_STYLES } from '@/lib/colors';
import type { HistoryRecord } from '../utils/historyMappers';
import { AnalysisCard } from './AnalysisCard';

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AnalysisCardGridProps {
  records: HistoryRecord[];
  pagination: Pagination;
  pageSize: 10 | 25 | 50;
  onPageChange: (page: number) => void;
  onOpenDetail: (ioc: string, type: string) => void;
}

function getPageWindow(currentPage: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | '...'> = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return pages;
}

export function AnalysisCardGrid({
  records,
  pagination,
  pageSize,
  onPageChange,
  onOpenDetail,
}: AnalysisCardGridProps) {
  const pageWindow = getPageWindow(pagination.currentPage, pagination.totalPages);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 md:gap-5">
        {records.map((record) => (
          <AnalysisCard key={record.id} record={record} onOpenDetail={onOpenDetail} />
        ))}
      </div>

      {pagination.totalPages > 0 ? (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border px-4 py-3 md:flex-row" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.surface }}>
          <p className="text-sm" style={{ color: APP_COLORS.textMuted }}>
            Showing {(pagination.currentPage - 1) * pageSize + 1}–{Math.min(pagination.currentPage * pageSize, pagination.totalCount)} of {pagination.totalCount} results
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className={BUTTON_STYLES.ghost}
              onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={!pagination.hasPrevPage}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: `1px solid ${APP_COLORS.border}`,
                opacity: pagination.hasPrevPage ? 1 : 0.5,
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageWindow.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-sm" style={{ color: APP_COLORS.textMuted }}>
                    ...
                  </span>
                );
              }

              const active = page === pagination.currentPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={active ? BUTTON_STYLES.primary : BUTTON_STYLES.ghost}
                  style={
                    active
                      ? { padding: '6px 10px', borderRadius: 10, fontSize: 12 }
                      : {
                          padding: '6px 10px',
                          borderRadius: 10,
                          fontSize: 12,
                          border: `1px solid ${APP_COLORS.border}`,
                          color: APP_COLORS.textSecondary,
                        }
                  }
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              className={BUTTON_STYLES.ghost}
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={!pagination.hasNextPage}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: `1px solid ${APP_COLORS.border}`,
                opacity: pagination.hasNextPage ? 1 : 0.5,
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
