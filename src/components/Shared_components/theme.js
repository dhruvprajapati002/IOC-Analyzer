
// ── Tailwind-ready class-name helpers ─────────────────────────────────────────
// Use these constants in JSX className strings so every component stays in sync.
// These reference the CSS custom properties defined in globals.css.
export const tw = {
  // Backgrounds
  pageBg:      "bg-t-bg",
  pageDeepBg:  "bg-t-bgDeep",
  surface:     "bg-t-surface",
  surfaceAlt:  "bg-t-surfaceAlt",
  surfaceMuted:"bg-t-surfaceMuted",
  sidebar:     "bg-t-sidebar",

  // Text
  textPrimary:   "text-t-textPrimary",
  textSecondary: "text-t-textSecondary",
  textMuted:     "text-t-textMuted",
  textLighter:   "text-t-textLighter",

  // Borders
  border:      "border-t-border",
  borderHover: "hover:border-t-borderHover",
  borderSoft:  "border-t-borderSoft",

  // Brand
  accent:      "text-t-primary",
  accentBg:    "bg-t-primary",
  accentHover: "hover:bg-t-primaryHover",

  // Status
  success:  "text-t-success",
  warning:  "text-t-warning",
  danger:   "text-t-danger",
  info:     "text-t-info",

  // Common card style
  card: "bg-t-sidebar border border-t-border rounded-xl shadow-t-card",
  cardHover: "hover:shadow-t-hover hover:border-t-borderHover transition-all duration-200",

  // Common input / select
  input: "bg-t-surfaceAlt border border-t-border text-sm text-t-textPrimary rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-t-primary/60 placeholder:text-t-textMuted",

  // Common button base
  btnPrimary: "bg-t-primary hover:bg-t-primaryHover text-t-textPrimary font-medium rounded-lg px-4 py-2 transition-colors duration-150",
  btnGhost: "bg-transparent hover:bg-t-surfaceAlt text-t-textSecondary hover:text-t-textPrimary border border-t-border rounded-lg px-4 py-2 transition-colors duration-150",
};

// ── Utility: derive rgba from any theme hex color ────────────────────────────
// Usage: rgba(theme.colors.cyan, 0.18) → "rgba(6,182,212,0.18)"
export const rgba = (hex, alpha) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};