# UI Issues Report
Generated: 2026-04-24
Total Issues Found: 38

---

## SUMMARY TABLE

| # | Category | File | Severity | Status |
|---|----------|------|----------|--------|
| UI-001 | Color Violation | src/lib/colors.ts (INTEL_CARD_COLORS) | HIGH | OPEN |
| UI-002 | Color Violation | src/lib/colors.ts (CARD_STYLES) | HIGH | OPEN |
| UI-003 | Color Violation | src/app/dashboard/DashboardPageView.tsx | MEDIUM | OPEN |
| UI-004 | Color Violation | src/app/dashboard/DashboardPageView.tsx (ErrorState) | HIGH | OPEN |
| UI-005 | Color Violation | src/app/api/dashboard-v2/route.ts (hardcoded colors) | MEDIUM | OPEN |
| UI-006 | Color Violation | src/components/ui/mobile-layout-debug.tsx | LOW | OPEN |
| UI-007 | Layout & Overflow | src/app/analyze/AnalyzePageView.tsx | MEDIUM | OPEN |
| UI-008 | Layout & Overflow | src/app/history/HistoryPageView.tsx | MEDIUM | OPEN |
| UI-009 | Layout & Overflow | src/components/layout/Sidebar.tsx | MEDIUM | OPEN |
| UI-010 | Typography | src/app/analyze/AnalyzePageView.tsx | LOW | OPEN |
| UI-011 | Typography | src/lib/colors.ts (STATUS_BADGE) | MEDIUM | OPEN |
| UI-012 | Component Inconsistency | src/app/analyze/AnalyzePageView.tsx | MEDIUM | OPEN |
| UI-013 | Component Inconsistency | src/app/dashboard/DashboardPageView.tsx | MEDIUM | OPEN |
| UI-014 | Component Inconsistency | src/app/analyze/components/DynamicVTData.tsx | MEDIUM | OPEN |
| UI-015 | Component Inconsistency | Various CardHeader onClick | HIGH | OPEN |
| UI-016 | Component Inconsistency | src/app/history/HistoryPageView.tsx | MEDIUM | OPEN |
| UI-017 | Loading & Empty State | src/app/dashboard/DashboardPageView.tsx (charts) | MEDIUM | OPEN |
| UI-018 | Loading & Empty State | src/components/ui/dashboard-skeleton.tsx | LOW | OPEN |
| UI-019 | Loading & Empty State | src/components/guards/AdminGuard.tsx | LOW | OPEN |
| UI-020 | Loading & Empty State | src/app/file-analysis components | MEDIUM | OPEN |
| UI-021 | Animation & Performance | src/app/analyze/AnalyzePageView.tsx (motion) | MEDIUM | OPEN |
| UI-022 | Animation & Performance | src/app/analyze/AnalyzePageView.tsx (useEffect) | HIGH | OPEN |
| UI-023 | Animation & Performance | src/app/analyze/components/ThreatIntelligenceCards.tsx | LOW | OPEN |
| UI-024 | Animation & Performance | src/app/analyze/AnalyzePageView.tsx (1583 lines) | HIGH | OPEN |
| UI-025 | Accessibility | src/app/analyze/components/DynamicVTData.tsx | HIGH | OPEN |
| UI-026 | Accessibility | src/components/layout/Sidebar.tsx | MEDIUM | OPEN |
| UI-027 | Accessibility | src/app/file-analysis/components/MitreAttackSection.tsx | MEDIUM | OPEN |
| UI-028 | Accessibility | src/app/history/HistoryPageView.tsx | MEDIUM | OPEN |
| UI-029 | Accessibility | src/app/analyze/AnalyzePageView.tsx (buttons) | HIGH | OPEN |
| UI-030 | Accessibility | Color contrast throughout | MEDIUM | OPEN |
| UI-031 | Scrollbar & Overflow | src/app/history/HistoryPageView.tsx | MEDIUM | OPEN |
| UI-032 | Color Violation | src/lib/colors.ts (RISK_COLORS hardcoded) | LOW | OPEN |
| UI-033 | Typography | Multiple files mixed font sizes | MEDIUM | OPEN |
| UI-034 | Component Inconsistency | Card border-radius inconsistency | MEDIUM | OPEN |
| UI-035 | Animation & Performance | src/contexts/AuthContext.tsx useEffect | HIGH | OPEN |
| UI-036 | Loading & Empty State | File analysis page no loading | MEDIUM | OPEN |
| UI-037 | Accessibility | No aria-live regions for toast notifications | MEDIUM | OPEN |
| UI-038 | Accessibility | Dialog/modal focus trap missing in DomainSidePanel | HIGH | OPEN |

