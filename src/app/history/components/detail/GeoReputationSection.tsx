import { Globe2, ShieldAlert } from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';

interface GeoReputationSectionProps {
  geolocation?: Record<string, any> | null;
  abuseIPDB?: Record<string, any> | null;
}

function metric(label: string, value: string | number | null | undefined) {
  return (
    <div key={label} className="rounded-xl border px-3 py-2" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
      <p className="text-[11px] uppercase" style={{ color: APP_COLORS.textMuted }}>{label}</p>
      <p className="mt-1 text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>{value ?? 'N/A'}</p>
    </div>
  );
}

export function GeoReputationSection({ geolocation, abuseIPDB }: GeoReputationSectionProps) {
  if (!geolocation && !abuseIPDB) return null;

  const abuseScore = Number(abuseIPDB?.abuseConfidenceScore ?? 0);
  const abuseColor = abuseScore >= 75 ? APP_COLORS.danger : abuseScore >= 40 ? APP_COLORS.warningDark : APP_COLORS.success;

  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2">
          <Globe2 className="h-5 w-5" style={{ color: APP_COLORS.primary }} />
          <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: APP_COLORS.textPrimary }}>
            Geo & Reputation
          </h3>
        </div>
        {abuseIPDB ? (
          <span className="rounded-full px-2 py-1 text-xs font-black" style={{ background: `${abuseColor}20`, color: abuseColor }}>
            Abuse Score {abuseScore}%
          </span>
        ) : null}
      </div>

      {geolocation ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {metric('Country', geolocation.countryName || geolocation.country || geolocation.countryCode)}
          {metric('Region', geolocation.region)}
          {metric('City', geolocation.city)}
          {metric('ISP', geolocation.isp)}
          {metric('ASN', geolocation.asn)}
          {metric('Timezone', geolocation.timezone)}
        </div>
      ) : null}

      {abuseIPDB ? (
        <div className="mt-3 rounded-xl border p-3" style={{ borderColor: APP_COLORS.border, background: APP_COLORS.backgroundSoft }}>
          <div className="mb-2 inline-flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" style={{ color: abuseColor }} />
            <h4 className="text-xs font-black uppercase" style={{ color: APP_COLORS.textSecondary }}>
              AbuseIPDB Snapshot
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {metric('Reports', abuseIPDB.totalReports ?? 0)}
            {metric('Usage Type', abuseIPDB.usageType || 'Unknown')}
            {metric('Whitelisted', abuseIPDB.isWhitelisted ? 'Yes' : 'No')}
          </div>
        </div>
      ) : null}
    </section>
  );
}
