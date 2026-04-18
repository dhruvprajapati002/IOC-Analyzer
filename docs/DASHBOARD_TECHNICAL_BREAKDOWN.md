# Dashboard Technical Breakdown (Rebuild Specification)

This document is derived from the current implementation in the repository and is intended to let a team rebuild the dashboard from scratch with implementation-level fidelity.

Scope note:
- This covers the active dashboard page route and its runtime dependencies.
- Where runtime sample values are unavailable from a live environment, examples are marked as assumed.

---

## 1. Route & Entry Point

- Route path: `/dashboard`
- App Router entry file: `src/app/dashboard/page.tsx`
- Page initializer behavior:
  - `page.tsx` is a Server Component (no `"use client"` directive).
  - It returns `<DashboardPageView />` from `src/app/dashboard/DashboardPageView.tsx`.
- Rendering mode: hybrid
  - Server-side route entry (`page.tsx`)
  - Client-side dashboard runtime (`DashboardPageView.tsx` uses `"use client"`, hooks, fetches, local state)

Layout/runtime wrappers that participate before dashboard renders:
- Root: `src/app/layout.tsx`
- Client wrappers: `src/app/ClientLayout.tsx`
- Main app shell: `src/components/layout/MainLayout.tsx`
- Auth gate: `src/components/ProtectedPage.tsx`

---

## 2. Component Structure

### Full parent-child hierarchy (runtime)

- RootLayout (`src/app/layout.tsx`)
  - ClientLayout (`src/app/ClientLayout.tsx`)
    - AuthProvider (`src/contexts/AuthContext.tsx`)
    - SidebarProvider (`src/contexts/SidebarContext.tsx`)
    - MainLayout (`src/components/layout/MainLayout.tsx`)
      - Sidebar (`src/components/layout/Sidebar.tsx`)
      - Header (`src/components/layout/Header.tsx`)
      - `children` -> Dashboard route
        - Dashboard route entry (`src/app/dashboard/page.tsx`)
          - DashboardPageView (`src/app/dashboard/DashboardPageView.tsx`)
            - ProtectedPage (`src/components/ProtectedPage.tsx`)
              - DashboardContent (internal function component)
                - DashboardHeader (`src/app/dashboard/components/DashboardHeader.tsx`)
                  - TimeFilterDropdown (`src/app/dashboard/components/TimeFilterDropdown.tsx`)
                - ThreatTrendChart (`src/app/dashboard/components/ThreatTrendChart.tsx`)
                  - TimeFilterDropdown
                - ThreatSeverityChart (`src/app/dashboard/components/ThreatSeverityChart.tsx`)
                  - TimeFilterDropdown
                - IOCTypeDistributionChart (`src/app/dashboard/components/IOCTypeDistributionChartNew.tsx`)
                  - TimeFilterDropdown
                - FileAnalysisGraph (`src/app/dashboard/components/FileAnalysisGraphCompact.tsx`)
                  - TimeFilterDropdown
                - ThreatTypePieChart (`src/app/dashboard/components/ThreatTypePieChartModern.tsx`)
                  - TimeFilterDropdown
                - GeographicDistributionChart (`src/app/dashboard/components/GeographicDistributionChartNew.tsx`)
                  - TimeFilterDropdown
                - MalwareFamiliesChart (`src/app/dashboard/components/MalwareFamiliesChartNew.tsx`)
                  - TimeFilterDropdown
                - TopThreatsGraph (`src/app/dashboard/components/TopThreatsGraph.tsx`)
                  - TimeFilterDropdown

### Reusable vs page-specific