---

## CATEGORY 1 — COLOR & THEME VIOLATIONS

### Issue UI-001
**File:** src/lib/colors.ts
**Line:** 270–278
**Severity:** HIGH
**Code Found:**
```ts
export const INTEL_CARD_COLORS = {
  bg: '#1a1a1a',
  border: '#333333',
  headerBg: '#222222',
  headerText: '#ffffff',
  bodyText: '#cccccc',
  link: '#3b82f6',
  hoverBg: '#2a2a2a'
};
```
**Problem:**
Hardcoded dark-theme colors (`#1a1a1a`, `#222222`, `#333333`) defined in the design system's own file. These are dark-theme colors in an app that uses a light theme (warm cream `#faf9f5`). Any component using `INTEL_CARD_COLORS` will render as a dark card on a light page.
**Fix:**
Replace with values from the existing `APP_COLORS` palette:
```ts
export const INTEL_CARD_COLORS = {
  bg: APP_COLORS.surfaceSoft,
  border: APP_COLORS.border,
  headerBg: APP_COLORS.surfaceMuted,
  headerText: APP_COLORS.textPrimary,
  bodyText: APP_COLORS.textSecondary,
  link: APP_COLORS.accentBlue,
  hoverBg: APP_COLORS.surfaceTint,
};
```

### Issue UI-002
**File:** src/lib/colors.ts
**Line:** 282–289
**Severity:** HIGH
**Code Found:**
```ts
export const CARD_STYLES = {
  base: "rounded-xl overflow-hidden shadow-sm border",
  dark: "bg-zinc-900 border-zinc-800",
  light: "bg-white border-zinc-200",
  header: "px-4 py-3 border-b flex items-center justify-between",
  body: "p-4",
  footer: "px-4 py-3 border-t bg-zinc-50/50 dark:bg-zinc-900/50"
};
```
**Problem:**
Uses Tailwind `bg-zinc-*` / `border-zinc-*` classes that bypass the `APP_COLORS` design system. The `dark` variant uses `bg-zinc-900` (a true dark color) while the app is light-themed. The `footer` includes `dark:` prefixes for a non-existent dark mode.
**Fix:**
Replace with inline styles using `APP_COLORS` tokens or remove if unused:
```ts
export const CARD_STYLES = {
  base: "rounded-2xl overflow-hidden shadow-sm border",
  light: "", // use style={{ background: APP_COLORS.surface, borderColor: APP_COLORS.border }}
  header: "px-4 py-3 border-b flex items-center justify-between",
  body: "p-4",
  footer: "px-4 py-3 border-t",
};
```

### Issue UI-003
**File:** src/app/dashboard/DashboardPageView.tsx
**Line:** 222–223
**Severity:** MEDIUM
**Code Found:**
```tsx
<div className="min-h-screen w-full bg-[#faf9f5]">
  <div className="mx-auto max-w-screen-2xl bg-[#faf9f5] px-3 py-4 sm:px-4 lg:px-6">
```
**Problem:**
Hardcoded `bg-[#faf9f5]` in Tailwind class instead of using `APP_COLORS.background`. If the design token changes, this won't update.
**Fix:**
```tsx
<div className="min-h-screen w-full" style={{ background: APP_COLORS.background }}>
  <div className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-4 lg:px-6" style={{ background: APP_COLORS.background }}>
```

### Issue UI-004
**File:** src/app/dashboard/DashboardPageView.tsx
**Line:** 92–108
**Severity:** HIGH
**Code Found:**
```tsx
<div className="rounded-2xl border border-red-200 bg-red-50 p-5">
  <p className={`... text-red-600`}>
  <p className={`... text-slate-600`}>
  <button ... className="rounded-md border border-red-400 bg-white px-3 py-2 text-xs font-semibold text-red-600">
```
**Problem:**
`ErrorState` component uses raw Tailwind color classes (`border-red-200`, `bg-red-50`, `text-red-600`, `text-slate-600`) instead of `APP_COLORS.danger*` tokens. Also uses `bg-white` instead of `APP_COLORS.surface`.
**Fix:**
```tsx
style={{
  borderColor: `${APP_COLORS.danger}33`,
  backgroundColor: `${APP_COLORS.dangerSoft}20`,
}}
// and for text: style={{ color: APP_COLORS.danger }}
```

