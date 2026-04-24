// ============================================================
// src/lib/colors.ts
// Single source of truth for the application's theme.
// ============================================================


export const sidebarColors = {
  background:       '#faf9f5',
  backgroundSoft:   '#f5f4ee',
  surface:          '#ffffff',
  surfaceElevated:  '#f5f4ee',
  surfaceMuted:     '#ede9de',
  surfaceTint:      '#e9e6dc',
  surfaceMutedDeep: '#e5e2d8',
  surfaceTintDark:  '#ded8c4',
  backgroundDeep:   '#f5f4ee',
  border:           '#dad9d4',
  borderSoft:       'rgba(180,178,167,0.2)',
  borderSubtle:     'rgba(180,178,167,0.15)',
  borderStrong:     'rgba(201,100,66,0.45)',
  borderAccent:     'rgba(201,100,66,0.25)',
  textPrimary:      '#3d3929',
  textSecondary:    '#535146',
  textMuted:        '#83827d',
  textInverse:      '#ffffff',
  textAccent:       '#c96442',
  textDim:          '#b4b2a7',
  textDisabled:     '#cfcbbf',
  textLighter:      '#6b6653',
  textOffWhite:     '#ffffff',
  textTertiary:     '#6b6653',
  primaryFrom:      '#c96442',
  primaryTo:        '#d97757',
  primary:          '#c96442',
  accent:           '#d97757',
  primaryMuted:     '#e9a38b',
  danger:           '#ef4444',
  dangerDark:       '#dc2626',
  dangerHover:      '#b91c1c',
  dangerSoft:       '#fecaca',
  dangerLight:      '#f87171',
  dangerDark2:      '#991b1b',
  dangerDarker:     '#7f1d1d',
  success:          '#22c55e',
  successSoft:      '#4ade80',
  successGreen:     '#16a34a',
  warning:          '#f59e0b',
  warningLight:     '#fbbf24',
  warningDark:      '#d97706',
  warningSoft:      '#fde68a',
  warningOrange:    '#ea580c',
  info:             '#c96442',
  infoSoft:         '#d97757',
  neutral:          '#6b7280',
  errorcolor:       '#ef4444',
  sucesscolor:      '#22c55e',
  loginBgFrom:      '#faf9f5',
  loginBgTo:        '#e9e6dc',
  accentPurple:     '#9c87f5',
  accentCyan:       '#38bdf8',
  accentIndigo:     '#6366f1',
  accentPink:       '#ec4899',
  accentBlue:       '#3b82f6',
  accentTeal:       '#14b8a6',
  accentViolet:     '#8b5cf6',
  accentOrange:     '#ea580c',
  accentYellow:     '#eab308',
  orangeDark700:    '#c2410c',
  orangeDark800:    '#9a3412',
  orangeDark900:    '#7c2d12',
  amberDark900:     '#78350f',
  orangeDark950:    '#451a03',
  stoneDark800:     '#e9e6dc',
  stoneDark900:     '#ded8c4',
  hoverBackground:   '#f5f4ee',
  hoverBorder:       '#dad9d4',
  hoverShadow:       'rgba(0,0,0,0.08)',
  hoverShadowSpread: '0 0 10px',
  hoverText:         '#c96442',
  activeBackground:  '#ede9de',
  activeBorder:      '#c96442',
  activeShadow:      'rgba(201,100,66,0.2)',
  activeText:        '#c96442',
  buttonBackground:  '#ffffff',
  buttonIconColor:   '#3d3929',
  primaryGradient:   'from-orange-500 to-orange-400',
  primaryShadow:     'shadow-orange-500/40',
};

