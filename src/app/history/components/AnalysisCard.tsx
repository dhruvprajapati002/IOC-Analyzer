'use client';

import { ArrowRight, Copy, ExternalLink, FileText, Globe, Hash, Link as LinkIcon, Search, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { APP_COLORS, RISK_COLORS, STATUS_BADGE, BUTTON_STYLES, SHADOWS } from '@/lib/colors';
import { formatAbsoluteDate, formatDetectionRate, formatFileSize, formatRelativeTime, truncateIOC } from '../utils/historyFormatters';
import type { HistoryRecord } from '../utils/historyMappers';

interface AnalysisCardProps {
  record: HistoryRecord;
  onOpenDetail: (ioc: string, type: string) => void;
}

function getVerdictBadge(verdict: string): string {
  if (verdict === 'malicious') return STATUS_BADGE.malicious;
  if (verdict === 'suspicious') return STATUS_BADGE.suspicious;
  if (verdict === 'harmless' || verdict === 'clean') return STATUS_BADGE.clean;
  return STATUS_BADGE.unknown;
}

function getTypeStyle(type: string): React.CSSProperties {
  if (type === 'ip') {
    return { background: `${APP_COLORS.accentBlue}15`, color: APP_COLORS.accentBlue, border: `1px solid ${APP_COLORS.accentBlue}40` };
  }
  if (type === 'domain') {
    return { background: `${APP_COLORS.primary}15`, color: APP_COLORS.primary, border: `1px solid ${APP_COLORS.primary}40` };
  }
  if (type === 'url') {
    return { background: `${APP_COLORS.warning}15`, color: APP_COLORS.warningDark, border: `1px solid ${APP_COLORS.warning}40` };
  }
  if (type === 'hash') {
    return { background: `${APP_COLORS.accentPurple}15`, color: APP_COLORS.accentPurple, border: `1px solid ${APP_COLORS.accentPurple}40` };
  }
  return { background: APP_COLORS.backgroundSoft, color: APP_COLORS.textMuted, border: `1px solid ${APP_COLORS.border}` };
}

function getSourceMeta(source: string | null) {
  if (source === 'file_analysis') return { icon: FileText, label: 'File Analysis' };
  if (source === 'ip_search') return { icon: Globe, label: 'IP Search' };
  if (source === 'domain_search') return { icon: LinkIcon, label: 'Domain Search' };
  if (source === 'url_search') return { icon: ExternalLink, label: 'URL Search' };
  if (source === 'hash_search') return { icon: Hash, label: 'Hash Search' };
  return { icon: Search, label: 'IOC Search' };
}

function pickRiskColor(score: number | null): string {
  if (!Number.isFinite(Number(score))) return APP_COLORS.textMuted;
  const value = Number(score);
  if (value >= 70) return RISK_COLORS.critical.primary;
  if (value >= 40) return APP_COLORS.warning;
  return APP_COLORS.success;
}

export function AnalysisCard({ record, onOpenDetail }: AnalysisCardProps) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalDetections = record.stats.malicious + record.stats.suspicious + record.stats.harmless + record.stats.undetected;
  const highlight = record.verdict === 'malicious' || (record.riskScore ?? 0) >= 70;
  const detectionRate = formatDetectionRate(record.stats);
  const sourceMeta = getSourceMeta(record.source);

  const contextText = useMemo(() => {
    if (record.source === 'file_analysis' && record.metadata?.filename) {
      const size = formatFileSize(record.metadata.filesize);
      return `${record.metadata.filename}${size !== 'Unknown' ? ` (${size})` : ''}`;
    }
    if (record.label) return record.label;
    if (record.type === 'ip') return 'IP Address Analysis';
    if (record.type === 'domain') return 'Domain Analysis';
    if (record.type === 'url') return 'URL Analysis';
    if (record.type === 'hash') return 'Hash Analysis';
    return 'IOC Analysis';
  }, [record]);

  const tags = useMemo(() => {
    const merged = [record.popularThreatLabel, ...record.threatTypes, ...record.familyLabels]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim())
      .filter(Boolean);

    return [...new Set(merged)];
  }, [record.familyLabels, record.popularThreatLabel, record.threatTypes]);

  const copyIOC = (event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(record.ioc);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const segment = (count: number) => {
    if (totalDetections <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((count / totalDetections) * 100)));
  };

  return (
    <article
      className={`${SHADOWS.card} rounded-2xl border p-4 md:p-5`}
      style={{
        background: highlight
          ? `linear-gradient(to right, ${RISK_COLORS.critical.bg}, ${APP_COLORS.surface})`
          : APP_COLORS.surface,
        borderColor: hovered ? `${APP_COLORS.primary}66` : APP_COLORS.border,
        borderLeft: highlight ? `4px solid ${RISK_COLORS.critical.primary}` : `1px solid ${APP_COLORS.border}`,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 24px rgba(0,0,0,0.06)' : undefined,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenDetail(record.ioc, record.type)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-full px-2 py-1 text-[10px] font-black uppercase" style={getTypeStyle(record.type)}>
            {record.type}
          </span>
          <span
            className="truncate font-mono text-sm font-semibold"
            style={{ color: APP_COLORS.textPrimary }}
            title={record.ioc}
          >
            {truncateIOC(record.ioc, 38)}
          </span>
        </div>
        <span className={getVerdictBadge(record.verdict)}>{record.verdict}</span>
      </div>

      <div className="mb-3">
        {totalDetections === 0 ? (
          <div className="text-xs" style={{ color: APP_COLORS.textMuted }}>No detection data</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="mb-1 text-xs font-semibold" style={{ color: RISK_COLORS.critical.primary }}>M {record.stats.malicious}</div>
              <div className="h-1 rounded" style={{ background: APP_COLORS.borderSoft }}>
                <div className="h-1 rounded" style={{ width: `${segment(record.stats.malicious)}%`, background: RISK_COLORS.critical.primary }} />
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold" style={{ color: APP_COLORS.warningDark }}>S {record.stats.suspicious}</div>
              <div className="h-1 rounded" style={{ background: APP_COLORS.borderSoft }}>
                <div className="h-1 rounded" style={{ width: `${segment(record.stats.suspicious)}%`, background: APP_COLORS.warning }} />
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold" style={{ color: APP_COLORS.successGreen }}>H {record.stats.harmless}</div>
              <div className="h-1 rounded" style={{ background: APP_COLORS.borderSoft }}>
                <div className="h-1 rounded" style={{ width: `${segment(record.stats.harmless)}%`, background: APP_COLORS.success }} />
              </div>
            </div>
          </div>
        )}
        <div className="mt-2 inline-flex rounded-md px-2 py-1 text-[11px] font-bold" style={{
          color: detectionRate > 50 ? RISK_COLORS.critical.primary : detectionRate >= 10 ? APP_COLORS.warningDark : APP_COLORS.successGreen,
          background: detectionRate > 50 ? RISK_COLORS.critical.bg : detectionRate >= 10 ? `${APP_COLORS.warning}15` : `${APP_COLORS.success}15`,
        }}>
          Detection rate {detectionRate}%
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span style={{ color: APP_COLORS.textMuted }}>Risk Score</span>
          <div className="h-1.5 w-20 overflow-hidden rounded" style={{ background: APP_COLORS.borderSoft }}>
            <div
              className="h-1.5 rounded"
              style={{
                width: `${Math.max(0, Math.min(100, Number(record.riskScore ?? 0)))}%`,
                background: pickRiskColor(record.riskScore),
              }}
            />
          </div>
          <span className="font-bold" style={{ color: APP_COLORS.textPrimary }}>
            {Number.isFinite(Number(record.riskScore)) ? Math.round(Number(record.riskScore)) : '--'}
          </span>
        </div>

        {record.severity && record.severity !== 'unknown' ? (
          <span
            className="rounded px-2 py-1 text-[10px] font-black uppercase"
            style={{
              color:
                record.severity === 'critical'
                  ? RISK_COLORS.critical.primary
                  : record.severity === 'high'
                    ? RISK_COLORS.high.primary
                    : record.severity === 'medium'
                      ? RISK_COLORS.medium.primary
                      : RISK_COLORS.low.primary,
              background:
                record.severity === 'critical'
                  ? RISK_COLORS.critical.bg
                  : record.severity === 'high'
                    ? RISK_COLORS.high.bg
                    : record.severity === 'medium'
                      ? RISK_COLORS.medium.bg
                      : RISK_COLORS.low.bg,
              border: `1px solid ${
                record.severity === 'critical'
                  ? RISK_COLORS.critical.border
                  : record.severity === 'high'
                    ? RISK_COLORS.high.border
                    : record.severity === 'medium'
                      ? RISK_COLORS.medium.border
                      : RISK_COLORS.low.border
              }`,
            }}
          >
            {record.severity}
          </span>
        ) : null}

        {Number.isFinite(Number(record.confidence)) ? (
          <span className="inline-flex items-center gap-1" style={{ color: APP_COLORS.textMuted }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: APP_COLORS.primary }} />
            {Math.round(Number(record.confidence) * 100)}% conf
          </span>
        ) : null}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs" style={{ background: APP_COLORS.backgroundSoft, color: APP_COLORS.textMuted }}>
            <sourceMeta.icon className="h-3.5 w-3.5" />
            {sourceMeta.label}
          </span>
          <span className="truncate text-sm" style={{ color: APP_COLORS.textSecondary }} title={contextText}>
            {contextText}
          </span>
        </div>
        <span className="text-xs" style={{ color: APP_COLORS.textMuted }} title={formatAbsoluteDate(record.searchedAt)}>
          {formatRelativeTime(record.searchedAt)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-full px-2 py-1 text-xs"
              style={
                index === 0 && tag === record.popularThreatLabel
                  ? { background: `${APP_COLORS.primary}20`, color: APP_COLORS.primary }
                  : { background: APP_COLORS.backgroundSoft, color: APP_COLORS.textSecondary }
              }
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 ? (
            <span className="rounded-full px-2 py-1 text-xs" style={{ background: `${APP_COLORS.primary}15`, color: APP_COLORS.primary }}>
              +{tags.length - 3}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={copyIOC} className={BUTTON_STYLES.ghost} style={{ padding: '4px 8px', borderRadius: 8 }}>
            {copied ? <Check className="h-3.5 w-3.5" style={{ color: APP_COLORS.successGreen }} /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail(record.ioc, record.type);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: APP_COLORS.primary }}
          >
            Details
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