### Issue UI-005
**File:** src/app/api/dashboard-v2/route.ts
**Line:** 24–27, 57–63
**Severity:** MEDIUM
**Code Found:**
```ts
const THREAT_VECTOR_COLORS = { high: '#dc2626', low: '#3b82f6' };
const VERDICT_COLOR_MAP = {
  Malicious: '#dc2626', Suspicious: '#d97706', Harmless: '#16a34a',
  Undetected: '#6b6653', Unknown: '#9c87f5',
};
```
**Problem:**
Hardcoded hex colors for chart data returned to frontend. While these are backend-generated values consumed by charts, they should reference the centralized color tokens from `colors.ts` for consistency.
**Fix:**
Import `sidebarColors` from `@/lib/colors` and reference:
```ts
const THREAT_VECTOR_COLORS = { high: sidebarColors.dangerDark, low: sidebarColors.accentBlue };
```

### Issue UI-006
**File:** src/components/ui/mobile-layout-debug.tsx
**Line:** 27, 32
**Severity:** LOW
**Code Found:**
```tsx
<div className="fixed top-2 right-2 z-50 bg-red-900/90 text-white p-3 rounded-lg ...">
  className="text-red-200 hover:text-white"
```
**Problem:**
Uses `text-white`, `bg-red-900`, `text-red-200` Tailwind classes. This is a debug component so LOW severity, but should still be consistent.
**Fix:**
Acceptable as dev-only debug tool. Consider gating with `process.env.NODE_ENV === 'development'`.

### Issue UI-032
**File:** src/lib/colors.ts
**Line:** 308
**Severity:** LOW
**Code Found:**
```ts
export const RISK_COLORS = { "critical": { "primary": "#ef4444", "bg": "rgba(239, 68, 68, 0.1)", ... "text": "#ffffff" }, ... };
```
**Problem:**
`RISK_COLORS` uses `"text": "#ffffff"` (white text) for all risk levels, which makes no sense in a light-themed app. This would render invisible white text on light backgrounds.
**Fix:**
Change `text` values to `APP_COLORS.textPrimary` or remove if unused.

---

## CATEGORY 2 — LAYOUT & OVERFLOW ISSUES

### Issue UI-007
**File:** src/app/analyze/AnalyzePageView.tsx
**Line:** 1030
**Severity:** MEDIUM
**Code Found:**
```tsx
<div className="relative min-h-screen">
```
**Problem:**
Page wrapper has no `overflow-x-hidden`. On mobile, wide cards/badges or the domain side panel could cause horizontal scroll.
**Fix:**
```tsx
<div className="relative min-h-screen overflow-x-hidden">
```

### Issue UI-008
**File:** src/app/history/HistoryPageView.tsx
**Line:** 46
**Severity:** MEDIUM
**Code Found:**
```tsx
<div className="flex h-[calc(100vh-3rem)] flex-col" style={{ background: APP_COLORS.background }}>
```
**Problem:**
Uses hardcoded `3rem` offset. If the sidebar or header height changes, content will be misaligned. No `overflow-x-hidden` on outer container.
**Fix:**
Use CSS custom property for header height or measure dynamically. Add `overflow-x-hidden`.

### Issue UI-009
**File:** src/components/layout/Sidebar.tsx
**Line:** 29
**Severity:** MEDIUM
**Code Found:**
```tsx
<aside className="flex flex-col h-full border-r relative z-50 ...">
```
**Problem:**
Sidebar uses `z-50` which can conflict with modals, dialogs, and overlays that also use `z-50`. The sidebar is a persistent element that shouldn't compete for the highest z-index.
**Fix:**
Use `z-30` or `z-20` for sidebar, reserve `z-50` for modals/overlays.

---

## CATEGORY 3 — TYPOGRAPHY INCONSISTENCIES

### Issue UI-010
**File:** src/app/analyze/AnalyzePageView.tsx
**Line:** 1067, 1110, 1137, 1166, 1195
**Severity:** LOW
**Code Found:**
```tsx
className="text-[10px] uppercase tracking-[0.12em] font-semibold"
className="text-[10px] uppercase tracking-[0.16em] text-[10px]"
```
**Problem:**
Multiple instances of `text-[10px]` mixed with `tracking-[0.12em]` and `tracking-[0.16em]`. The tracking values are inconsistent for the same visual element type (labels). Should use the TYPOGRAPHY system from `typography.ts`.
**Fix:**
Standardize to `TYPOGRAPHY.caption.xs` or a single tracking value like `tracking-[0.14em]`.