Reusable/common shell components:
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/ProtectedPage.tsx`
- `src/components/ui/card.tsx` (used by many charts)
- `src/components/ui/badge.tsx` (used by many charts)
- `src/components/NoGraphData.tsx`

Dashboard page-specific components:
- Everything under `src/app/dashboard/components/` (except these can still be reused later)

Dashboard components present but currently not mounted in `DashboardPageView.tsx`:
- `DetectionEnginePerformanceChartNew.tsx` (import commented out in page view)
- `RiskScoreTrend.tsx`
- `RealTimeThreatFeed.tsx`

---

## 3. Data Sources & Flow

### Primary data endpoint

- Endpoint: `GET /api/dashboard-v2`
- File: `src/app/api/dashboard-v2/route.ts`
- Query params:
  - `range`: `daily | weekly | monthly` (default `weekly`)
  - `force=true` optional bypass for in-memory API cache
- Auth requirement:
  - Extract token via `getTokenFromRequest` and verify with `verifyToken`
  - Unauthorized/invalid token returns `401`

### Upstream data origin

- MongoDB collections/models:
  - `IocUserHistory` from `src/lib/models/IocUserHistory.ts`
  - `IocCache` from `src/lib/models/IocCache.ts`
- Query flow inside API route:
  1. Query user history by `userId` and `searched_at >= startDate`.
  2. Build `{ value, type }` list from history.
  3. Query `IocCache` with `$or` on those pairs.
  4. Build `cacheMap` by key `${value}::${type}`.
  5. Aggregate metrics from history + cached analysis payload.

### Client fetch method

- Fetch abstraction: `apiFetch` in `src/lib/apiFetch.ts`
- Uses native `fetch`.
- Side effect on `401`: dispatches `window` event `auth:logout` and throws error.

### Where data is fetched from dashboard page

- `DashboardContent` in `DashboardPageView.tsx`:
  - fetches `data.stats` from `/api/dashboard-v2?range=weekly`
  - polling every 30s via `setInterval`
- `DashboardHeader`:
  - fetches `/api/dashboard-v2?range=${timeRange}`
- Each chart component fetches the same endpoint independently with local `timeRange` state:
  - ThreatTrendChart
  - ThreatSeverityChart
  - IOCTypeDistributionChart
  - FileAnalysisGraph
  - ThreatTypePieChart
  - GeographicDistributionChart
  - MalwareFamiliesChart
  - TopThreatsGraph

Fetch timing:
- On mount
- On each local time range change
- Polling only in parent `DashboardContent` header-stats fetch (30s)

Important implementation implication:
- Initial dashboard load triggers multiple parallel requests to the same endpoint (parent + header + each card).

---

## 4. Data Structure (Exact Shapes)

### API response contract (`/api/dashboard-v2`)

```json
{
  "stats": {
    "totalIOCs": "number",
    "maliciousIOCs": "number",
    "cleanIOCs": "number",
    "suspiciousIOCs": "number",
    "pendingIOCs": "number",
    "detectionRate": "number",
    "trends": {
      "totalIOCs": "number",
      "threatsDetected": "number"
    }
  },
  "dailyTrends": [
    {
      "day": "string",
      "dateLabel": "YYYY-MM-DD",
      "displayDate": "string",
      "threats": "number",
      "clean": "number",
      "total": "number"
    }
  ],
  "threatTypes": [
    {
      "type": "Malicious|Suspicious|Harmless|Undetected|Unknown",
      "count": "number",
      "percentage": "number",
      "color": "string"
    }
  ],
  "threatVectors": [
    {
      "name": "string",
      "count": "number",
      "severity": "string",
      "detectionRate": "number",
      "riskLevel": "string",
      "color": "string",
      "description": "string",
      "percentage": "number"
    }
  ],
  "iocTypeDistribution": [
    {
      "type": "IP Address|Domain|URL|File Hash",
      "count": "number",
      "color": "string",
      "icon": "string"
    }
  ],
  "geoDistribution": [
    {
      "country": "string",
      "countryName": "string",
      "count": "number",
      "maliciousCount": "number",
      "suspiciousCount": "number",
      "harmlessCount": "number",
      "undetectedCount": "number",
      "threatCount": "number",
      "threatPercentage": "number",
      "verdictBreakdown": {
        "malicious": "number",
        "suspicious": "number",
        "harmless": "number",
        "undetected": "number"
      }
    }
  ],
  "fileAnalysis": {
    "totalFiles": "number",
    "avgFileSize": "number",
    "maliciousFiles": "number",
    "cleanFiles": "number",
    "detectionRate": "number",
    "topFileTypes": [
      {
        "type": "string",
        "count": "number"
      }
    ]
  },
  "mitreAttack": {
    "totalTechniques": "number",
    "topTechniques": []
  },
  "threatIntelligence": {
    "bySeverity": [
      {
        "severity": "critical|high|medium|low",
        "count": "number"
      }
    ],
    "totalCritical": "number",
    "totalHigh": "number",
    "totalMedium": "number",
    "totalLow": "number"
  },
  "malwareFamilies": [
    {
      "name": "string",
      "count": "number",
      "severity": "Critical|High|Medium|Low"
    }
  ],
  "detectionEngines": [
    {
      "engine": "string",
      "totalDetections": "number",
      "maliciousDetections": "number",
      "detectionRate": "number"
    }
  ],
  "timeRange": "daily|weekly|monthly",
  "daysIncluded": "number",
  "startDate": "ISODate",
  "endDate": "ISODate",
  "cachedAt": "ISODate",
  "dataVersion": "2.1-mongo",
  "privacyMode": "history-only"
}
```

### Example response data (assumed)

```json
{
  "stats": {
    "totalIOCs": 248,
    "maliciousIOCs": 72,
    "cleanIOCs": 130,
    "suspiciousIOCs": 21,
    "pendingIOCs": 25,
    "detectionRate": 37.5,
    "trends": {
      "totalIOCs": 12.4,
      "threatsDetected": -4.8
    }
  },
  "dailyTrends": [
    { "day": "Mon", "dateLabel": "2026-04-12", "displayDate": "Apr 12", "threats": 8, "clean": 16, "total": 24 },
    { "day": "Tue", "dateLabel": "2026-04-13", "displayDate": "Apr 13", "threats": 11, "clean": 14, "total": 25 }
  ],
  "threatTypes": [
    { "type": "Malicious", "count": 72, "percentage": 29, "color": "#b91c1c" },
    { "type": "Suspicious", "count": 21, "percentage": 8, "color": "#ea580c" },
    { "type": "Harmless", "count": 130, "percentage": 52, "color": "#16a34a" },
    { "type": "Undetected", "count": 20, "percentage": 8, "color": "#6b6653" },
    { "type": "Unknown", "count": 5, "percentage": 2, "color": "#9c87f5" }
  ]
}
```

### Input collection schema (exact persisted fields used)

`IocUserHistory` (`src/lib/models/IocUserHistory.ts`):
- `userId: string`
- `value: string`
- `type: 'ip' | 'domain' | 'url' | 'hash'`
- `searched_at: Date`
- `verdict?: string`
- `label?: string`
- `source?: string`
- `metadata?: { filename?: string; filesize?: number; filetype?: string }`

`IocCache` (`src/lib/models/IocCache.ts`):
- `value: string`
- `type: 'ip' | 'domain' | 'url' | 'hash'`
- `verdict: string`
- `severity: string`
- `riskScore: number`
- `threatIntel: { threatTypes: string[]; confidence: number }`
- `analysis?: mixed` (contains `IOCAnalysisResult` shape used by dashboard API)

---

## 5. Graph & Visualization Mapping

### 5.1 ThreatTrendChart

- Component: `src/app/dashboard/components/ThreatTrendChart.tsx`
- Type: Line chart
- Library: Recharts
- API source: `dailyTrends`
- Mapping:
  - X-axis: `dateLabel` (tick label derived from `displayTime`/`day`/`displayDate` by selected local time range)
  - Y-axis: numeric IOC counts (auto domain `[0, ceil(dataMax * 1.15)]`)
  - Series 1: `clean`
  - Series 2: `threats`
- Transformations:
  - Computes `threatRate = totalThreats / (totalThreats + totalClean)`
  - Calculates trend by comparing first half vs second half of array
  - Legend hover fades non-active line

### 5.2 ThreatSeverityChart

- Component: `src/app/dashboard/components/ThreatSeverityChart.tsx`
- Type: Horizontal stacked bar chart
- Library: Recharts
- API source: `threatIntelligence`
- Mapping:
  - Input totals: `totalCritical`, `totalHigh`, `totalMedium`, `totalLow`
  - Chart row object: `{ name: 'Threat Distribution', Critical, High, Medium, Low }`
  - X-axis: count scale
  - Y-axis: single category (`name`)
  - Stacks: `Critical`, `High`, `Medium`, `Low`
- Transformations:
  - Builds local `threatData` aggregate and per-severity percentages in stat tiles

### 5.3 IOCTypeDistributionChart

- Component: `src/app/dashboard/components/IOCTypeDistributionChartNew.tsx`
- Type: Donut chart + list grid
- Library: Recharts
- API source: `iocTypeDistribution`
- Mapping:
  - Pie `dataKey`: `count`
  - Labels/list: `type`
  - Segment color: `color`
  - Center label: `sum(count)`
- Transformations:
  - `totalCount = sum(count)`
  - Percentage shown per type: `count / totalCount`

### 5.4 FileAnalysisGraph

- Component: `src/app/dashboard/components/FileAnalysisGraphCompact.tsx`
- Type: Horizontal bar chart + KPI tiles
- Library: Recharts
- API source: `fileAnalysis`
- Mapping:
  - KPIs: `totalFiles`, `maliciousFiles`, `cleanFiles`, `detectionRate`
  - Bar chart data: `topFileTypes`
  - X-axis: `count` (hidden axis)
  - Y-axis: `type`
  - Series: `count`
- Transformations:
  - Per-tile percentages from `maliciousFiles/totalFiles` and `cleanFiles/totalFiles`
  - Slices to top 4 file types for chart

### 5.5 ThreatTypePieChart

- Component: `src/app/dashboard/components/ThreatTypePieChartModern.tsx`
- Type: Donut pie chart
- Library: ECharts via `echarts-for-react`
- API source: `threatTypes` (fallback `threatTypeDistribution`)
- Mapping:
  - Pie data: `{ value: count, name: normalized(type|name) }`
  - Legend values: name + count + percentage
  - Colors: from API `color`
- Transformations:
  - Drops zero-count entries
  - Normalizes label `Harmless -> Clean`
  - Sort descending by `count`

### 5.6 GeographicDistributionChart

- Component: `src/app/dashboard/components/GeographicDistributionChartNew.tsx`
- Type: Vertical bar chart + country stat grid
- Library: Recharts
- API source: `geoDistribution`
- Mapping:
  - X-axis: `country`
  - Y-axis: `count`
  - Tooltip: `countryName`, verdict breakdown fields, `threatPercentage`
- Transformations:
  - Uses top 8 for chart, top 4 for list
  - Color policy switches to severity color if `threatPercentage >= 50`

### 5.7 MalwareFamiliesChart

- Component: `src/app/dashboard/components/MalwareFamiliesChartNew.tsx`
- Type: Vertical bar chart + family grid
- Library: Recharts
- API source: `malwareFamilies`
- Mapping:
  - X-axis: `name`
  - Y-axis: `count`
  - Color by `severity`
- Transformations:
  - Maps API fields to local `{ name, count, severity }`
  - Falls back severity by index if missing
  - Uses top 8 for chart, top 6 for grid

### 5.8 TopThreatsGraph

- Component: `src/app/dashboard/components/TopThreatsGraph.tsx`
- Type: Horizontal bar chart + summary counters
- Library: Recharts
- API source: `threatVectors`
- Mapping:
  - X-axis: `count`
  - Y-axis: `name`
  - Bar color: per-item `color`
- Transformations:
  - Filters `count > 0`
  - Sorts descending by `count`
  - Slices top 8
  - Computes severity distribution counters and total detections

### Dormant chart (not currently rendered)

- `DetectionEnginePerformanceChartNew.tsx`
  - Uses `detectionEngines`
  - Maps `totalDetections -> detections`, `detectionRate -> accuracy`, and derives `falsePositives`
  - This chart import/render is currently commented out in `DashboardPageView.tsx`

---

## 6. Business Logic

### Server-side aggregation (`/api/dashboard-v2`)

- Time window logic:
  - `daily=1`, `weekly=7`, `monthly=30` days
  - `startDate` normalized to local midnight
- In-memory response cache:
  - Key: `dashboard_v2_${userId}_${timeRange}`
  - TTL: 30 seconds
- Verdict aggregation:
  - `malicious`, `suspicious`, `harmless`, `undetected`, `unknown`
- Severity normalization:
  - only `critical|high|medium|low` accepted, else `unknown`
- Detection rate:
  - `((malicious + suspicious) / totalIOCs) * 100` rounded to 1 decimal
- Trend deltas:
  - first-half vs second-half comparisons for IOC totals and threats
- Threat vectors:
  - from `analysis.threatIntel.threatTypes`
  - `riskLevel`: `high` if `count > 10`, else `low`
- Geo distribution:
  - only for `record.type === 'ip'`
  - groups by country code/name from `analysis.reputation.geolocation`
  - computes verdict counters and `threatPercentage`
- File analysis:
  - file entry if `record.source === 'file_analysis' || record.type === 'hash'`
  - requires `metadata.filename`
  - aggregates avg size, top file types, malicious/clean counts
- Malware families:
  - from `(analysis as any).vtData.malware_families`
  - top 12 by count
- Detection engines:
  - from `analysis.threatIntel.detections`
  - top 10 by detection count

### Client-side business logic patterns

- Every chart has local loading and empty states.
- Every chart has independent local `timeRange` state (not globally synchronized).
- `DashboardContent` error state blocks full dashboard body and shows retry UI (retry button currently no-op `onClick={() => undefined}`).
- `ProtectedPage` blocks rendering until auth is ready and valid.

---

## 7. UI/UX Details

### Layout system

- Shell: flex row with fixed sidebar + flexible main column (`MainLayout`).
- Sidebar width: fixed `70px` (currently always collapsed icon rail).
- Header: sticky top bar in main column.
- Dashboard body:
  - Container: `max-w-[1900px]` with responsive horizontal padding
  - Row 1: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
  - Row 2: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
  - Row 3: `grid-cols-1 xl:grid-cols-2`

### Responsiveness

- Mobile-first via Tailwind breakpoints.
- Chart cards use fixed-height chart regions and responsive containers.
- Header controls wrap with `flex-wrap` to avoid overflow.

### Theme and design system

- Color tokens centralized in `src/lib/colors.ts` (`APP_COLORS`, `CHART_COLORS`).
- Current visual theme is a light, warm neutral palette with orange primary accents.
- Typography classes come from `src/lib/typography` plus Google fonts set in root layout.

### Interaction patterns

- Rich custom tooltips per chart.
- Hover emphasis and dimming in many charts.
- Icon-only sidebar uses `title` hover hints for navigation labels.

---

## 8. State Management

### Global state

- `AuthContext` (`src/contexts/AuthContext.tsx`)
  - `user`, `token`, `isLoading`, `isAuthenticated`, `isAdmin`
  - `login`, `logout`
  - Bootstraps from `localStorage`
  - Verifies token with `/api/auth/me`
- `SidebarContext` (`src/contexts/SidebarContext.tsx`)
  - `isOpen`, `toggleSidebar`, `openSidebar`, `closeSidebar`
  - Currently not driving the fixed-width sidebar behavior

### Local state on dashboard

- Parent dashboard state (`DashboardContent`):
  - `headerStats`, `loading`, `error`, `intervalRef`
- Per-chart local state:
  - `timeRange`
  - fetched dataset
  - loading flags
  - hover indices/legend hover state

### State flow

1. Auth token comes from `AuthContext`.
2. Token is attached to `Authorization` header in each fetch call.
3. API returns aggregate payload.
4. Components map response slices to their local view models.

---

## 9. Interactions & Events

### User actions

- Sidebar:
  - click nav icons -> route navigation (`next/link`)
  - hover icon -> browser tooltip via `title`
  - click logout button -> `AuthContext.logout()` and router push to `/login`
- Header and chart-level time filters:
  - select range from `TimeFilterDropdown`
  - triggers local state update and refetch in that component
- Chart interactions:
  - tooltip on hover
  - line legend hover in trend chart toggles visual emphasis
  - per-item hover highlight in bar/pie/list hybrids

### Events and triggers

- `apiFetch` 401 behavior triggers `window.dispatchEvent(new Event('auth:logout'))`.
- `AuthProvider` listens to `auth:logout` and clears auth state.
- `DashboardContent` sets a 30s poll interval for header stats.

### Navigation logic

- Public routes from `src/lib/routes.ts`: `/login`, `/register`, `/about`
- Protected routes (including `/dashboard`) render inside authenticated app shell.
- `ProtectedPage` ensures non-authenticated users are redirected to `/login`.

---

## 10. File & Folder Mapping

```text
src/
  app/
    layout.tsx
    ClientLayout.tsx
    dashboard/
      page.tsx
      DashboardPageView.tsx
      components/
        DashboardHeader.tsx
        DetectionEnginePerformanceChartNew.tsx
        FileAnalysisGraphCompact.tsx
        GeographicDistributionChartNew.tsx
        IOCTypeDistributionChartNew.tsx
        MalwareFamiliesChartNew.tsx
        RealTimeThreatFeed.tsx
        RiskScoreTrend.tsx
        ThreatSeverityChart.tsx
        ThreatTrendChart.tsx
        ThreatTypePieChartModern.tsx
        TimeFilterDropdown.tsx
        TopThreatsGraph.tsx
    api/
      dashboard-v2/
        route.ts
  components/
    ProtectedPage.tsx
    NoGraphData.tsx
    layout/
      MainLayout.tsx
      Sidebar.tsx
      Header.tsx
    ui/
      card.tsx
      badge.tsx
  contexts/
    AuthContext.tsx
    SidebarContext.tsx
  lib/
    apiFetch.ts
    routes.ts
    colors.ts
    models/
      IocUserHistory.ts
      IocCache.ts
    threat-intel/
      types/
        threat-intel.types.ts
