/**
 * Header.jsx — Top fixed strip
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  title (left)                         right slot (right) │  h-12  top-0  z-50
 * └──────────────────────────────────────────────────────────┘
 *
 * Props
 *   sidebarW   {number}            Sidebar width px  (default: 64)
 *   title      {string|ReactNode}  Left side — page name or any element
 *   subtitle   {string}            Optional subtitle / breadcrumb below title
 *   right      {ReactNode}         Right side — clock, avatar, notifications, etc.
 */

export default function Header({ sidebarW = 64, title = "", subtitle, right }) {
  return (
    <div
      className="fixed z-50 top-0 right-0 h-12 flex items-center gap-4 px-5
                 bg-[var(--t-bg)] border-b border-t-border shadow-sm"
      style={{ left: sidebarW }}
    >
      {/* Left — title + optional subtitle */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {typeof title === "string" ? (
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-t-textPrimary truncate leading-none capitalize tracking-wide">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-t-textMuted truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        ) : (
          title
        )}
      </div>

      {/* Right slot */}
      {right && (
        <div className="flex items-center gap-3 shrink-0">
          {right}
        </div>
      )}
    </div>
  );
}