### Issue UI-011
**File:** src/lib/colors.ts
**Line:** 214–220
**Severity:** MEDIUM
**Code Found:**
```ts
export const STATUS_BADGE = {
  malicious: '... text-xs font-black ...',
  suspicious: '... text-xs font-black ...',
};
```
**Problem:**
`font-black` (900 weight) on badge text is excessively heavy for `text-xs` (12px). Badge text should use `font-bold` (700) or `font-extrabold` (800) at small sizes.
**Fix:**
Replace `font-black` with `font-bold` in all `STATUS_BADGE` values.

### Issue UI-033
**File:** Multiple files
**Severity:** MEDIUM
**Problem:**
Mixed font size approaches throughout:
- `text-[10px]` — custom Tailwind arbitrary value (AnalyzePageView)
- `text-xs` — Tailwind class (12px)
- `text-sm` — Tailwind class (14px)
- Inline `fontSize: '0.875rem'` in LOADING_STYLES
- `TYPOGRAPHY.body.sm` class system in DashboardPageView + HistoryPageView

At least 3 different font-sizing systems coexist. This makes it hard to maintain a consistent type scale.
**Fix:**
Standardize on the `TYPOGRAPHY` system from `typography.ts` for all text sizing.

---

## CATEGORY 4 — COMPONENT INCONSISTENCIES

### Issue UI-012
**File:** src/app/analyze/AnalyzePageView.tsx
**Line:** 1049, 1276, 1343
**Severity:** MEDIUM
**Code Found:**
```tsx
<Card className="rounded-2xl border" ...>  // multiple instances
```
**Problem:**
All Cards in AnalyzePageView use `rounded-2xl` (16px), which is correct. But the UI's `card.tsx` component uses `rounded-xl` (12px) by default. These override at usage site, creating maintenance burden.
**Fix:**
Update the base `Card` component in `card.tsx` to use `rounded-2xl` by default.

### Issue UI-013
**File:** src/app/dashboard/DashboardPageView.tsx
**Line:** 92
**Severity:** MEDIUM
**Code Found:**
```tsx
<div className="rounded-2xl border border-red-200 bg-red-50 p-5">
```
**Problem:**
`ErrorState` uses plain div with manual styling instead of the `Card` component. Inconsistent with how other sections build cards.
**Fix:**
Use `<Card className="rounded-2xl border" style={{ ... }}>` for consistency.

### Issue UI-014
**File:** src/app/analyze/components/DynamicVTData.tsx
**Line:** 121, 198, 276, 423, 513
**Severity:** MEDIUM
**Code Found:**
```tsx
<CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('yara')}>
```
**Problem:**
`CardHeader` used as clickable accordion trigger but lacks `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space, and `aria-expanded` attributes.
**Fix:**
Add accessibility attributes:
```tsx
<CardHeader className="pb-3 cursor-pointer" role="button" tabIndex={0}
  aria-expanded={openSections.yara} onClick={() => toggleSection('yara')}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('yara') }}>
```

### Issue UI-015
**File:** Multiple analyze/components/
**Severity:** HIGH
**Problem:**
Multiple clickable `div`s and `span`s in the analyze components lack `cursor-pointer` and accessibility roles. The `CardHeader` onClick pattern is repeated across DynamicVTData, ThreatIntelligenceCards, and file-analysis/MitreAttackSection without consistent hover states.
**Fix:**
Create a reusable `AccordionHeader` component wrapping `CardHeader` with:
- `role="button"` + `tabIndex={0}` + `aria-expanded`
- `cursor-pointer` + hover background
- keyboard event handlers

### Issue UI-016
**File:** src/app/history/HistoryPageView.tsx
**Line:** 52–69
**Severity:** MEDIUM
**Code Found:**
```tsx
<button type="button" className={BUTTON_STYLES.secondary} onClick={exportCSV}>
  <Download className="mr-1 inline h-4 w-4" /> CSV
