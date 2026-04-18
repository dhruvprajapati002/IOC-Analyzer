'use client';

import { AlertTriangle, CheckCircle, Eye, MinusCircle, Shield } from 'lucide-react';
import { APP_COLORS, RISK_COLORS } from '@/lib/colors';

interface KpiStats {
  total: number;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  unknown: number;
}

interface HistoryKPIStripProps {
  stats: KpiStats;
  activeVerdict: 'all' | 'malicious' | 'suspicious' | 'harmless' | 'undetected';
  onVerdictSelect: (value: 'all' | 'malicious' | 'suspicious' | 'harmless' | 'undetected') => void;
}

function percentage(count: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}

export function HistoryKPIStrip({ stats, activeVerdict, onVerdictSelect }: HistoryKPIStripProps) {
  const items = [
    { key: 'all', label: 'Total', count: stats.total, color: APP_COLORS.primary, icon: Shield },
    { key: 'malicious', label: 'Malicious', count: stats.malicious, color: RISK_COLORS.critical.primary, icon: AlertTriangle },
    { key: 'suspicious', label: 'Suspicious', count: stats.suspicious, color: APP_COLORS.warning, icon: Eye },
    { key: 'harmless', label: 'Harmless', count: stats.harmless, color: APP_COLORS.success, icon: CheckCircle },
    { key: 'undetected', label: 'Undetected', count: stats.undetected, color: APP_COLORS.neutral, icon: MinusCircle },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeVerdict === item.key;
        return (
          <button
            type="button"
            key={item.key}
            onClick={() => onVerdictSelect(item.key as any)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-left"
            style={{
              background: APP_COLORS.surface,
              border: `1px solid ${active ? APP_COLORS.primary : APP_COLORS.border}`,
              boxShadow: active ? '0 0 0 2px rgba(201,100,66,0.15)' : undefined,
              transition: 'all 0.15s ease',
            }}
          >
            <Icon className="h-4 w-4" style={{ color: item.color }} />
            <div className="flex flex-col">
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: APP_COLORS.textMuted, fontWeight: 700 }}
              >
                {item.label}
              </span>
              <span className="text-xl font-black leading-none" style={{ color: APP_COLORS.textPrimary }}>
                {item.count}
              </span>
            </div>
            <span
              className="ml-2 rounded-lg px-2 py-0.5 text-[11px] font-bold"
              style={{
                background: `${item.color}15`,
                color: item.color,
              }}
            >
              {percentage(item.count, stats.total)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
