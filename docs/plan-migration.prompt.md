## Plan: Unify colors.js as Single Source

TL;DR: Make design-wrapper `colors.js` the sole palette. Turn `src/lib/colors.ts` into a typed adapter. Replace all hardcoded/Tailwind/global colors with semantic tokens. Generate CSS vars and a Tailwind semantic map from `colors.js`. Refactor wrapper + IOC components, then enforce via lint/CI and regex sweeps.

**Steps**
1. Normalize `design-wrapper-component/colors.js`: add full token set (base/text/border/primary/accent/state/severity/gradients/sidebar/chart), remove Tailwind-like strings, add alpha helper, optionally expose a CSS-var map generator.
2. Adapt `src/lib/colors.ts`: import and re-export only from `colors.js` (APP_COLORS, CHART_COLORS, SEVERITY_COLORS, SIDEBAR_COLORS); no literals or Tailwind classes.
3. CSS vars: generate :root vars from `colors.js`; replace hardcoded vars in `src/app/globals.css` and `src/styles/dashboard.css`; delete duplicate t-* sets.
4. Tailwind: update config to consume a generated semantic color map from `colors.js`; remove default palette; expose only semantic keys; safelist non-color utilities; run codemod to strip `bg-*/text-*/border-*` color classes.
5. Refactor design-wrapper components: `design-wrapper-component/Button.jsx`, `design-wrapper-component/AppInput.jsx`, `design-wrapper-component/UnifiedSelect.jsx`, `design-wrapper-component/StatsCard.jsx`, `design-wrapper-component/Sidebar.css` to use tokens from `colors.js`; remove hex/rgba.
6. Refactor IOC components with inline/Tailwind colors: `src/components/ui/RefreshButton.tsx`, `src/components/ui/mobile-layout-debug.tsx`, `src/app/analyze/components/ShareAnalysisButton.tsx` (comments), and any others found by sweeps, to use APP_COLORS.
7. Enforcement and QA: add ESLint/CI rules blocking hex/rgb/hsl/named colors and Tailwind color classes; run regex sweeps; visual QA on login, dashboard, history, file-analysis pages and wrapper components (Sidebar, Button, AppInput, UnifiedSelect).

**Relevant files**
- design-wrapper-component/colors.js — single palette source to expand/normalize.
- src/lib/colors.ts — adapter only.
- design-wrapper-component/Button.jsx, AppInput.jsx, UnifiedSelect.jsx, StatsCard.jsx, Sidebar.css — refactor to tokens.
- src/app/globals.css, src/styles/dashboard.css — replace with generated CSS vars.
- src/components/ui/RefreshButton.tsx, src/components/ui/mobile-layout-debug.tsx, src/app/analyze/components/ShareAnalysisButton.tsx — remove Tailwind/inline colors.
- tailwind.config.* — restrict colors to semantic map from `colors.js`.

**Verification**
1. Regex scans for hex/rgb/hsl/named colors and Tailwind color classes return empty after migration.
2. ESLint/CI rules pass; adapter builds; types resolve from `colors.js`.
3. Visual QA on key pages and wrapper components; gradients/shadows match tokens.

**Decisions**
- Single source: design-wrapper-component/colors.js.
- Adapter: src/lib/colors.ts re-exports only.
- Tailwind palette: removed; use semantic map generated from `colors.js`.

**Further Considerations**
1. If runtime theming needed, generate CSS vars from `colors.js` and consume via `var()` in both apps.
2. Include an alpha helper in `colors.js` to avoid reintroducing literals for shadows/overlays.
3. Add Storybook/regression snapshots for wrapper components after migration.