</button>
```
**Problem:**
Export buttons use `BUTTON_STYLES.secondary` correctly but icon size (`h-4 w-4`) should be verified against the design system. Some other buttons use `h-3.5 w-3.5` for similar small-context icons.
**Fix:**
Standardize icon sizes: `h-4 w-4` for button-inline icons, `h-3.5 w-3.5` for label-inline indicators.

### Issue UI-034
**File:** Multiple
**Severity:** MEDIUM
**Problem:**
Card border-radius inconsistency:
- `Card` component default: `rounded-xl` (12px) in card.tsx
- Most page-level usage: `rounded-2xl` (16px) override
- LOADING_CONTAINER: `rounded-2xl`
- CARD_STYLES.base: `rounded-xl`
**Fix:**
Standardize Card component to `rounded-2xl` (16px) as the default.

---

## CATEGORY 5 — LOADING & EMPTY STATE GAPS

### Issue UI-017
**File:** src/app/dashboard/DashboardPageView.tsx
**Line:** 241–264
**Severity:** MEDIUM
**Code Found:**
```tsx
<ThreatTrendChart data={dailyTrends} />
<ThreatTypePieChart data={threatTypes} />
<IOCTypeDistributionChart data={iocTypeDistribution} />
```
**Problem:**
Charts receive empty arrays when `safePayload` defaults to `EMPTY_PAYLOAD`. Individual chart components should handle empty/null data gracefully by showing a `NoGraphData` component. Currently, some may render blank canvases.
**Fix:**
Ensure each chart component checks `if (!data || data.length === 0) return <NoGraphData />;`

### Issue UI-018
**File:** src/components/ui/dashboard-skeleton.tsx
**Line:** 6, 82
**Severity:** LOW
**Code Found:**
```tsx
<div className="space-y-4 sm:space-y-6 animate-pulse">
<div className="animate-pulse">
```
**Problem:**
Uses raw `animate-pulse` divs outside the centralized `SkeletonBase` system. Should use `SkeletonBase` or `SkeletonPrimitives`.
**Fix:**
Refactor to use `<SkeletonBase>` from `@/components/skeletons`.

### Issue UI-019
**File:** src/components/guards/AdminGuard.tsx
**Line:** 53
**Severity:** LOW
**Code Found:**
```tsx
<div className="animate-pulse">
```
**Problem:**
AdminGuard loading state uses raw `animate-pulse` instead of the skeleton system.
**Fix:**
Replace with `<SkeletonBase className="h-8 w-full" />` pattern.

### Issue UI-020
**File:** src/app/file-analysis/components/*.tsx
**Severity:** MEDIUM
**Problem:**
FileMetadataSection uses `animate-pulse` at lines 155, 299, 343 for indicator dots. These are inline pulse animations, not loading skeletons, which is acceptable for status indicators.
**Fix:**
No change needed for status dots. But verify the file-analysis page has proper loading state for the upload flow.

### Issue UI-036
**File:** src/app/file-analysis/
**Severity:** MEDIUM
**Problem:**
No `FileAnalysisSkeleton` was found for the file analysis page. If the page loads slowly, users see a blank page.
**Fix:**
Create a `FileAnalysisSkeleton` component similar to `AnalyzeSkeleton`.

---

## CATEGORY 6 — ANIMATION & PERFORMANCE ISSUES

### Issue UI-021
**File:** src/app/analyze/AnalyzePageView.tsx
**Line:** 1043–1046, 1232–1235, 1269–1274, 1335–1340
**Severity:** MEDIUM
**Code Found:**
```tsx
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35 }}>
```
**Problem:**
Multiple Framer Motion `<motion.div>` elements use `animate` without `viewport={{ once: true }}`. These will re-animate every time the component mounts, not on scroll, so `viewport` isn't strictly needed here. However, there is no `whileInView` usage at all — animations only fire on mount.
**Fix:**
Current behavior is acceptable for mount animations. For scroll-triggered sections (future), add `viewport={{ once: true }}`.

### Issue UI-022
**File:** src/app/analyze/AnalyzePageView.tsx
**Line:** 936–944
**Severity:** HIGH
**Code Found:**
```tsx
useEffect(() => {
  if (!rateLimitIndicatorState.isLimited) return;
  const timer = window.setInterval(() => {
    setNowMs(Date.now());
  }, 1000);
  return () => window.clearInterval(timer);
}, [rateLimitIndicatorState.isLimited]);
```
**Problem:**
`rateLimitIndicatorState` is an object computed during render which creates a new reference every render. Using `.isLimited` (a primitive) is fine for the dependency, but the `rateLimitIndicatorState` object itself depends on `rateLimit` state and `nowMs` state. The `setNowMs` call in the interval triggers re-render → re-compute `rateLimitIndicatorState` → but since `.isLimited` doesn't change, the effect doesn't re-run. This is correct but fragile.
**Fix:**
Extract `isLimited` into a standalone `useMemo` variable:
```tsx
const isRateLimited = rateLimit.remaining === 0;
useEffect(() => { if (!isRateLimited) return; ... }, [isRateLimited]);
```

### Issue UI-024
**File:** src/app/analyze/AnalyzePageView.tsx
**Severity:** HIGH
**Problem:**
This file is **1583 lines** with state management, data transformation, and rendering all in one component. The `onSubmit` function alone is ~600 lines of data transformation logic mixed with React state updates.
**Fix:**
Refactor into:
1. `useIOCAnalysis` hook — data fetching and transformation
2. `AnalysisResultsTransformer` utility — pure data transforms
3. `AnalyzePageView` — rendering only
4. Separate sub-components for each results section

### Issue UI-035
**File:** src/contexts/AuthContext.tsx
**Line:** 182–220
**Severity:** HIGH
**Code Found:**
```tsx
useEffect(() => {
  if (!token || !user) return;
  if (user.id === SYSTEM_USER_ID) return;
  const verifyCurrentSession = async () => { ... };
  void verifyCurrentSession();
}, [token, user]);
```
**Problem:**
This `useEffect` depends on `[token, user]` but inside it calls `resetToSystemSession()` which sets both `token` and `user` — potentially causing re-renders and re-triggering the effect. Also, `user` is an object, so it creates a new reference every render unless memoized.
**Fix:**
Depend on `token` only (or `token` + `user?.id`), and use a ref to track verification status to avoid re-verification loops.

### Issue UI-023
**File:** src/app/analyze/components/ThreatIntelligenceCards.tsx
**Line:** 350, 554, 621
**Severity:** LOW
**Code Found:**
```tsx
className="w-1.5 h-1.5 rounded-full animate-pulse"
```
**Problem:**
Small indicator dots using `animate-pulse` for status indicators. This is OK semantically but creates ongoing CSS animation on idle elements.
**Fix:**
Add `will-change: opacity` or consider using a static colored dot unless "live" status is intended.

---

## CATEGORY 7 — ACCESSIBILITY ISSUES

### Issue UI-025
**File:** src/app/analyze/components/DynamicVTData.tsx
**Line:** 121, 198, 276, 423, 513
**Severity:** HIGH
**Problem:**
Clickable `CardHeader` elements with `onClick` but missing:
- `role="button"`
- `tabIndex={0}`
- `onKeyDown` handler for Enter/Space
- `aria-expanded` indicating open/closed state
**Fix:**
See Issue UI-014 fix.

### Issue UI-026
**File:** src/components/layout/Sidebar.tsx
**Line:** 55–74
**Severity:** MEDIUM
**Problem:**
Sidebar navigation links use icon-only display (`<item.icon className="shrink-0 h-6 w-6" />`) without visible labels. They do have `title={item.label}` but no `aria-label` on the `<Link>` element. Screen readers may only announce the URL.
**Fix:**
Add `aria-label={item.label}` to each `<Link>`:
```tsx
<Link key={item.href} href={item.href} aria-label={item.label} ...>
```

### Issue UI-027
**File:** src/app/file-analysis/components/MitreAttackSection.tsx
**Line:** 60
**Severity:** MEDIUM
**Code Found:**
```tsx
className="flex items-center justify-between gap-3 p-3 cursor-pointer"
```
**Problem:**
Clickable div for MITRE accordion without `role="button"`, `tabIndex={0}`, or keyboard handler.
**Fix:**
Add accessibility attributes as described in UI-014.

### Issue UI-028
**File:** src/app/history/HistoryPageView.tsx
**Line:** 53–69
**Severity:** MEDIUM
**Problem:**
Export buttons for CSV/JSON have proper `type="button"` and use `BUTTON_STYLES`, but no `aria-label` distinguishing them (both say just "CSV" / "JSON" visually).
**Fix:**
Add `aria-label="Export as CSV"` and `aria-label="Export as JSON"`.

### Issue UI-029
**File:** src/app/analyze/AnalyzePageView.tsx
**Line:** 1249–1260, 1408–1420
**Severity:** HIGH
**Code Found:**
```tsx
<button type="button" onClick={() => openDomainPanel(currentIOC)}
  className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
  style={{ ... }}>
  Click here to check domain lookup
