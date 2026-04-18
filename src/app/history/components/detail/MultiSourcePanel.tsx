import { CheckCircle2, Database, XCircle } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import type { IOCDetailData } from './types';

interface MultiSourcePanelProps {
  details: IOCDetailData;
}

export function MultiSourcePanel({ details }: MultiSourcePanelProps) {
  const hasMitre = Boolean((details.mitreAttack as any)?.tactics?.length || (details.mitreAttack as any)?.techniques?.length);
  const hasSandbox = Boolean((details.sandboxAnalysis as any)?.verdicts?.length);
  const hasThreatIntel = Boolean(details.threatIntel?.threatTypes?.length || details.detections?.length);

  const rows = [
    { name: 'Threat Intel', available: hasThreatIntel },
    { name: 'Geolocation', available: Boolean(details.geolocation) },
    { name: 'AbuseIPDB', available: Boolean(details.abuseIPDB) },
    { name: 'MITRE ATT&CK', available: hasMitre },
    { name: 'Sandbox', available: hasSandbox },
    { name: 'File Metadata', available: Boolean(details.fileInfo || details.metadata?.filename) },
  ];

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="mb-3 flex items-center gap-2">
        <Database className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
        <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
          Multi-Source Coverage
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between rounded-xl border px-3 py-2"
            style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}
          >
            <span className="text-sm" style={{ color: APP_COLORS.textSecondary }}>{row.name}</span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
              style={{
                background: row.available ? `${APP_COLORS.success}15` : `${APP_COLORS.textMuted}15`,
                color: row.available ? APP_COLORS.success : APP_COLORS.textMuted,
              }}
            >
              {row.available ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {row.available ? 'Available' : 'Missing'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
