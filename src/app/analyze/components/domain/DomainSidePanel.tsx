'use client';

import { Globe, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/ScrollArea';
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
import { DomainOverviewSection } from '@/app/analyze/components/domain/DomainOverviewSection';
import { DomainWhoisSection } from '@/app/analyze/components/domain/DomainWhoisSection';
import { DomainDNSSection } from '@/app/analyze/components/domain/DomainDNSSection';
import { DomainReputationSection } from '@/app/analyze/components/domain/DomainReputationSection';
import { DomainSubdomainSection } from '@/app/analyze/components/domain/DomainSubdomainSection';
import { formatDateTime } from '@/app/analyze/utils/analyzeFormatters';

interface DomainSidePanelProps {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  domain: string;
  data: any;
  onClose: () => void;
}

export function DomainSidePanel({
  isOpen,
  loading,
  error,
  domain,
  data,
  onClose,
}: DomainSidePanelProps) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close domain panel backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        />
      ) : null}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 420,
          background: APP_COLORS.surface,
          borderLeft: `1px solid ${APP_COLORS.border}`,
          boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
          zIndex: 50,
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        <header className="border-b p-5" style={{ borderColor: APP_COLORS.border }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Globe className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
              <h2 className="truncate text-base font-bold" style={{ color: APP_COLORS.textPrimary }}>
                {domain}
              </h2>
            </div>
            <button type="button" onClick={onClose} style={{ color: APP_COLORS.textMuted }}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-xs uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
            Domain Intelligence
          </p>
        </header>

        <ScrollArea className="h-[calc(100vh-142px)] p-5" variant="thin">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-xl"
                  style={{ background: LOADING_STYLES.skeleton.includes('gradient') ? undefined : APP_COLORS.backgroundSoft }}
                >
                  <div className={LOADING_STYLES.skeleton} style={{ height: '100%', borderRadius: 12 }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border p-4 text-sm" style={{ borderColor: APP_COLORS.danger, color: APP_COLORS.danger }}>
              {error}
            </div>
          ) : (
            <div className="space-y-5">
              <DomainOverviewSection whois={data?.whois} />
              <div style={{ height: 1, backgroundColor: APP_COLORS.border }} />
              <DomainWhoisSection whois={data?.whois} />
              <div style={{ height: 1, backgroundColor: APP_COLORS.border }} />
              <DomainDNSSection dns={data?.dns} />
              <div style={{ height: 1, backgroundColor: APP_COLORS.border }} />

              <section className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
                  SSL Certificate
                </p>
                <div className="space-y-1 text-sm">
                  <p style={{ color: APP_COLORS.textSecondary }}>
                    Issuer: <span style={{ color: APP_COLORS.textPrimary }}>{data?.ssl?.issuer || 'Unknown'}</span>
                  </p>
                  <p style={{ color: APP_COLORS.textSecondary }}>
                    Subject: <span style={{ color: APP_COLORS.textPrimary }}>{data?.ssl?.subject || 'Unknown'}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className="rounded-full border px-2 py-0.5"
                      style={{
                        borderColor: APP_COLORS.border,
                        color: APP_COLORS.textSecondary,
                        backgroundColor: APP_COLORS.backgroundSoft,
                      }}
                    >
                      Valid From: {data?.ssl?.validFrom ? formatDateTime(data.ssl.validFrom) : 'Unknown'}
                    </span>
                    <span
                      className="rounded-full border px-2 py-0.5"
                      style={{
                        borderColor: APP_COLORS.border,
                        color: APP_COLORS.textSecondary,
                        backgroundColor: APP_COLORS.backgroundSoft,
                      }}
                    >
                      Valid To: {data?.ssl?.validTo ? formatDateTime(data.ssl.validTo) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </section>

              <div style={{ height: 1, backgroundColor: APP_COLORS.border }} />
              <DomainReputationSection reputation={data?.reputation} />
              <div style={{ height: 1, backgroundColor: APP_COLORS.border }} />
              <DomainSubdomainSection ssl={data?.ssl} />
            </div>
          )}
        </ScrollArea>

        <footer className="border-t p-4" style={{ borderColor: APP_COLORS.border }}>
          <p className="text-xs" style={{ color: APP_COLORS.textMuted }}>
            Data fetched {data?.fetchedAt ? formatDateTime(data.fetchedAt) : 'Unknown'} · Cached 1h
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.textPrimary }}
          >
            Close
          </button>
        </footer>
      </aside>
    </>
  );
}