export const APP_COLORS = {
  background:       sidebarColors.background,
  backgroundSoft:   sidebarColors.backgroundSoft,
  surface:          sidebarColors.surface,
  surfaceSoft:      sidebarColors.surfaceElevated,
  surfaceAlt:       sidebarColors.surfaceElevated,
  surfaceMuted:     sidebarColors.surfaceMuted,
  surfaceTint:      sidebarColors.surfaceTint,
  border:           sidebarColors.border,
  borderSoft:       sidebarColors.borderSoft,
  borderStrong:     sidebarColors.borderStrong,
  primary:          sidebarColors.primary,
  primaryHover:     sidebarColors.accent,
  primarySoft:      sidebarColors.accent,
  primaryDark:      sidebarColors.primary,
  accentPurple:     sidebarColors.accentPurple,
  accentCyan:       sidebarColors.accentCyan,
  accentIndigo:     sidebarColors.accentIndigo,
  accentPink:       sidebarColors.accentPink,
  accentBlue:       sidebarColors.accentBlue,
  accentTeal:       sidebarColors.accentTeal,
  accentViolet:     sidebarColors.accentViolet,
  accentOrange:     sidebarColors.accentOrange,
  accentYellow:     sidebarColors.accentYellow,
  success:          sidebarColors.success,
  successSoft:      sidebarColors.successSoft,
  warning:          sidebarColors.warning,
  warningLight:     sidebarColors.warningLight,
  warningDark:      sidebarColors.warningDark,
  warningSoft:      sidebarColors.warningSoft,
  danger:           sidebarColors.danger,
  dangerDark:       sidebarColors.dangerDark,
  dangerHover:      sidebarColors.dangerHover,
  dangerSoft:       sidebarColors.dangerSoft,
  info:             sidebarColors.info,
  infoSoft:         sidebarColors.infoSoft,
  neutral:          sidebarColors.neutral,
  textPrimary:      sidebarColors.textPrimary,
  textSecondary:    sidebarColors.textSecondary,
  textMuted:        sidebarColors.textMuted,
  textDim:          sidebarColors.textDim,
  textDisabled:     sidebarColors.textDisabled,
  textLighter:      sidebarColors.textLighter,
  textOffWhite:     sidebarColors.textOffWhite,
  textTertiary:     sidebarColors.textTertiary,
  error:            sidebarColors.errorcolor,
  cardBackground:   sidebarColors.backgroundSoft,
  backgroundDeep:   sidebarColors.backgroundDeep,
  surfaceMutedDeep: sidebarColors.surfaceMutedDeep,
  surfaceTintDark:  sidebarColors.surfaceTintDark,
  borderHover:      sidebarColors.hoverBorder,
  primaryMuted:     sidebarColors.primaryMuted,
  dangerLight:      sidebarColors.dangerLight,
  successGreen:     sidebarColors.successGreen,
  loginBgFrom:      sidebarColors.loginBgFrom,
  loginBgTo:        sidebarColors.loginBgTo,
  dangerDark2:      sidebarColors.dangerDark2,
  dangerDarker:     sidebarColors.dangerDarker,
  warningOrange:    sidebarColors.warningOrange,
  accentBlueDark:   sidebarColors.accentBlue,
  accentIndigoDark: sidebarColors.accentIndigo,
  accentVioletDark: sidebarColors.accentViolet,
  accentPurple600:  sidebarColors.accentPurple,
  orangeDark700:    sidebarColors.orangeDark700,
  orangeDark800:    sidebarColors.orangeDark800,
  orangeDark900:    sidebarColors.orangeDark900,
  amberDark900:     sidebarColors.amberDark900,
  orangeDark950:    sidebarColors.orangeDark950,
  stoneDark800:     sidebarColors.stoneDark800,
  stoneDark900:     sidebarColors.stoneDark900,
};

export const CHART_COLORS = {
  malicious:  sidebarColors.danger,
  suspicious: sidebarColors.warning,
  clean:      sidebarColors.success,
  unknown:    sidebarColors.neutral,
  trend1:     sidebarColors.primary,
  trend2:     sidebarColors.accent,
  trend3:     sidebarColors.accentPurple,
  trend4:     sidebarColors.accentCyan,
  trend5:     sidebarColors.accentOrange,
};

