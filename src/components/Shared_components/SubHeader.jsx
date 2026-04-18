/**
 * SubHeader.jsx — Second fixed strip
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  left slot                              right slot       │  h-12  top-{topOffset}  z-50
 * └─────────────────────────────────────────────────────────┘
 *
 * Props
 *   sidebarW   {number}     Sidebar width px       (default: 64)
 *   topOffset  {number}     Top offset px          (default: 48 — sits below Header)
 *   left       {ReactNode}  Left slot content
 *   right      {ReactNode}  Right slot content
 *   children   {ReactNode}  Full-width override — replaces left/right layout
 */

export default function SubHeader({
  sidebarW  = 64,
  topOffset = 48,
  left,
  right,
  children,
}) {
  return (
    <div
      className="fixed z-50 right-0 h-12 flex items-center gap-2.5 px-5
                 bg-[var(--t-bg)] border-b border-t-border shadow-sm"
      style={{ left: sidebarW, top: topOffset }}
    >
      {children ?? (
        <>
          {/* Left slot */}
          {left && (
            <div className="flex items-center gap-2.5">
              {left}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right slot */}
          {right && (
            <div className="flex items-center gap-2.5 shrink-0">
              {right}
            </div>
          )}
        </>
      )}
    </div>
  );
}
