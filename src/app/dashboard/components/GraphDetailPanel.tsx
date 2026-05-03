'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Shield,
  TrendingUp,
  Globe,
  Link2,
  Hash,
  Server,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_COLORS, RISK_COLORS } from '@/lib/colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';

export interface GraphDetailIOC {
  id: string;
  ioc_value: string;
  ioc_type: string;
  verdict: string;
  threat_label: string;
  last_seen: string;
  risk_score: number;
  severity: string;
  source?: string | null;
}

interface GraphDetailPanelProps {
  isOpen: boolean;
  graphType: string | null;
  graphLabel: string | null;
  timeRange?: string;
  onClose: () => void;
}

function typeIcon(type: string) {
  if (type === 'ip') return <Server className="h-3.5 w-3.5" />;
  if (type === 'domain') return <Globe className="h-3.5 w-3.5" />;
  if (type === 'url') return <Link2 className="h-3.5 w-3.5" />;
  if (type === 'hash') return <Hash className="h-3.5 w-3.5" />;
  return <Shield className="h-3.5 w-3.5" />;
}

function verdictColor(verdict: string): string {
  if (verdict === 'malicious') return RISK_COLORS.critical.primary;
  if (verdict === 'suspicious') return APP_COLORS.warning;
  if (verdict === 'harmless' || verdict === 'clean') return APP_COLORS.success;
  return APP_COLORS.textMuted;
}

function riskColor(score: number): string {
  if (score >= 70) return RISK_COLORS.critical.primary;
  if (score >= 40) return APP_COLORS.warningDark;
  return APP_COLORS.success;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(value: string, max = 42): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function GraphDetailPanel({
  isOpen,
  graphType,
  graphLabel,
  timeRange = 'all',
  onClose,
}: GraphDetailPanelProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [iocs, setIocs] = useState<GraphDetailIOC[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch IOCs when panel opens
  useEffect(() => {
    if (!isOpen || !graphType || !token) return;

    setLoading(true);
    setError(null);
    setIocs([]);

    apiFetch(
      `/api/dashboard/graph-detail?type=${encodeURIComponent(graphType)}&range=${encodeURIComponent(timeRange)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(async (res) => {
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to load IOCs');
        setIocs(json.iocs as GraphDetailIOC[]);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load IOCs');
      })
      .finally(() => setLoading(false));
  }, [isOpen, graphType, timeRange, token]);

  const navigateToIOC = (ioc: GraphDetailIOC) => {
    const params = new URLSearchParams({
      ioc: ioc.ioc_value,
      iocType: ioc.ioc_type,
    });
    router.push(`/history?${params.toString()}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.35)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`IOC detail for ${graphLabel ?? graphType}`}
        className={`fixed z-50 flex flex-col shadow-2xl transition-transform duration-300
          bottom-0 left-0 right-0 h-[60vh] rounded-t-xl border-t
          lg:top-0 lg:bottom-auto lg:left-auto lg:right-0 lg:h-full lg:w-[420px] lg:rounded-none lg:border-t-0 lg:border-l
          ${isOpen ? 'translate-y-0 lg:translate-x-0 lg:translate-y-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full'}
        `}
        style={{
          background: APP_COLORS.surface,
          borderColor: APP_COLORS.border,
        }}
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="flex w-full items-center justify-center pt-3 pb-1 lg:hidden">
          <div className="h-1.5 w-12 rounded-full" style={{ background: APP_COLORS.border }} />
        </div>
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3 lg:py-4"
          style={{ borderColor: APP_COLORS.border }}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 shrink-0" style={{ color: APP_COLORS.primary }} />
              <span className="truncate text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
                {graphLabel ?? graphType ?? 'IOC Details'}
              </span>
            </div>
            {!loading && !error && iocs.length > 0 && (
              <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>
                {iocs.length} indicator{iocs.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: APP_COLORS.textMuted }}
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: APP_COLORS.primary }} />
              <p className="text-sm" style={{ color: APP_COLORS.textMuted }}>
                Loading IOCs…
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              className="flex items-start gap-3 rounded-xl border p-4"
              style={{
                borderColor: `${APP_COLORS.warning}40`,
                background: `${APP_COLORS.warning}0F`,
              }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: APP_COLORS.warningDark }} />
              <p className="text-sm" style={{ color: APP_COLORS.warningDark }}>
                {error}
              </p>
            </div>
          )}

          {!loading && !error && iocs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Shield className="h-10 w-10" style={{ color: APP_COLORS.borderSoft }} />
              <p className="text-sm font-semibold" style={{ color: APP_COLORS.textMuted }}>
                No IOCs found
              </p>
              <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
                No data available for this graph segment.
              </p>
            </div>
          )}

          {!loading && !error && iocs.length > 0 && (
            <div className="space-y-2">
              {iocs.map((ioc) => (
                <button
                  key={ioc.id}
                  type="button"
                  onClick={() => navigateToIOC(ioc)}
                  className="group w-full rounded-xl border px-3 py-3 text-left transition-all min-h-[48px] flex flex-col justify-center"
                  style={{
                    borderColor: APP_COLORS.border,
                    background: APP_COLORS.backgroundSoft,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${APP_COLORS.primary}66`;
                    (e.currentTarget as HTMLButtonElement).style.background = `${APP_COLORS.primary}08`;
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = APP_COLORS.border;
                    (e.currentTarget as HTMLButtonElement).style.background = APP_COLORS.backgroundSoft;
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* Top row: type badge + IOC value + navigate arrow */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                        style={{
                          background: `${APP_COLORS.primary}18`,
                          color: APP_COLORS.primary,
                        }}
                      >
                        {typeIcon(ioc.ioc_type)}
                        {ioc.ioc_type}
                      </span>
                      <span
                        className="truncate font-mono text-xs font-semibold"
                        style={{ color: APP_COLORS.textPrimary }}
                        title={ioc.ioc_value}
                      >
                        {truncate(ioc.ioc_value, 32)}
                      </span>
                    </div>
                    <ChevronRight
                      className="mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: APP_COLORS.primary }}
                    />
                  </div>

                  {/* Verdict + risk score */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                      style={{
                        background: `${verdictColor(ioc.verdict)}18`,
                        color: verdictColor(ioc.verdict),
                      }}
                    >
                      {ioc.verdict}
                    </span>

                    {/* Risk score mini-bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-14 overflow-hidden rounded" style={{ background: APP_COLORS.borderSoft }}>
                        <div
                          className="h-1 rounded"
                          style={{
                            width: `${Math.min(100, ioc.risk_score)}%`,
                            background: riskColor(ioc.risk_score),
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: riskColor(ioc.risk_score) }}>
                        {ioc.risk_score}
                      </span>
                    </div>

                    {/* Threat label */}
                    {ioc.threat_label && ioc.threat_label !== ioc.verdict && (
                      <span
                        className="truncate rounded px-1.5 py-0.5 text-[10px]"
                        style={{ background: APP_COLORS.backgroundSoft, color: APP_COLORS.textMuted }}
                        title={ioc.threat_label}
                      >
                        {truncate(ioc.threat_label, 24)}
                      </span>
                    )}

                    {/* Last seen */}
                    <span className="ml-auto text-[10px]" style={{ color: APP_COLORS.textMuted }}>
                      {formatRelativeTime(ioc.last_seen)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex shrink-0 items-center gap-2 border-t px-5 py-3"
          style={{ borderColor: APP_COLORS.border }}
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: APP_COLORS.textMuted }} />
          <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
            Click an IOC to open its full detail in the History view.
          </p>
        </div>
      </div>
    </>
  );
}
