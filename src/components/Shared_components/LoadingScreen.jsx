/**
 * LoadingScreen.jsx — Centralized loading indicator
 *
 * Drop-in replacement for every ad-hoc spinner in the app.
 * Renders a centered spinner + optional text.
 *
 * Props
 *   text      {string}   Loading message (default: "Loading…")
 *   size      {"sm"|"md"|"lg"}  spinner diameter (default: "md")
 *   fullPage  {boolean}  if true, fills the entire viewport (default: false)
 *   className {string}   extra wrapper classes
 */

const SIZES = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-[3px]",
};

export default function LoadingScreen({
  text = "Loading…",
  size = "md",
  fullPage = false,
  className = "",
}) {
  const wrapper = fullPage
    ? "fixed inset-0 z-50 bg-t-bg"
    : "w-full py-16";

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${wrapper} ${className}`}>
      <div
        className={`rounded-full border-transparent animate-spin ${SIZES[size] || SIZES.md}`}
        style={{ borderTopColor: 'var(--t-primary)' }}
      />
      {text && (
        <p className="text-sm text-t-textSecondary font-medium select-none">{text}</p>
      )}
    </div>
  );
}
