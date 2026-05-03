'use client';

import { useEffect, useState } from 'react';
import {
  Globe2,
  Loader2,
  Calendar,
  Server,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';

interface WhoisData {
  registrar?: string;
  registrant?: string;
  createdDate?: string;
  expiresDate?: string;
  updatedDate?: string;
  nameservers?: string[];
  status?: string[];
}

interface DnsData {
  a?: string[];
  aaaa?: string[];
  mx?: Array<{ exchange: string; priority: number }>;
  ns?: string[];
  txt?: string[];
}

interface SslData {
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  issuerOrg?: string;
}

interface ReputationData {
  vtScore?: number;
  verdictFromMain?: string;
  threatTypes?: string[];
}

interface DomainIntelData {
  whois?: WhoisData;
  dns?: DnsData;
  ssl?: SslData;
  reputation?: ReputationData;
  fetchedAt?: string;
  errors?: Record<string, string>;
}

interface DomainIntelSectionProps {
  domain: string;
}

function formatDate(isoString?: string): string {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-2 py-1.5 border-b last:border-b-0"
      style={{ borderColor: APP_COLORS.borderSoft }}>
      <span className="text-xs font-semibold uppercase tracking-wide w-32 shrink-0"
        style={{ color: APP_COLORS.textMuted }}>
        {label}
      </span>
      <span className="text-sm flex-1 break-all" style={{ color: APP_COLORS.textPrimary }}>
        {value ?? 'N/A'}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: APP_COLORS.primary }} />
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: APP_COLORS.textSecondary }}>
            {title}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" style={{ color: APP_COLORS.textMuted }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: APP_COLORS.textMuted }} />
        )}
      </button>
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: APP_COLORS.borderSoft }}>
          {children}
        </div>
      )}
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <span className="text-sm" style={{ color: APP_COLORS.textMuted }}>N/A</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className="rounded-md px-2 py-0.5 text-xs font-mono"
          style={{ background: `${APP_COLORS.primary}14`, color: APP_COLORS.primary }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function DomainIntelSection({ domain }: DomainIntelSectionProps) {
  const [data, setData] = useState<DomainIntelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) return;

    const isDomain = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);
    if (!isDomain) return;

    setLoading(true);
    setError(null);

    fetch(`/api/domain-intel?domain=${encodeURIComponent(domain.toLowerCase())}`)
      .then(async (res) => {
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to fetch domain intelligence');
        setData(json.data as DomainIntelData);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to fetch domain intelligence';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [domain]);

  if (loading) {
    return (
      <section className="rounded-2xl border p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
        <div className="flex items-center gap-3">
          <Globe2 className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
          <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
            Domain Intelligence
          </h3>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" style={{ color: APP_COLORS.textMuted }} />
        </div>
        <p className="mt-3 text-xs" style={{ color: APP_COLORS.textMuted }}>
          Fetching WHOIS, DNS, and reputation data…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
        <div className="flex items-center gap-3 mb-2">
          <Globe2 className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
          <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
            Domain Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{ borderColor: `${APP_COLORS.warning}40`, background: `${APP_COLORS.warning}10` }}>
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: APP_COLORS.warningDark }} />
          <p className="text-xs" style={{ color: APP_COLORS.warningDark }}>{error}</p>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const whois = data.whois;
  const dns = data.dns;
  const ssl = data.ssl;
  const reputation = data.reputation;

  const reputationColor =
    (reputation?.vtScore ?? 0) >= 70
      ? APP_COLORS.danger
      : (reputation?.vtScore ?? 0) >= 30
      ? APP_COLORS.warningDark
      : APP_COLORS.success;

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2">
          <Globe2 className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
          <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
            Domain Intelligence
          </h3>
        </div>
        {reputation?.verdictFromMain && reputation.verdictFromMain !== 'unknown' && (
          <span
            className="rounded-full px-2 py-1 text-xs font-black uppercase"
            style={{
              background: `${reputationColor}20`,
              color: reputationColor,
            }}
          >
            {reputation.verdictFromMain}
          </span>
        )}
        {(reputation?.vtScore ?? 0) > 0 && (
          <span className="text-xs" style={{ color: APP_COLORS.textMuted }}>
            Risk Score: <span className="font-bold" style={{ color: reputationColor }}>{reputation?.vtScore}</span>
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* WHOIS */}
        <SectionCard title="WHOIS Information" icon={Calendar} defaultExpanded>
          <div className="space-y-0.5">
            <InfoRow label="Registrar" value={whois?.registrar || 'N/A'} />
            <InfoRow label="Registrant" value={whois?.registrant || 'N/A'} />
            <InfoRow label="Created" value={formatDate(whois?.createdDate)} />
            <InfoRow label="Expires" value={formatDate(whois?.expiresDate)} />
            <InfoRow label="Updated" value={formatDate(whois?.updatedDate)} />
            {whois?.status && whois.status.length > 0 && (
              <InfoRow
                label="Status"
                value={<TagList items={whois.status.map((s) => s.split(' ')[0])} />}
              />
            )}
          </div>
        </SectionCard>

        {/* DNS Records */}
        <SectionCard title="DNS Records" icon={Server}>
          <div className="space-y-3">
            {dns?.a && dns.a.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: APP_COLORS.textMuted }}>
                  A Records (IPv4)
                </p>
                <TagList items={dns.a} />
              </div>
            )}
            {dns?.aaaa && dns.aaaa.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: APP_COLORS.textMuted }}>
                  AAAA Records (IPv6)
                </p>
                <TagList items={dns.aaaa} />
              </div>
            )}
            {dns?.mx && dns.mx.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: APP_COLORS.textMuted }}>
                  MX Records
                </p>
                <div className="space-y-1">
                  {dns.mx.map((mx, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: APP_COLORS.borderSoft, color: APP_COLORS.textMuted }}>
                        {mx.priority}
                      </span>
                      <span className="text-xs font-mono" style={{ color: APP_COLORS.textPrimary }}>{mx.exchange}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dns?.ns && dns.ns.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: APP_COLORS.textMuted }}>
                  NS Records
                </p>
                <TagList items={dns.ns} />
              </div>
            )}
            {dns?.txt && dns.txt.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: APP_COLORS.textMuted }}>
                  TXT Records
                </p>
                <div className="space-y-1">
                  {dns.txt.map((txt, i) => (
                    <div key={i} className="rounded px-2 py-1 text-xs font-mono break-all"
                      style={{ background: APP_COLORS.backgroundSoft, color: APP_COLORS.textSecondary }}>
                      {txt}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!dns?.a?.length && !dns?.aaaa?.length && !dns?.mx?.length && !dns?.ns?.length && !dns?.txt?.length) && (
              <p className="text-sm" style={{ color: APP_COLORS.textMuted }}>No DNS records resolved.</p>
            )}
          </div>
        </SectionCard>

        {/* Reputation */}
        {reputation && (
          <SectionCard title="Threat Categorization" icon={Shield}>
            <div className="space-y-2">
              <InfoRow
                label="Verdict"
                value={
                  <span className="font-bold" style={{ color: reputationColor }}>
                    {reputation.verdictFromMain || 'N/A'}
                  </span>
                }
              />
              <InfoRow
                label="Risk Score"
                value={
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded" style={{ background: APP_COLORS.borderSoft }}>
                      <div
                        className="h-1.5 rounded"
                        style={{
                          width: `${Math.min(100, reputation.vtScore ?? 0)}%`,
                          background: reputationColor,
                        }}
                      />
                    </div>
                    <span className="font-bold text-sm" style={{ color: reputationColor }}>
                      {reputation.vtScore ?? 0}
                    </span>
                  </div>
                }
              />
              {reputation.threatTypes && reputation.threatTypes.length > 0 && (
                <div className="pt-1">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider" style={{ color: APP_COLORS.textMuted }}>
                    Associated Threat Types
                  </p>
                  <TagList items={reputation.threatTypes} />
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* SSL / Certificate */}
        {ssl && (ssl.issuer || ssl.subject) && (
          <SectionCard title="SSL Certificate" icon={Shield} defaultExpanded={false}>
            <div className="space-y-0.5">
              <InfoRow label="Subject" value={ssl.subject || 'N/A'} />
              <InfoRow label="Issuer" value={ssl.issuerOrg || ssl.issuer || 'N/A'} />
              <InfoRow label="Valid From" value={formatDate(ssl.validFrom)} />
              <InfoRow label="Valid To" value={formatDate(ssl.validTo)} />
            </div>
          </SectionCard>
        )}

        {/* Error notices */}
        {data.errors && Object.keys(data.errors).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.errors).map(([key, msg]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
                style={{ background: `${APP_COLORS.warning}12`, color: APP_COLORS.warningDark }}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>{key}: {msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
