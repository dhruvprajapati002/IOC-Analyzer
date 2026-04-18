import { AlertTriangle, CheckCircle2, Eye, MinusCircle, Shield } from 'lucide-react';
import { APP_COLORS, RISK_COLORS, STATUS_BADGE } from '@/lib/colors';

interface VerdictBannerProps {
  verdict?: string;
  severity?: string;
  riskScore?: number | null;
  riskLevel?: string | null;
  confidence?: number;
  totalDetections: number;
}

function verdictStyle(verdict: string) {
  const value = verdict.toLowerCase();
  if (value === 'malicious') return STATUS_BADGE.malicious;
  if (value === 'suspicious') return STATUS_BADGE.suspicious;
  if (value === 'harmless' || value === 'clean') return STATUS_BADGE.clean;
  return STATUS_BADGE.unknown;
}

function riskColor(score?: number | null) {
  if (!Number.isFinite(Number(score))) return APP_COLORS.textMuted;
  const value = Number(score);
  if (value >= 70) return RISK_COLORS.critical.primary;
  if (value >= 40) return RISK_COLORS.high.primary;
  if (value >= 20) return RISK_COLORS.medium.primary;
  return RISK_COLORS.low.primary;
}

export function VerdictBanner({
  verdict,
  severity,
  riskScore,
  riskLevel,
  confidence,
  totalDetections,
}: VerdictBannerProps) {
  const normalizedVerdict = String(verdict || 'unknown').toLowerCase();
  const score = Number.isFinite(Number(riskScore)) ? Math.max(0, Math.min(100, Number(riskScore))) : null;
  const scoreColor = riskColor(score);

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <Shield className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
          <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
            Verdict Overview
          </h3>
        </div>
        <span className={verdictStyle(normalizedVerdict)}>{normalizedVerdict}</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="text-[11px] uppercase" style={{ color: APP_COLORS.textMuted }}>Severity</p>
          <p className="mt-1 text-sm font-bold uppercase" style={{ color: APP_COLORS.textPrimary }}>{severity || 'unknown'}</p>
        </div>

        <div className="rounded-xl border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="text-[11px] uppercase" style={{ color: APP_COLORS.textMuted }}>Risk Score</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm font-black" style={{ color: scoreColor }}>{score ?? '--'}</p>
            <div className="h-1.5 w-full rounded" style={{ background: APP_COLORS.borderSoft }}>
              <div className="h-1.5 rounded" style={{ width: `${score ?? 0}%`, background: scoreColor }} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="text-[11px] uppercase" style={{ color: APP_COLORS.textMuted }}>Risk Level</p>
          <p className="mt-1 text-sm font-bold uppercase" style={{ color: APP_COLORS.textPrimary }}>{riskLevel || 'unknown'}</p>
        </div>

        <div className="rounded-xl border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <p className="text-[11px] uppercase" style={{ color: APP_COLORS.textMuted }}>Confidence</p>
          <p className="mt-1 text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>
            {Number.isFinite(Number(confidence)) ? `${Math.round(Number(confidence) * 100)}%` : '--'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: APP_COLORS.textSecondary }}>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ background: `${APP_COLORS.danger}15`, color: APP_COLORS.danger }}>
          <AlertTriangle className="h-3.5 w-3.5" />
          High Risk Signals
        </span>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ background: `${APP_COLORS.warning}15`, color: APP_COLORS.warningDark }}>
          <Eye className="h-3.5 w-3.5" />
          {totalDetections} Detections
        </span>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ background: `${APP_COLORS.success}15`, color: APP_COLORS.success }}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Clean/Harmless Signals
        </span>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ background: APP_COLORS.backgroundSoft }}>
          <MinusCircle className="h-3.5 w-3.5" />
          Unknowns Included
        </span>
      </div>
    </section>
  );
}