```

---

## 11. Dependencies & Libraries

Dashboard-relevant libraries from `package.json`:

- Framework/runtime:
  - `next@^15.5.9`
  - `react@^18.3.1`
  - `react-dom@^18.3.1`
- Visualization:
  - `recharts@^3.1.2`
  - `echarts-for-react@^3.0.5`
  - `@mui/x-charts@^8.23.0` (installed, not used by current dashboard page)
  - `d3@^7.9.0` (installed, not used by current dashboard page)
- UI and icons:
  - `lucide-react@^0.469.0`
  - Radix primitives (`@radix-ui/*`)
  - `sonner@^2.0.7`
- Data/backend:
  - `mongoose@^8.8.6`
  - `jsonwebtoken@^9.0.2`
- Styling:
  - `tailwindcss@^4.0.0`
  - `tailwindcss-animate@^1.0.7`
  - `@tailwindcss/postcss@^4.1.12`

Fetch/data client behavior:
- Dashboard uses native `fetch` through `apiFetch` helper, not Axios.

---

## 12. Rebuild Instructions (Priority Order)

### Phase 1: Foundation

1. Create App Router route at `src/app/dashboard/page.tsx` returning a client page component.
2. Implement application shell (`MainLayout`) with:
   - fixed sidebar rail
   - sticky top header
   - scrollable main area
3. Implement auth context bootstrap and protected route wrapper.
4. Implement `apiFetch` wrapper with 401 global logout event behavior.

### Phase 2: Data API

1. Create `GET /api/dashboard-v2` route.
2. Add token validation and user extraction.
3. Connect MongoDB and models (`IocUserHistory`, `IocCache`).
4. Implement aggregation pipeline exactly as current logic:
   - verdict counts
   - severity counts
   - daily trend buckets
   - threat vectors
   - geo distribution
   - file analysis
   - malware families
   - detection engines
5. Add in-memory 30s cache by user + range key.
6. Return full payload contract with metadata fields.

### Phase 3: Dashboard page skeleton and loading/error paths

1. Build `DashboardPageView` with:
   - parent loading screen
   - parent error state card
   - `ProtectedPage` wrapper
2. Add `DashboardHeader` and 3 dashboard rows with exact grid breakpoints.
3. Add parent header polling (30s) if preserving current behavior.

### Phase 4: Implement chart cards (in this order)

1. `ThreatTrendChart` (line chart)
2. `ThreatSeverityChart` (stacked horizontal)
3. `IOCTypeDistributionChart` (donut)
4. `FileAnalysisGraph` (KPIs + bar)
5. `ThreatTypePieChart` (ECharts donut)
6. `GeographicDistributionChart` (bar + list)
7. `MalwareFamiliesChart` (bar + list)
8. `TopThreatsGraph` (horizontal bar)

For each card:
- add local `timeRange`
- fetch `/api/dashboard-v2?range=${timeRange}`
- map the specific payload slice
- implement loading and empty states

### Phase 5: UX parity and hardening

1. Add `TimeFilterDropdown` and reuse in all cards.
2. Add tooltip designs, hover states, and badge styling parity.
3. Verify responsive behavior on `sm`, `md`, `xl` breakpoints.
4. Add fallback-safe rendering for zero totals and empty arrays.
5. Keep sidebar icon `title` attributes for discoverability in collapsed mode.

### Phase 6: Recommended improvements (optional but high value)

1. Consolidate duplicate card requests:
   - fetch once in parent for active range and pass data down
   - or introduce SWR/React Query cache key deduping
2. Unify time range state across header and cards to avoid inconsistent dashboards.
3. Implement Retry button behavior in parent error state (currently no-op).
4. Move heavy aggregation to DB pipeline if dataset size grows.

---

## Assumptions Logged

- Example numeric response values are assumed because no live authenticated API response was sampled in this analysis session.
- Components `RiskScoreTrend` and `RealTimeThreatFeed` are considered non-active for the current `/dashboard` page because they are not rendered by `DashboardPageView.tsx`.
- `DetectionEnginePerformanceChart` is treated as dormant because render import is commented out.
