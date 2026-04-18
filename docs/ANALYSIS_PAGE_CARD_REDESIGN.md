# Analysis Page Reverse Engineering and Card Redesign

## 1. 📍 Route & Entry Point

- Target page analyzed: History Analysis page (the page that currently implements search, filters, and tabular data display).
- Route path: /history
- Entry file: [src/app/history/page.tsx](src/app/history/page.tsx)
- Main page component: [src/app/history/HistoryPageView.tsx](src/app/history/HistoryPageView.tsx)
- Rendering type: Hybrid
- Server layer: [src/app/history/page.tsx](src/app/history/page.tsx) is a server component wrapper.
- Client layer: [src/app/history/HistoryPageView.tsx](src/app/history/HistoryPageView.tsx) and child components are client-rendered and fetch data in-browser.
- Protection: [src/components/ProtectedPage.tsx](src/components/ProtectedPage.tsx) gates access via AuthContext state.

---

## 2. 🧱 Component Structure

### Complete component tree for this page

```text
HistoryPage (src/app/history/page.tsx)
-> HistoryPageView (src/app/history/HistoryPageView.tsx)
-> ProtectedPage (src/components/ProtectedPage.tsx)
-> HistoryPageContent
-> HistoryStats (header KPI strip)
-> MyAnalysesTable (src/app/history/components/MyAnalysesTable.tsx)
-> ErrorAlert
-> HistoryFilters
-> HistoryTable
-> IOCDetailPanel (right-side panel, conditional)
```

### Child UI primitives used by page components

- [src/components/ui/input.tsx](src/components/ui/input.tsx)
- [src/components/ui/button.tsx](src/components/ui/button.tsx)
- [src/components/ui/select.tsx](src/components/ui/select.tsx)
- [src/components/ui/dropdown-menu.tsx](src/components/ui/dropdown-menu.tsx)
- [src/components/ui/table.tsx](src/components/ui/table.tsx)
- [src/components/ui/ScrollArea.tsx](src/components/ui/ScrollArea.tsx)

### Component responsibility map

- HistoryPageView: page shell, vertical layout, stats strip, mounts main table area.
- MyAnalysesTable: owns query/filter/page state, fetches records, computes lightweight stats, wires filters/table/detail panel.
- HistoryFilters: search input, type filter, verdict filter, export actions.
- HistoryTable: renders paginated table rows, row actions, page-size selector, pager controls.
- IOCDetailPanel: fetches and renders deep detail for selected IOC.
- HistoryStats: displays totals by verdict in compact header strip.
- ErrorAlert: displays request/export error states.

---

## 3. 🔍 Search & Filter System (CRITICAL)

### Search input logic

- UI field: HistoryFilters Input with placeholder Search by IOC, label, or hash.
- State owner: searchQuery in [src/app/history/components/MyAnalysesTable.tsx](src/app/history/components/MyAnalysesTable.tsx).
- Trigger mode: debounced.
- Debounce implementation: 500ms setTimeout useEffect on searchQuery in MyAnalysesTable.
- Behavior:
- If currentPage is 1, fetch immediately after debounce.
- Else set currentPage to 1 and let page effect trigger fetch.

### Backend search fields actually queried

- In [src/app/api/history-v2/route.ts](src/app/api/history-v2/route.ts), buildHistoryMatch applies:
- $or: value regex (IOC value)
- $or: label regex
- Effective search scope: IOC value + label only.
- Hash is searchable because hash values are stored in value.

### Filter types

- Type filter: Select with all, ip, domain, url, hash.
- Verdict filter: Select with all, malicious, suspicious, harmless, undetected.
- Source filter state exists in MyAnalysesTable (sourceFilter) and is sent to API when not all.
- Source filter UI is missing in HistoryFilters.

### Where filter logic lives

- Frontend state and query assembly:
- [src/app/history/components/MyAnalysesTable.tsx](src/app/history/components/MyAnalysesTable.tsx)
- Backend query application:
- [src/app/api/history-v2/route.ts](src/app/api/history-v2/route.ts)

### Critical implementation gap

- HistoryFiltersProps defines sourceFilter, but HistoryFilters does not expose onSourceFilterChange and does not render source filter control.
- Result: sourceFilter is effectively hardcoded to all from user perspective.

---

## 4. 🔌 Data Source & Flow

### Endpoints used by page

- List fetch: GET /api/history-v2
- Detail fetch: GET /api/history-v2/[ioc]
- Export fetch: GET /api/history-v2 with limit=1000 and current filters

### Frontend fetch method

- Uses apiFetch helper from [src/lib/apiFetch.ts](src/lib/apiFetch.ts).
- apiFetch behavior:
- First fetch with current Authorization header.
- On browser-side 401 only, retries once with system-public token via getSystemToken().

### Data flow sequence

