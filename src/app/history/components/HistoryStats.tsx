'use client';

import { Database, AlertTriangle, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';
import { HistoryStats as StatsType } from './types';

interface HistoryStatsProps {
  stats: StatsType;
  compact?: boolean; // ✅ NEW: Compact mode
}

export function HistoryStats({ stats, compact = false }: HistoryStatsProps) {
  // ✅ Adjust sizes based on compact mode
  const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const labelClass = compact ? TYPOGRAPHY.label.sm : TYPOGRAPHY.label.lg;
  const valueClass = compact ? TYPOGRAPHY.data.xs : TYPOGRAPHY.data.xs;
  const padding = compact ? 'px-3 py-2' : 'px-4 py-2.5';
  const gap = compact ? 'gap-3' : 'gap-4';

  return (
    <div 
      className={`inline-flex items-center ${gap} ${padding}`}
      style={{
        borderColor: APP_COLORS.border,
      }}
    >
      {/* Total IOCs */}
      <div className="flex items-center gap-2">
        <Database className={iconSize} style={{ color: APP_COLORS.primary }} />
        <span
          className={`${labelClass} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
          style={{ color: APP_COLORS.textSecondary }}
        >
          IOCs:
        </span>
        <span
          className={`${valueClass} ${TYPOGRAPHY.fontWeight.black} tabular-nums`}
          style={{ color: APP_COLORS.primary }}
        >
          {stats.total}
        </span>
      </div>

      {/* Divider */}
      <div className={compact ? 'h-4 w-px' : 'h-5 w-px'} style={{ backgroundColor: APP_COLORS.border }} />

      {/* Malicious */}
      <div className="flex items-center gap-2">
        <AlertTriangle className={iconSize} style={{ color: APP_COLORS.danger }} />
        <span
          className={`${labelClass} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
          style={{ color: APP_COLORS.textSecondary }}
        >
          Malicious:
        </span>
        <span
          className={`${valueClass} ${TYPOGRAPHY.fontWeight.black} tabular-nums`}
          style={{ color: APP_COLORS.danger }}
        >
          {stats.byVerdict.malicious || 0}
        </span>
      </div>

      {/* Divider */}
      <div className={compact ? 'h-4 w-px' : 'h-5 w-px'} style={{ backgroundColor: APP_COLORS.border }} />

      {/* Suspicious */}
      <div className="flex items-center gap-2">
        <ShieldAlert className={iconSize} style={{ color: APP_COLORS.warning }} />
        <span
          className={`${labelClass} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
          style={{ color: APP_COLORS.textSecondary }}
        >
          Suspicious:
        </span>
        <span
          className={`${valueClass} ${TYPOGRAPHY.fontWeight.black} tabular-nums`}
          style={{ color: APP_COLORS.warning }}
        >
          {stats.byVerdict.suspicious || 0}
        </span>
      </div>

      {/* Divider */}
      <div className={compact ? 'h-4 w-px' : 'h-5 w-px'} style={{ backgroundColor: APP_COLORS.border }} />

      {/* Clean */}
      <div className="flex items-center gap-2">
        <CheckCircle className={iconSize} style={{ color: APP_COLORS.success }} />
        <span
          className={`${labelClass} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
          style={{ color: APP_COLORS.textSecondary }}
        >
          Clean:
        </span>
        <span
          className={`${valueClass} ${TYPOGRAPHY.fontWeight.black} tabular-nums`}
          style={{ color: APP_COLORS.success }}
        >
          {stats.byVerdict.harmless || 0}
        </span>
      </div>

      {/* Divider */}
      <div className={compact ? 'h-4 w-px' : 'h-5 w-px'} style={{ backgroundColor: APP_COLORS.border }} />

      {/* Undetected */}
      <div className="flex items-center gap-2">
        <HelpCircle className={iconSize} style={{ color: APP_COLORS.textSecondary }} />
        <span
          className={`${labelClass} ${TYPOGRAPHY.fontWeight.semibold} uppercase tracking-wide`}
          style={{ color: APP_COLORS.textSecondary }}
        >
          Undetected:
        </span>
        <span
          className={`${valueClass} ${TYPOGRAPHY.fontWeight.black} tabular-nums`}
          style={{ color: APP_COLORS.textSecondary }}
        >
          {stats.byVerdict.undetected || 0}
        </span>
      </div>
    </div>
  );
}