export const THREAT_COLORS = {
  critical: {
    primary:       sidebarColors.dangerDark,
    primarySoft:   'rgba(220, 38, 38, 0.2)',
    primaryBorder: 'rgba(220, 38, 38, 0.5)',
    accent:        sidebarColors.warningDark,
    bgSection:     sidebarColors.surfaceElevated,
    bgWashFrom:    'rgba(220, 38, 38, 0.15)',
    bgWashTo:      'rgba(217, 119, 6, 0.1)',
  },
  high: {
    primary:       sidebarColors.warningDark,
    primarySoft:   'rgba(217, 119, 6, 0.2)',
    primaryBorder: 'rgba(217, 119, 6, 0.5)',
    accent:        sidebarColors.dangerDark,
    bgSection:     sidebarColors.surfaceElevated,
    bgWashFrom:    'rgba(217, 119, 6, 0.15)',
    bgWashTo:      'rgba(220, 38, 38, 0.1)',
  },
  medium: {
    primary:       sidebarColors.accentOrange,
    primarySoft:   'rgba(251, 146, 60, 0.2)',
    primaryBorder: 'rgba(251, 146, 60, 0.5)',
    accent:        sidebarColors.successSoft,
    bgSection:     sidebarColors.surfaceElevated,
    bgWashFrom:    'rgba(251, 146, 60, 0.15)',
    bgWashTo:      'rgba(52, 211, 153, 0.1)',
  },
  low: {
    primary:       sidebarColors.accent,
    primarySoft:   'rgba(217, 119, 87, 0.2)',
    primaryBorder: 'rgba(217, 119, 87, 0.5)',
    accent:        sidebarColors.accentCyan,
    bgSection:     sidebarColors.surfaceElevated,
    bgWashFrom:    'rgba(217, 119, 87, 0.15)',
    bgWashTo:      'rgba(56, 189, 248, 0.1)',
  },
};


export const STATUS_BADGE = {
  malicious:  'inline-flex items-center px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-700 border border-orange-500/40 text-xs font-black shadow-sm backdrop-blur-sm',
  suspicious: 'inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-700 border border-amber-500/40 text-xs font-black shadow-sm backdrop-blur-sm',
  clean:      'inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 text-xs font-black shadow-sm backdrop-blur-sm',
  unknown:    'inline-flex items-center px-3 py-1.5 rounded-xl bg-stone-500/20 text-stone-700 border border-stone-500/40 text-xs font-black shadow-sm backdrop-blur-sm',
  live:       'inline-flex items-center px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-700 border border-orange-500/50 text-xs font-black shadow-sm animate-pulse backdrop-blur-sm',
};

export const BUTTON_STYLES = {
  primary:   'bg-gradient-to-r from-orange-500 to-orange-400 text-white border border-orange-500/40 shadow-lg shadow-orange-500/40 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.02]',
  secondary: 'bg-[#ffffff]/80 hover:bg-[#f5f4ee]/80 text-[#3d3929] border border-[#dad9d4] shadow-sm shadow-black/5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200',
  danger:    'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white border border-red-500/40 shadow-lg shadow-red-500/25 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200',
  ghost:     'bg-transparent text-[#535146] hover:text-[#3d3929] hover:bg-[#ffffff]/60 border border-transparent hover:border-[#dad9d4] px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200',
};

export const INPUT_STYLES = {
  base: 'bg-[#ffffff]/80 border border-[#dad9d4] text-[#3d3929] placeholder-[#83827d] focus:border-[#c96442] focus:ring-2 focus:ring-[#c96442]/30 focus:bg-[#ffffff] rounded-xl h-11 px-4 py-2 shadow-inner shadow-black/5 transition-all duration-200 hover:border-[#d97757]/60',
};

export const LOADING_STYLES = {
  dots:         'flex items-center gap-1.5',
  dot:          'w-2 h-2 rounded-full bg-[#c96442]',
  spinner:      'border-2 border-transparent border-t-[#c96442] rounded-full',
  pulseBar:     'h-2 bg-gradient-to-r from-[#f5f4ee] via-[#d97757] to-[#f5f4ee] rounded-full',
  skeleton:     'bg-gradient-to-r from-[#f5f4ee] via-[#e5e2d8] to-[#f5f4ee] animate-pulse rounded-xl',
  skeletonText: 'bg-gradient-to-r from-[#f5f4ee] via-[#e5e2d8] to-[#f5f4ee] animate-pulse rounded',
};

