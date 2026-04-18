'use client';

import { useState } from 'react';
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

interface DomainDNSSectionProps {
  dns?: {
    a?: string[];
    aaaa?: string[];
    mx?: Array<{ exchange: string; priority?: number }>;
    ns?: string[];
    txt?: string[];
  };
}

function RecordRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border px-2.5 py-2" style={{ borderColor: APP_COLORS.border }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
        {label}
      </p>
      {children}
    </div>
  );
}

export function DomainDNSSection({ dns }: DomainDNSSectionProps) {
  const [showAllTxt, setShowAllTxt] = useState(false);
  const txtValues = dns?.txt || [];

  return (
    <section className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: APP_COLORS.textMuted }}>
        DNS Records
      </p>

      <div className="space-y-2 text-xs">
        <RecordRow label="A Records">
          <div className="flex flex-wrap gap-1.5">
            {(dns?.a || []).map((value) => (
              <code
                key={value}
                className="rounded px-1.5 py-0.5"
                style={{ backgroundColor: APP_COLORS.backgroundSoft, color: APP_COLORS.textPrimary }}
              >
                {value}
              </code>
            ))}
          </div>
        </RecordRow>

        <RecordRow label="AAAA Records">
          <div className="space-y-1">
            {(dns?.aaaa || []).map((value) => (
              <code key={value} style={{ color: APP_COLORS.textSecondary }}>
                {value}
              </code>
            ))}
          </div>
        </RecordRow>

        <RecordRow label="MX Records">
          <div className="space-y-1">
            {(dns?.mx || []).map((value, index) => (
              <p key={`${value.exchange}-${index}`} style={{ color: APP_COLORS.textSecondary }}>
                {value.priority ?? '-'} · {value.exchange}
              </p>
            ))}
          </div>
        </RecordRow>

        <RecordRow label="NS Records">
          <div className="flex flex-wrap gap-1.5">
            {(dns?.ns || []).map((value) => (
              <span key={value} style={{ color: APP_COLORS.textSecondary }}>
                {value}
              </span>
            ))}
          </div>
        </RecordRow>

        <RecordRow label="TXT Records">
          <div className="space-y-1">
            {(showAllTxt ? txtValues : txtValues.slice(0, 3)).map((value, index) => (
              <p key={index} className="break-all" style={{ color: APP_COLORS.textSecondary }}>
                {value}
              </p>
            ))}
            {txtValues.length > 3 ? (
              <button
                type="button"
                onClick={() => setShowAllTxt((prev) => !prev)}
                className="text-xs"
                style={{ color: APP_COLORS.primary }}
              >
                {showAllTxt ? 'Show less' : 'Expand TXT records'}
              </button>
            ) : null}
          </div>
        </RecordRow>
      </div>
    </section>
  );
}
