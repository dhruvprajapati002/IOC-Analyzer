'use client';

import { FileCode, Target } from 'lucide-react';
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
import { CardShell } from '@/app/analyze/components/cards/CardShell';
import { NoDataAvailable } from '@/app/analyze/components/cards/NoDataAvailable';

interface DynamicVTDataProps {
  vtData: any;
  detections: Array<{ category: string }>;
}

type TacticItem = {
  id: string;
  name: string;
  techniques?: Array<{ id: string; name: string; link?: string }>;
  link?: string;
};

function percent(value: number, total: number): number {
  if (!total) return 0;
  return (value / total) * 100;
}

export function DynamicVTData({ vtData, detections }: DynamicVTDataProps) {
  if (!vtData && detections.length === 0) {
    return <NoDataAvailable message="No dynamic VT data available" />;
  }

  const distribution = [
    {
      name: 'Malicious',
      value: detections.filter((d) => d.category === 'malicious').length,
      color: RISK_COLORS.critical.primary,
    },
    {
      name: 'Suspicious',
      value: detections.filter((d) => d.category === 'suspicious').length,
      color: APP_COLORS.warning,
    },
    {
      name: 'Clean',
      value: detections.filter((d) => d.category === 'harmless').length,
      color: APP_COLORS.success,
    },
  ].filter((item) => item.value > 0);

  const total = distribution.reduce((sum, item) => sum + item.value, 0);

  const peInfo = vtData?.pe_info || vtData?.detectiteasy || null;
  const tactics: TacticItem[] = vtData?.mitre_attack?.tactics || [];

  return (
    <div className="space-y-4" style={{ backgroundColor: APP_COLORS.background }}>
      <CardShell
        title="Detection Type Distribution"
        icon={<Target className="h-4 w-4" />}
        iconColor={APP_COLORS.danger}
        collapsible
        defaultOpen
      >
        {distribution.length === 0 ? (
          <NoDataAvailable message="No detection distribution available" small />
        ) : (
          <div className="space-y-3">
            {distribution.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: APP_COLORS.textSecondary }}>{item.name}</span>
                  <span className="font-semibold" style={{ color: APP_COLORS.textPrimary }}>
                    {percent(item.value, total).toFixed(1)}%
                  </span>
                </div>
                <div
                  className="h-1 rounded"
                  style={{ backgroundColor: APP_COLORS.borderSoft }}
                >
                  <div
                    className="h-1 rounded transition-all"
                    style={{
                      width: `${percent(item.value, total)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardShell>

      <CardShell
        title="PE File Structure"
        icon={<FileCode className="h-4 w-4" />}
        iconColor={APP_COLORS.accentBlue}
        collapsible
        defaultOpen={false}
      >
        {peInfo ? (
          <div className="space-y-2 text-sm">
            {peInfo.filetype ? (
              <p style={{ color: APP_COLORS.textSecondary }}>
                File Type: <span style={{ color: APP_COLORS.textPrimary, fontWeight: 600 }}>{peInfo.filetype}</span>
              </p>
            ) : null}
            {Array.isArray(peInfo.values) && peInfo.values.length > 0 ? (
              <div className="space-y-1">
                {peInfo.values.slice(0, 8).map((entry: any, idx: number) => (
                  <p key={idx} style={{ color: APP_COLORS.textSecondary }}>
                    {entry.type}: <span style={{ color: APP_COLORS.textPrimary }}>{entry.name}</span>
                  </p>
                ))}
              </div>
            ) : (
              <NoDataAvailable message="No PE attributes found" small />
            )}
          </div>
        ) : (
          <NoDataAvailable message="No PE structure available" small />
        )}
      </CardShell>

      <CardShell
        title="MITRE ATT&CK Framework"
        icon={<Target className="h-4 w-4" />}
        iconColor={APP_COLORS.danger}
        collapsible
        defaultOpen
      >
        {tactics.length === 0 ? (
          <NoDataAvailable message="No MITRE ATT&CK data available" small />
        ) : (
          <div className="space-y-3">
            <span
              className="inline-flex rounded-full px-2 py-1 text-[11px] font-bold uppercase"
              style={{ backgroundColor: `${APP_COLORS.primary}15`, color: APP_COLORS.primary }}
            >
              Tactics ({tactics.length})
            </span>

            {tactics.map((tactic, index) => (
              <details
                key={`${tactic.id}-${index}`}
                className="rounded-lg border px-3 py-2"
                style={{ borderColor: APP_COLORS.border }}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{ backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.primary }}
                    >
                      {tactic.id}
                    </span>
                    <span className="truncate text-sm font-semibold" style={{ color: APP_COLORS.textPrimary }}>
                      {tactic.name}
                    </span>
                  </div>
                  {tactic.link ? (
                    <a
                      href={tactic.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs"
                      style={{ color: APP_COLORS.primary }}
                    >
                      Link
                    </a>
                  ) : null}
                </summary>

                {Array.isArray(tactic.techniques) && tactic.techniques.length > 0 ? (
                  <div className="mt-2 space-y-1 pl-6 text-sm">
                    {tactic.techniques.map((technique, idx) => (
                      <div key={`${technique.id}-${idx}`} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: APP_COLORS.primary }} />
                        <span
                          className="rounded px-1.5 py-0.5 text-xs"
                          style={{ backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.primary }}
                        >
                          {technique.id}
                        </span>
                        <span style={{ color: APP_COLORS.textSecondary }}>{technique.name}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        )}
      </CardShell>
    </div>
  );
}