</button>
```
**Problem:**
Buttons use inline `style={{}}` instead of `BUTTON_STYLES`. Missing `focus-visible` ring styles for keyboard navigation. No focus outline when tabbing.
**Fix:**
Add `focus-visible:ring-2 focus-visible:ring-offset-2` or use `BUTTON_STYLES.primary`.

### Issue UI-030
**File:** Throughout application
**Severity:** MEDIUM
**Problem:**
The `APP_COLORS.textMuted` (`#83827d`) is used on backgrounds like `APP_COLORS.backgroundSoft` (`#f5f4ee`). The contrast ratio is approximately 3.3:1, which fails WCAG AA for normal text (requires 4.5:1). `APP_COLORS.textDim` (`#b4b2a7`) on `#faf9f5` is even worse at ~2.1:1.
**Fix:**
Darken muted text colors to meet 4.5:1 contrast ratio. `textMuted` should be at least `#6b6a65` for `AA` compliance on the cream background.

### Issue UI-037
**File:** src/app/analyze/AnalyzePageView.tsx, AuthContext.tsx
**Severity:** MEDIUM
**Problem:**
Toast notifications via `sonner` are used for rate limit warnings, analysis results, and errors. No `aria-live` region is explicitly set for dynamic status updates.
**Fix:**
Sonner's `<Toaster>` likely handles this internally. Verify by checking Sonner's accessibility docs. For custom status bars, add `aria-live="polite"`.

