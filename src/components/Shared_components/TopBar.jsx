/**
 * TopBar.jsx — Thin orchestrator
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │ Header      title (left)              right slot (right)   │  h-12  top-0
 * ├────────────────────────────────────────────────────────────┤
 * │ SubHeader   left slot                 right slot           │  h-12  top-12
 * └────────────────────────────────────────────────────────────┘
 *
 * Either strip can be hidden independently via showHeader / showSubHeader.
 *
 * Props
 *   sidebarW       {number}            Sidebar width px   (default: 64)
 *   showHeader     {boolean}           Render Header?     (default: true)
 *   showSubHeader  {boolean}           Render SubHeader?  (default: true)
 *
 *   ── Header props ──
 *   title          {string|ReactNode}  Header left content
 *   headerRight    {ReactNode}         Header right slot
 *
 *   ── SubHeader props ──
 *   subHeaderLeft  {ReactNode}         SubHeader left slot
 *   subHeaderRight {ReactNode}         SubHeader right slot
 *   subHeaderChildren {ReactNode}      Full-width SubHeader override
 */

import Header    from "./Header";
import SubHeader from "./SubHeader";

export default function TopBar({
  sidebarW      = 64,
  showHeader    = true,
  showSubHeader = true,

  // Header
  title         = "",
  headerRight,

  // SubHeader
  subHeaderLeft,
  subHeaderRight,
  subHeaderChildren,
}) {
  const headerH = showHeader ? 48 : 0;   // used to offset SubHeader

  return (
    <>
      {showHeader && (
        <Header
          sidebarW={sidebarW}
          title={title}
          right={headerRight}
        />
      )}

      {showSubHeader && (
        <SubHeader
          sidebarW={sidebarW}
          topOffset={headerH}
          left={subHeaderLeft}
          right={subHeaderRight}
        >
          {subHeaderChildren}
        </SubHeader>
      )}
    </>
  );
}
