import { ArrowLeft, CalendarClock, Check, Copy, Search } from 'lucide-react';
import { APP_COLORS, BUTTON_STYLES } from '@/lib/colors';
import { formatAbsoluteDate } from '../../utils/historyFormatters';

interface DetailHeaderProps {
  ioc: string;
  iocType?: string | null;
  source?: string | null;
  searchedAt?: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

function sourceLabel(source?: string | null): string {
  if (source === 'ip_search') return 'IP Search';
  if (source === 'domain_search') return 'Domain Search';
  if (source === 'url_search') return 'URL Search';
  if (source === 'hash_search') return 'Hash Search';
  if (source === 'file_analysis') return 'File Analysis';
  return 'History Detail';
}

export function DetailHeader({
  ioc,
  iocType,
  source,
  searchedAt,
  copied,
  onCopy,
  onClose,
}: DetailHeaderProps) {
  return (
    <header className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className={`${BUTTON_STYLES.ghost} inline-flex items-center gap-2`}
          style={{ border: `1px solid ${APP_COLORS.border}` }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </button>

        <span className="rounded-full px-3 py-1 text-xs font-black uppercase" style={{
          background: `${APP_COLORS.primary}15`,
          color: APP_COLORS.primary,
          border: `1px solid ${APP_COLORS.primary}40`,
        }}>
          {iocType || 'ioc'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <Search className="h-4 w-4" style={{ color: APP_COLORS.textMuted }} />
        <h2 className="min-w-0 truncate font-mono text-sm font-semibold md:text-base" style={{ color: APP_COLORS.textPrimary }} title={ioc}>
          {ioc}
        </h2>
        <button
          type="button"
          onClick={onCopy}
          className={BUTTON_STYLES.ghost}
          style={{ padding: '4px 8px', borderRadius: 10 }}
          aria-label="Copy IOC"
        >
          {copied ? <Check className="h-4 w-4" style={{ color: APP_COLORS.success }} /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs md:text-sm" style={{ color: APP_COLORS.textSecondary }}>
        <span className="rounded-full px-2 py-1" style={{ background: APP_COLORS.backgroundSoft }}>
          {sourceLabel(source)}
        </span>
        {searchedAt ? (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-4 w-4" />
            {formatAbsoluteDate(searchedAt)}
          </span>
        ) : null}
      </div>
    </header>
  );
}
