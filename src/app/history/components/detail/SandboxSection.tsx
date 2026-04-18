import { FlaskConical, TriangleAlert } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';

interface SandboxSectionProps {
  sandboxAnalysis?: Record<string, any> | null;
}

function verdictColor(verdict: string) {
  const value = String(verdict || '').toLowerCase();
  if (value === 'malicious') return APP_COLORS.danger;
  if (value === 'suspicious') return APP_COLORS.warningDark;
  if (value === 'clean' || value === 'undetected') return APP_COLORS.success;
  return APP_COLORS.textMuted;
}

export function SandboxSection({ sandboxAnalysis }: SandboxSectionProps) {
  const verdicts = Array.isArray(sandboxAnalysis?.verdicts) ? sandboxAnalysis?.verdicts : [];
  const summary = sandboxAnalysis?.summary || null;

  if (!verdicts.length && !summary) return null;

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="mb-3 flex items-center gap-2">
        <FlaskConical className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
        <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
          Sandbox Analysis
        </h3>
      </div>

      {summary ? (
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: 'Total', value: summary.total ?? verdicts.length, color: APP_COLORS.accentBlue },
            { label: 'Malicious', value: summary.malicious ?? 0, color: APP_COLORS.danger },
            { label: 'Suspicious', value: summary.suspicious ?? 0, color: APP_COLORS.warningDark },
            { label: 'Clean', value: summary.clean ?? 0, color: APP_COLORS.success },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
              <p className="text-[11px] uppercase" style={{ color: APP_COLORS.textMuted }}>{item.label}</p>
              <p className="mt-1 text-lg font-black" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {verdicts.length ? (
        <div className="space-y-2">
          {verdicts.slice(0, 10).map((item: any, index: number) => {
            const color = verdictColor(item.verdict);
            return (
              <div key={`${item.sandbox || 'sandbox'}-${index}`} className="rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
                    {item.sandbox_name || item.sandbox || `Sandbox #${index + 1}`}
                  </p>
                  <span className="rounded-full px-2 py-1 text-xs font-bold uppercase" style={{ background: `${color}15`, color }}>
                    {item.verdict || 'unknown'}
                  </span>
                </div>

                {Array.isArray(item.malware_classification) && item.malware_classification.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.malware_classification.slice(0, 6).map((tag: string) => (
                      <span key={tag} className="rounded-full px-2 py-0.5 text-xs" style={{ background: APP_COLORS.surface, color: APP_COLORS.textSecondary }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border p-3 text-sm" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft, color: APP_COLORS.textMuted }}>
          <div className="inline-flex items-center gap-2">
            <TriangleAlert className="h-4 w-4" />
            Sandbox summary available without verdict rows.
          </div>
        </div>
      )}
    </section>
  );
}
