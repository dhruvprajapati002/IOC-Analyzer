'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

interface CardShellProps {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  noPadding?: boolean;
  children: React.ReactNode;
  sectionLabel?: string;
  accentColor?: string;
}

export function CardShell({
  title,
  icon,
  iconColor = APP_COLORS.primary,
  badge,
  meta,
  collapsible = false,
  defaultOpen = true,
  noPadding = false,
  children,
  sectionLabel,
  accentColor,
}: CardShellProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const bodyStyle = useMemo(
    () => ({
      maxHeight: isOpen ? '2000px' : '0px',
      overflow: 'hidden',
      transition: 'max-height 240ms ease',
    }),
    [isOpen]
  );

  return (
    <div className="space-y-3">
      {sectionLabel ? (
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: APP_COLORS.textMuted }}
        >
          {sectionLabel}
        </p>
      ) : null}

      <div
        style={{
          background: APP_COLORS.surface,
          border: `1px solid ${APP_COLORS.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          ...(accentColor ? { borderLeft: `3px solid ${accentColor}` } : {}),
        }}
      >
        <button
          type="button"
          className="w-full"
          onClick={() => {
            if (collapsible) {
              setIsOpen((prev) => !prev);
            }
          }}
          style={{ cursor: collapsible ? 'pointer' : 'default' }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: isOpen ? `1px solid ${APP_COLORS.border}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: APP_COLORS.surface,
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
              >
                {icon}
              </div>
              <h3 className="text-sm font-bold" style={{ color: APP_COLORS.textPrimary }}>
                {title}
              </h3>
              {badge}
            </div>

            <div className="flex items-center gap-3">
              {meta ? (
                <div className="text-xs" style={{ color: APP_COLORS.textMuted }}>
                  {meta}
                </div>
              ) : null}
              {collapsible ? (
                <ChevronDown
                  className="h-4 w-4 transition-transform"
                  style={{
                    color: APP_COLORS.textMuted,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              ) : null}
            </div>
          </div>
        </button>

        <div style={bodyStyle}>
          <div style={{ padding: noPadding ? 0 : '16px 20px' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
