'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { APP_COLORS } from '@/lib/colors';

export interface VigilanceLogoProps {
  variant?: 'full' | 'icon' | 'wordmark' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'auto';
  showTagline?: boolean;
  href?: string;
  className?: string;
}

const ICON_SRC = '/vigilanceX-logo.png';

const SIZE_MAP = {
  xs: { iconSize: 20, textSize: '13px', taglineSize: '8px', gap: 6 },
  sm: { iconSize: 28, textSize: '16px', taglineSize: '9px', gap: 8 },
  md: { iconSize: 36, textSize: '20px', taglineSize: '10px', gap: 10 },
  lg: { iconSize: 48, textSize: '26px', taglineSize: '11px', gap: 12 },
  xl: { iconSize: 64, textSize: '34px', taglineSize: '13px', gap: 16 },
} as const;

function getThemeVars(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    return {
      text: '#ffffff',
      tagline: 'rgba(255,255,255,0.5)',
      iconShadow: 'drop-shadow(0 0 8px rgba(201,100,66,0.3))',
    };
  }

  return {
    text: APP_COLORS.textPrimary,
    tagline: APP_COLORS.textMuted,
    iconShadow: 'none',
  };
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

function renderBrandText(textColor: string, size: string) {
  return (
    <span style={{ fontSize: size, fontWeight: 900, lineHeight: 1 }}>
      <span style={{ color: textColor }}>Vigilance</span>
      <span style={{ color: APP_COLORS.primary }}>X</span>
    </span>
  );
}

export default function VigilanceLogo({
  variant = 'full',
  size = 'md',
  theme = 'light',
  showTagline = true,
  href,
  className,
}: VigilanceLogoProps) {
  const sizeConfig = SIZE_MAP[size];
  const isCompact = variant === 'compact';
  const showTaglineResolved = (variant === 'full' || variant === 'wordmark') && showTagline;
  const gap = isCompact ? Math.max(4, sizeConfig.gap - 4) : sizeConfig.gap;
  const iconRadius = size === 'xs' || size === 'sm' ? 6 : 8;

  const themeVars = theme === 'auto' ? getThemeVars('light') : getThemeVars(theme);

  const wrapperStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap,
    userSelect: 'none',
    flexShrink: 0,
    textDecoration: 'none',
  };

  const textColor = theme === 'auto' ? 'var(--vx-text)' : themeVars.text;
  const taglineColor = theme === 'auto' ? 'var(--vx-tagline)' : themeVars.tagline;
  const iconShadow = theme === 'auto' ? 'var(--vx-icon-shadow)' : themeVars.iconShadow;

  const iconElement = (
    <Image
      src={ICON_SRC}
      alt="VigilanceX"
      width={sizeConfig.iconSize}
      height={sizeConfig.iconSize}
      priority={true}
      style={{ borderRadius: iconRadius, filter: iconShadow }}
    />
  );

  const textBlock = isCompact ? (
    renderBrandText(textColor, sizeConfig.textSize)
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {renderBrandText(textColor, sizeConfig.textSize)}
      {showTaglineResolved ? (
        <span
          style={{
            color: taglineColor,
            fontSize: sizeConfig.taglineSize,
            letterSpacing: '0.12em',
            fontWeight: 500,
          }}
        >
          CYBER THREAT INTELLIGENCE
        </span>
      ) : null}
    </div>
  );

  const content = (
    <>
      {variant !== 'wordmark' ? iconElement : null}
      {variant !== 'icon' ? textBlock : null}
    </>
  );

  const wrapperClassName = classNames(
    href ? 'vx-logo-link' : undefined,
    theme === 'auto' ? 'vx-logo-auto' : undefined,
    className
  );

  const wrapperStyleVars = (theme === 'auto'
    ? {
        '--vx-text': APP_COLORS.textPrimary,
        '--vx-tagline': APP_COLORS.textMuted,
        '--vx-icon-shadow': 'none',
      }
    : {
        '--vx-text': themeVars.text,
        '--vx-tagline': themeVars.tagline,
        '--vx-icon-shadow': themeVars.iconShadow,
      }) as CSSProperties;

  const combinedStyle: CSSProperties = {
    ...wrapperStyleVars,
    ...wrapperStyle,
  };

  const autoStyles = theme === 'auto' ? (
    <style jsx>{`
      @media (prefers-color-scheme: dark) {
        .vx-logo-auto {
          --vx-text: #ffffff;
          --vx-tagline: rgba(255, 255, 255, 0.5);
          --vx-icon-shadow: drop-shadow(0 0 8px rgba(201, 100, 66, 0.3));
        }
      }
      .vx-logo-link {
        transition: opacity 0.2s ease;
      }
      .vx-logo-link:hover {
        opacity: 0.85;
      }
    `}</style>
  ) : (
    <style jsx>{`
      .vx-logo-link {
        transition: opacity 0.2s ease;
      }
      .vx-logo-link:hover {
        opacity: 0.85;
      }
    `}</style>
  );

  if (href) {
    return (
      <>
        <Link href={href} className={wrapperClassName} style={combinedStyle}>
          {content}
        </Link>
        {autoStyles}
      </>
    );
  }

  return (
    <>
      <div className={wrapperClassName} style={combinedStyle}>
        {content}
      </div>
      {autoStyles}
    </>
  );
}

export const LogoFull = (props: VigilanceLogoProps) => (
  <VigilanceLogo variant="full" size="md" {...props} />
);

export const LogoIcon = (props: VigilanceLogoProps) => (
  <VigilanceLogo variant="icon" size="sm" {...props} />
);

export const LogoCompact = (props: VigilanceLogoProps) => (
  <VigilanceLogo variant="compact" size="sm" {...props} />
);