### Issue UI-038
**File:** src/app/analyze/components/domain/DomainSidePanel.tsx
**Severity:** HIGH
**Problem:**
The domain side panel slides in as an overlay but may not trap focus. The close button has `aria-label="Close domain panel backdrop"` on the backdrop, but the panel itself needs:
- `role="dialog"` + `aria-modal="true"`
- Focus trap (focus stays inside panel while open)
- Escape key to close
**Fix:**
Use Radix UI `Dialog` or implement focus trap with `useFocusTrap` hook.

---

## CATEGORY 8 — SCROLLBAR & OVERFLOW

### Issue UI-031
**File:** src/app/history/HistoryPageView.tsx
**Line:** 86
**Severity:** MEDIUM
**Code Found:**
```tsx
<div className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
```
**Problem:**
Uses native `overflow-auto` instead of the themed `<ScrollArea>` component from `@/components/ui/ScrollArea`. This means the history page's main content area uses the browser's default scrollbar rather than the themed one.
**Fix:**
Wrap content in `<ScrollArea>`:
```tsx
<ScrollArea className="flex h-full min-h-0 flex-col gap-4">
```

---

## QUICK FIX COMMANDS

| FIND | REPLACE WITH |
|------|-------------|
| `bg-[#faf9f5]` | `style={{ background: APP_COLORS.background }}` |
| `border-red-200` | `style={{ borderColor: APP_COLORS.dangerSoft }}` |
| `bg-red-50` | `style={{ background: \`${APP_COLORS.danger}0A\` }}` |
| `text-red-600` | `style={{ color: APP_COLORS.danger }}` |
| `text-slate-600` | `style={{ color: APP_COLORS.textSecondary }}` |
| `bg-white` (in components) | `style={{ background: APP_COLORS.surface }}` |
| `font-black` (in STATUS_BADGE) | `font-bold` |

---

## FILES WITH MOST ISSUES (Ranked)

| # | File | Issue Count | Top Categories |
|---|------|-------------|---------------|
| 1 | `src/app/analyze/AnalyzePageView.tsx` | 8 | Animation, Accessibility, Performance |
| 2 | `src/lib/colors.ts` | 5 | Color Violations, Typography |
| 3 | `src/app/dashboard/DashboardPageView.tsx` | 4 | Color Violations, Loading States |
| 4 | `src/app/analyze/components/DynamicVTData.tsx` | 3 | Accessibility, Component |
| 5 | `src/app/history/HistoryPageView.tsx` | 3 | Layout, Accessibility, Scrollbar |
| 6 | `src/contexts/AuthContext.tsx` | 2 | Animation/Performance |
| 7 | `src/components/layout/Sidebar.tsx` | 2 | Layout, Accessibility |
| 8 | `src/app/analyze/components/ThreatIntelligenceCards.tsx` | 2 | Animation, Component |