1. HistoryPageView mounts MyAnalysesTable.
2. MyAnalysesTable initializes state.
3. useEffect fetches list on dependencies:
- currentPage
- typeFilter
- verdictFilter
- sourceFilter
- itemsPerPage
- token
4. Search change triggers separate 500ms debounced effect.
5. Response data is normalized into records + pagination state.
6. Local stats are recomputed from current page records and lifted to HistoryPageView.
7. Row click sets selectedIOC.
8. IOCDetailPanel mounts and fetches /api/history-v2/[ioc].
9. Export triggers new list fetch with same active filters and downloads CSV or JSON.

### Backend source of truth

- History list reads from IocUserHistory and enriches from IocCache analysis.
- Detail reads latest user history row, then cache by value + type.
- Backend files:
- [src/app/api/history-v2/route.ts](src/app/api/history-v2/route.ts)
- [src/app/api/history-v2/[ioc]/route.ts](src/app/api/history-v2/[ioc]/route.ts)
- [src/lib/models/IocUserHistory.ts](src/lib/models/IocUserHistory.ts)
- [src/lib/models/IocCache.ts](src/lib/models/IocCache.ts)
- [src/lib/ioc-cache.ts](src/lib/ioc-cache.ts)

---

## 5. 📦 Data Structure

### 5.1 List response shape (GET /api/history-v2)

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "string",
        "ioc": "string",
        "type": "ip|domain|url|hash",
        "verdict": "malicious|suspicious|harmless|undetected|unknown",
        "stats": {
          "malicious": 0,
          "suspicious": 0,
          "harmless": 0,
          "undetected": 0
        },
        "searchedAt": "ISO date string",
        "threatTypes": ["string"],
        "severity": "critical|high|medium|low|unknown",
        "popularThreatLabel": "string|null",
        "familyLabels": ["string"],
        "label": "string|null",
        "source": "ip_search|domain_search|url_search|hash_search|file_analysis|null",
        "metadata": {
          "filename": "string",
          "filesize": 123456,
          "filetype": "string",
          "riskScore": 0,
          "riskLevel": "critical|high|medium|low|unknown|null"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 0,
      "hasNextPage": false,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

### 5.2 Detail response shape (GET /api/history-v2/[ioc])

```json
{
  "success": true,
  "data": {
    "id": "string",
    "ioc": "string",
    "type": "ip|domain|url|hash",
    "verdict": "malicious|suspicious|harmless|undetected|unknown",
    "label": "string|null",
    "stats": {
      "malicious": 0,
      "suspicious": 0,
      "harmless": 0,
      "undetected": 0
    },
    "reputation": 0,
    "riskScore": 0,
    "riskLevel": "critical|high|medium|low|unknown|null",
    "threatIntel": {
      "threatTypes": ["string"],
      "severity": "critical|high|medium|low|unknown",
      "confidence": 0,
      "firstSeen": "string|null",
      "lastSeen": "string|null",
      "popularThreatLabel": "string|null",
      "familyLabels": ["string"],
      "threatCategories": ["string"],
      "suggestedThreatLabel": "string|null"
    },
    "detections": [
      {
        "engine": "string",
        "category": "string",
        "result": "string",
        "method": "string|null"
      }
    ],
    "fileInfo": {
      "name": "string",
      "size": 0,
      "type": "string",
      "md5": "string",
      "sha1": "string",
      "sha256": "string",
      "firstSeen": "string",
      "lastAnalysis": "string",
      "uploadDate": "string"
    },
    "sandboxAnalysis": {},
    "codeInsights": null,
    "mitreAttack": {
      "tactics": [
        { "id": "string", "name": "string", "description": "string", "link": "string" }
      ],
      "techniques": [
        { "id": "string", "name": "string", "description": "string", "link": "string" }
      ]
    },
    "abuseIPDB": {
      "abuseConfidenceScore": 0,
      "usageType": "string",
      "isp": "string",
      "isWhitelisted": false,
      "totalReports": 0
    },
    "geolocation": {
      "countryCode": "string|null",
      "countryName": "string",
      "region": "string",
      "city": "string",
      "latitude": 0,
      "longitude": 0,
      "timezone": "string|null",
      "isp": "string",
      "org": "string|null",
      "asn": "string",
      "asnName": "string|null"
    },
    "whois": null,
    "shodan": null,
    "metadata": {
      "searchedAt": "ISO date string",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string",
      "lastAnalysisDate": "ISO date string|null",
      "username": "string",
      "cacheTtl": 0,
      "userNotes": null,
      "userVerdict": null,
      "source": "string|null",
      "filename": "string|null",
      "filesize": 0,
      "filetype": "string|null",
      "entropy": null,
      "isPacked": null
    },
    "reputationData": {},
    "threatIntelData": {}
  }
}
```

### 5.3 Stored model fields (history + cache)

- History model fields:
- userId
- value
- type
- searched_at
- verdict
- label
- source
- metadata.filename
- metadata.filesize
- metadata.filetype

- Cache model fields:
- value
- type
- verdict
- severity
- riskScore
- threatIntel.threatTypes
- threatIntel.confidence
- analysis (mixed full payload)
- created_at
- expiresAt

---

## 6. 📊 CURRENT UI REPRESENTATION

### Current list UI

- Main representation is a table in [src/app/history/components/HistoryTable.tsx](src/app/history/components/HistoryTable.tsx).

### Table columns

- IOC
- Type
- Verdict
- Detection
- Analysis
- Analyzed
- Actions

### What each column shows

- IOC: record.ioc (truncated monospace).
- Type: uppercase type label with color.
- Verdict: badge-dot style text from verdict.
- Detection: compact counters for malicious/suspicious, fallback Clean tag.
- Analysis: icon + primary text from label or filename + optional filesize.
- Analyzed: searchedAt formatted with date-fns.
- Actions: View button; row click also opens detail panel.

### Current UI limitations

- Density issue: 7 columns squeeze contextual data; high cognitive load.
- Important metadata is hidden unless side panel opened.
- Selection model tied to IOC string, which can collide for same IOC across differing types.
- Stats strip is computed from current page records, not full filtered dataset.
- Sorting is effectively fixed to searched_at despite sortable-looking data domain.
- Source filter missing in UI, though state and API support it.
- Detail panel expects some top-level fields that API does not currently return in top-level shape.

---

## 7. 🚨 UNUSED / HIDDEN DATA

### Data available in list API but not surfaced in row UI

- severity
- threatTypes (array)
- familyLabels (array)
- popularThreatLabel
- metadata.riskScore and metadata.riskLevel (only indirectly shown in file contexts)

### Data available in detail API but currently not shown or only partially used

- metadata.cacheTtl
- metadata.lastAnalysisDate
- threatIntel.confidence
- threatIntel.suggestedThreatLabel
- reputationData raw payload
- threatIntelData raw payload
- fileInfo.sha1
- fileInfo.sha256

### Data expected in UI but not provided in detail top-level response

- IOCDetailPanel checks for details.greynoiseData, details.ipqsData, details.threatfoxData at top-level.
- Current API sends those values inside threatIntelData or analysis-derived objects, not guaranteed as direct top-level fields.
- Result: Multi-Platform Intelligence section may not render even when data exists.

### Missed insight opportunities

- Surface confidence and cache freshness to indicate trust level.
- Show trend marker for repeat IOC occurrences over time.
- Expose source dimension (file_analysis vs search type) as a first-class segmentation chip.

---

## 8. 🎨 CARD UI REDESIGN (MAIN PART)

### 8.1 Card Structure

#### Default AnalysisCard

- Header:
- Left: IOC (monospace, truncated)
- Right: Verdict badge (malicious/suspicious/clean/undetected)
- Subheader row:
- Type chip
- Source chip
- Time stamp

- Body:
- Metric row 1: malicious count, suspicious count, clean count
- Metric row 2: risk score, severity, confidence (if available)
- Context row:
- primary label or filename
- secondary metadata (file size, threat family count)

- Footer:
- Left: top 2 threat categories chips
- Right actions: View Details, Copy IOC

#### Expanded side content

- Keep right-side detail panel pattern, but use selected record id and type + ioc, not ioc string alone.

### 8.2 Data → Card Mapping

| Data Field | Card Element | Notes |
|---|---|---|
| ioc | Card title | Monospace + tooltip |
| verdict | Badge color and label | semantic color map |
| type | Type chip | uppercase |
| source | Source chip | file/search icon mapping |
| searchedAt | Header meta | relative and absolute timestamp |
| stats.malicious | Metric chip | red |
| stats.suspicious | Metric chip | amber |
| stats.harmless | Metric chip | green |
| metadata.riskScore | Risk meter | hide when null |
| severity | Severity chip | if unknown, muted |
| threatTypes | Footer chips | show first 2 + overflow counter |
| familyLabels | Footer chips | optional secondary line |
| label | Analysis summary text | fallback to type label |
| metadata.filename | Analysis summary primary for file source | highest precedence for file_analysis |
| metadata.filesize | Summary secondary | formatted KB/MB |

### 8.3 Card Variants

- Default card:
- Standard result card for most records.

- Highlighted card:
- Trigger when verdict is malicious OR riskScore >= 70.
- Adds left accent border and high-priority background tint.

- Compact card (mobile):
- Single-column compressed metrics.
- Collapsible details section for threat chips and secondary metadata.

### 8.4 Layout System

- Desktop grid:
- xl and above: 3 columns
- lg: 2 columns
- md and below: 1 column

- Breakpoints:
- sm: 640
- md: 768
- lg: 1024
- xl: 1280
- 2xl: 1536

- Spacing rules:
- Grid gap: 16 on md, 20 on lg+, 12 on mobile.
- Card padding: 16 mobile, 20 desktop.
- Internal metric blocks: 8 vertical rhythm.

---

## 9. ⚙️ Logic Changes for Card UI

### Search with cards

- Keep existing debounced search behavior (500ms).
- Move query state into a dedicated hook useHistoryQueryState to centralize all params.
- Sync query state to URL params for shareable filtered views.

### Filter behavior

- Add actual source filter UI control and wire onSourceFilterChange.
- Use a single query object to avoid multi-effect race conditions.
- Reset page to 1 on any filter/query/pageSize change.

### Pagination / infinite scroll

- Phase 1 (safe migration): keep server pagination footer.
- Phase 2 (optional): add infinite scroll via IntersectionObserver.
- For infinite mode, maintain API page param and append records until hasNextPage false.

### Selection behavior

- Replace selectedIOC with selectedRecordKey = type::ioc or record id.
- Prevent collisions where same IOC string exists in multiple types.

---

## 10. 🔁 Interactions

- Hover effects:
- Card elevate with subtle translateY(-2px) and border-color emphasis.
- Show quick actions only on hover for desktop.

- Click behavior:
- Card click opens detail panel.
- Separate action buttons stop propagation and handle copy/export.

- Sorting options:
- Add sort dropdown in filter bar with:
- Newest first (searched_at desc)
- Oldest first (searched_at asc)
- Highest risk first (metadata.riskScore desc, fallback 0)
- Most malicious detections (stats.malicious desc)

---

## 11. 📂 File Structure for Refactor

```text
src/app/history/
  HistoryPageView.tsx
  page.tsx
  components/
    HistoryFilters.tsx
    HistoryStats.tsx
    IOCDetailPanel.tsx
    MyAnalysesTable.tsx
    types.ts
    cards/
      AnalysisCard.tsx
      AnalysisCardCompact.tsx
      AnalysisCardHighlighted.tsx
      AnalysisCardMetrics.tsx
      AnalysisCardMeta.tsx
    grid/
      AnalysisCardGrid.tsx
      EmptyState.tsx
      LoadingSkeletonGrid.tsx
  hooks/
    useHistoryRecords.ts
    useHistoryQueryState.ts
  utils/
    historyFormatters.ts
    historyMappers.ts
```

---

## 12. 🚀 REBUILD PLAN

1. Extract data layer.
- Create useHistoryRecords hook wrapping fetch, loading, errors, pagination, export.
- Centralize query build logic in one place.

2. Build card component primitives.
- Implement AnalysisCard + Metrics + Meta subcomponents.
- Add strict prop contracts mapped from IOCRecord.

3. Replace table with responsive grid.
- Introduce AnalysisCardGrid.
- Keep existing pagination footer for first release.

4. Connect search + filters.
- Add source filter control.
- Keep 500ms search debounce.
- Add optional sort control and API param support.

5. Detail panel alignment.
- Update selected key logic to type::ioc.
- Normalize detail payload in mapper so multi-source sections render from one stable shape.

6. Performance and quality hardening.
- Memoize mapped cards.
- Virtualize large lists in grid mode if page size > 50.
- Add component tests for filter/search/pagination behavior.

7. Rollout strategy.
- Feature-flag card layout.
- A/B internal QA against table layout.
- Remove table after parity validation.

---

## 13. 💡 IMPROVEMENTS (IMPORTANT)

### New insights from hidden data

- Show confidence and cache TTL badges to communicate reliability and freshness.
- Display threat family chips and suggested threat label inline for faster triage.
- Show source chip segmentation (file analysis vs IOC search) for immediate context.

### Better UX patterns

- URL-synced filters to preserve analyst workspace state.
- Keyboard navigation between cards and detail panel.
- Unified empty/loading/error card states.

### Performance upgrades

- Co-locate fetch and transform logic in hook to reduce re-renders.
- Derive stats from full filtered total endpoint (or dedicated stats endpoint), not current page rows.
- Optional virtualization for high page sizes.

### Cleaner architecture

- Introduce mapper layer to normalize API records to view model before rendering.
- Keep presentation components stateless and pure.
- Separate query state, network calls, and rendering concerns.

---

## Implementation Notes and Risks

- Known bug: source filter missing in UI component contract even though backend supports it.
- Known mismatch: detail panel checks top-level multi-source fields not guaranteed by detail endpoint.
- Backend caveat: list endpoint deduplicates by value+type via aggregation group, which may hide repeated analysis instances.
- Stats caveat: header stats currently reflect only current page records, not full filtered dataset distribution.