export const LOADING_CONTAINER = {
  base:    'flex flex-col items-center justify-center p-8 space-y-4 bg-gradient-to-br from-[#ffffff] to-[#faf9f5] rounded-2xl border border-[#dad9d4] shadow-xl shadow-black/5',
  spinner: 'w-12 h-12 border-4 border-[#d97757]/60 border-t-[#c96442] rounded-full animate-spin',
  text:    'text-sm font-semibold tracking-wide text-[#6b6653]',
};

export const SHADOWS = {
  card:   'shadow-sm hover:shadow-md transition-shadow',
  glow:   'shadow-[0_16px_48px_rgba(201,100,66,0.15)]',
  subtle: 'shadow-sm',
  neon:   'shadow-[0_0_20px_rgba(201,100,66,0.3)]',
  strong: 'shadow-md',
};

// Aliases
export const getAppColors = () => APP_COLORS;
export const getChartColors = () => CHART_COLORS;
export const getThreatColors = () => THREAT_COLORS;
export const getButtonStyles = () => BUTTON_STYLES;









export const INTEL_CARD_COLORS = {
  bg: '#1a1a1a',
  border: '#333333',
  headerBg: '#222222',
  headerText: '#ffffff',
  bodyText: '#cccccc',
  link: '#3b82f6',
  hoverBg: '#2a2a2a'
};



export const CARD_STYLES = {
  base: "rounded-xl overflow-hidden shadow-sm border",
  dark: "bg-zinc-900 border-zinc-800",
  light: "bg-white border-zinc-200",
  header: "px-4 py-3 border-b flex items-center justify-between",
  body: "p-4",
  footer: "px-4 py-3 border-t bg-zinc-50/50 dark:bg-zinc-900/50"
};


export const style = {
  card: {
    backgroundColor : APP_COLORS.surface,
    borderColor: APP_COLORS.border,
    color: APP_COLORS.textPrimary,
    boxShadow: `0 1px 3px ${APP_COLORS.borderSoft}`,
  },
  header: {
    backgroundColor: APP_COLORS.surface,
    borderColor: APP_COLORS.border,
    color: APP_COLORS.textPrimary,
    boxShadow: `0 1px 3px ${APP_COLORS.borderSoft}`,
  },

}

export const RISK_COLORS = { "critical": { "primary": "#ef4444", "bg": "rgba(239, 68, 68, 0.1)", "border": "rgba(239, 68, 68, 0.2)", "text": "#ffffff", "level": "Critical" }, "high": { "primary": "#f97316", "bg": "rgba(249, 115, 22, 0.1)", "border": "rgba(249, 115, 22, 0.2)", "text": "#ffffff", "level": "High" }, "medium": { "primary": "#eab308", "bg": "rgba(234, 179, 8, 0.1)", "border": "rgba(234, 179, 8, 0.2)", "text": "#ffffff", "level": "Medium" }, "low": { "primary": "#10b981", "bg": "rgba(16, 185, 129, 0.1)", "border": "rgba(16, 185, 129, 0.2)", "text": "#ffffff", "level": "Low" }, "info": { "primary": "#3b82f6", "bg": "rgba(59, 130, 246, 0.1)", "border": "rgba(59, 130, 246, 0.2)", "text": "#ffffff", "level": "Info" }, "unknown": { "primary": "#6b7280", "bg": "rgba(107, 114, 128, 0.1)", "border": "rgba(107, 114, 128, 0.2)", "text": "#ffffff", "level": "Unknown" }, "clean": { "primary": "#10b981", "bg": "rgba(16, 185, 129, 0.1)", "border": "rgba(16, 185, 129, 0.2)", "text": "#ffffff", "level": "Clean" } };
