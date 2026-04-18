# Dashboard System Audit, Rebuild, and Improvement Specification

This document is based on implementation-level analysis of the current codebase.

Scope covered:
- UI layer: dashboard route, layout, chart components
- Data layer: API routes, lib functions/services/models/utilities
- Business logic: aggregation, normalization, scoring, rendering logic

Assumptions:
- Live API payload samples were not executed in this run; example values are marked assumed.
- Usage references are based on import graph and direct code reads.

---

## 1. 📍 Route & Entry Point

- Route/path: `/dashboard`
- Entry file: `src/app/dashboard/page.tsx`
- Rendering type: Hybrid
  - Server route shell: `src/app/dashboard/page.tsx`
  - Client runtime: `src/app/dashboard/DashboardPageView.tsx` (`"use client"`)

Dashboard route runtime wrappers:
- `src/app/layout.tsx` -> `src/app/ClientLayout.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/components/ProtectedPage.tsx` (auth gate)

---

## 2. 🧱 Component Structure

### Full component tree

- `src/app/layout.tsx` (RootLayout)
- `src/app/ClientLayout.tsx` (AuthProvider + SidebarProvider + MainLayout)
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- Dashboard branch:
  - `src/app/dashboard/page.tsx`
  - `src/app/dashboard/DashboardPageView.tsx`
  - `src/components/ProtectedPage.tsx`
  - `src/app/dashboard/components/DashboardHeader.tsx`
  - `src/app/dashboard/components/ThreatTrendChart.tsx`
  - `src/app/dashboard/components/ThreatSeverityChart.tsx`
  - `src/app/dashboard/components/IOCTypeDistributionChartNew.tsx`
  - `src/app/dashboard/components/FileAnalysisGraphCompact.tsx`
  - `src/app/dashboard/components/ThreatTypePieChartModern.tsx`
  - `src/app/dashboard/components/GeographicDistributionChartNew.tsx`
  - `src/app/dashboard/components/MalwareFamiliesChartNew.tsx`
  - `src/app/dashboard/components/TopThreatsGraph.tsx`
  - Shared in dashboard cards:
    - `src/app/dashboard/components/TimeFilterDropdown.tsx`
    - `src/components/NoGraphData.tsx`
    - `src/components/ui/card.tsx`
    - `src/components/ui/badge.tsx`

### Reusable vs specific

Reusable/common:
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/ProtectedPage.tsx`
- `src/components/ui/*`
- `src/components/NoGraphData.tsx`

Dashboard-specific:
- `src/app/dashboard/*`

Dashboard-related but not rendered in current `DashboardPageView`:
- `src/app/dashboard/components/DetectionEnginePerformanceChartNew.tsx`
- `src/app/dashboard/components/RiskScoreTrend.tsx`
- `src/app/dashboard/components/RealTimeThreatFeed.tsx`

---

## 3. 🔌 Data Sources & Flow

### ALL API endpoints used by dashboard runtime

Primary:
- `GET /api/dashboard-v2?range={daily|weekly|monthly}[&force=true]`

Supporting auth/session paths used by shell contexts:
- `GET /api/auth/me` (AuthContext session verify)
- `POST /api/auth/logout` (logout)

Data backend behind dashboard API:
- MongoDB via models:
  - `src/lib/models/IocUserHistory.ts`
  - `src/lib/models/IocCache.ts`

### Fetch methods

- Client fetch wrapper: `apiFetch` (`src/lib/apiFetch.ts`), internally uses native `fetch`
- No React Query/SWR used in dashboard cards

### Data load timing

- `DashboardPageView` parent:
  - initial load fetch for `stats`
  - 30s polling for header stats (`setInterval`)
- `DashboardHeader`:
  - fetch on mount
  - fetch when local `timeRange` changes
- Each chart card:
  - fetch on mount
  - fetch when local `timeRange` changes

Important behavior:
- Time ranges are component-local, not globally synchronized.
- Multiple parallel requests are sent to the same endpoint during initial render.

---

## 4. 📦 LIB FOLDER DEEP ANALYSIS (CRITICAL)

### 4.1 File Mapping (ALL files in `src/lib`)

| File | Purpose |
|---|---|
| src/lib/apiFetch.ts | Global client fetch wrapper + 401 logout trigger |
| src/lib/auth.ts | JWT generation/verification + auth response helpers |
| src/lib/colors.ts | Theme tokens for app/charts/components |
| src/lib/crypto-polyfill.ts | Browser crypto polyfill side-effects |
| src/lib/db.ts | MongoDB connection caching and db access |
| src/lib/detect.ts | IOC detection/normalization utilities |
| src/lib/fallback-analysis.ts | Heuristic fallback when threat APIs unavailable |
| src/lib/features.ts | Feature flags |
| src/lib/ioc-cache.ts | IOC cache + history CRUD in Mongo |
| src/lib/loaders.ts | Shared loading style token objects |
| src/lib/network-diagnostic.ts | Deprecated/commented network diagnostics |
| src/lib/normalize.ts | VT normalization + threat extraction helpers |
| src/lib/risk.ts | Legacy unified risk scoring helper |
| src/lib/routes.ts | Public-route and route normalization helpers |
| src/lib/typography.ts | Typography token system |
| src/lib/utils.ts | `cn` utility (clsx + tailwind-merge) |
| src/lib/validators.ts | Zod schemas + IOC validation/detection/scoring |
| src/lib/cache/cache-ttl.ts | TTL policy utilities and constants |
| src/lib/models/IocCache.ts | IocCache mongoose schema/model |
| src/lib/models/IocUserHistory.ts | User history mongoose schema/model |
| src/lib/models/User.ts | User mongoose schema/model + password compare |
| src/lib/threat-intel/index.ts | Threat-intel public export barrel |
| src/lib/threat-intel/clients/base.client.ts | Threat client interface + base class |
| src/lib/threat-intel/clients/greynoise.client.ts | GreyNoise API client |
| src/lib/threat-intel/clients/ipqs.client.ts | IPQS API client |
| src/lib/threat-intel/clients/malwarebazaar.client.ts | MalwareBazaar API client |
| src/lib/threat-intel/clients/threatfox.client.ts | ThreatFox API client |
| src/lib/threat-intel/clients/urlhaus.client.ts | URLhaus API client |
| src/lib/threat-intel/clients/vt.client.ts | VT client adapter using `vtClient` |
| src/lib/threat-intel/config/sources.config.ts | Source capability/weight/enablement config |
| src/lib/threat-intel/normalizers/base.normalizer.ts | Normalizer interface + common helpers |
| src/lib/threat-intel/normalizers/greynoise.normalizer.ts | GreyNoise normalization |
| src/lib/threat-intel/normalizers/ipqs.normalizer.ts | IPQS normalization |
| src/lib/threat-intel/normalizers/malwarebazaar.normalizer.ts | MalwareBazaar normalization |
| src/lib/threat-intel/normalizers/threatfox.normalizer.ts | ThreatFox normalization |
| src/lib/threat-intel/normalizers/urlhaus.normalizer.ts | URLhaus normalization |
| src/lib/threat-intel/normalizers/vt.normalizer.ts | VT normalization |
| src/lib/threat-intel/orchestrator/extractors.ts | VT extraction helpers (stats, file info, MITRE, etc.) |
| src/lib/threat-intel/orchestrator/multi-source.orchestrator.ts | Main multi-source orchestration and response formatter |
| src/lib/threat-intel/orchestrator/threat-intel.orchestrator.ts | Alternate/partial orchestrator (contains TODO placeholders) |
| src/lib/threat-intel/services/ioc-analyzer.service.ts | Main IOC analysis entry service |
| src/lib/threat-intel/services/ip-reputation.service.ts | Geolocation + AbuseIPDB enrichment |
| src/lib/threat-intel/services/risk-scoring.service.ts | IP/non-IP scoring and risk detail mapping |
| src/lib/threat-intel/services/vt-extractor.service.ts | Extract file/detection/MITRE/sandbox from VT structures |
| src/lib/threat-intel/types/storage.types.ts | Storage document interface |
| src/lib/threat-intel/types/threat-intel.types.ts | Core threat-intel type system |
| src/lib/threat-intel/utils/api-key-manager.ts | API key rotation/blacklist management |
| src/lib/virustotal/vt-client.ts | Client-side VT service wrapper to API |
| src/lib/virustotal/vt-orchestrator.ts | Advanced VT orchestrator + graph relationship fetchers |
| src/lib/virustotal/vt.ts | Enhanced VT client wrapper + singleton export |

### 4.2 Function Inventory (by file)

Notes:
- Includes executable exports (functions/classes/public methods).
- For files exporting only types/constants, this is stated explicitly.
- Usage is shown as where imported/consumed in app/components/routes.

#### src/lib/apiFetch.ts
- Function: `apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response>`
- Logic: wraps `fetch`; on `401` dispatches `auth:logout` event and throws.
- Used in:
  - Dashboard page and all dashboard cards
  - `src/contexts/AuthContext.tsx`
  - history/file-analysis/contact/auth forms
  - IP reputation service (`src/lib/threat-intel/services/ip-reputation.service.ts`)
  - VT client wrapper (`src/lib/virustotal/vt-client.ts`)

#### src/lib/auth.ts
- `generateToken(userId: string, username: string, role?: 'user'|'admin'): string`
- `verifyToken(token: string): JwtPayload | null`
- `getTokenFromRequest(req: NextRequest): string | null`
- `verifyAuth(req: NextRequest): Promise<JwtPayload | null>`
- `isAdmin(payload: JwtPayload | null): boolean`
- `unauthorizedResponse(): NextResponse`
- `forbiddenResponse(message?: string): NextResponse`
- Used in: auth routes, `dashboard-v2`, `history-v2`, `ioc-v2`, `file-analysis-v2` route guards.

#### src/lib/db.ts
- Default export: `connectDB(): Promise<typeof mongoose>`
- `getDatabase(): Promise<Db>`
- Logic: global-cached mongoose connection with masked URI logging.
- Used in: auth routes, health routes, `dashboard-v2`, `history-v2`, cache layer.

#### src/lib/detect.ts
- `extractBaseDomain(ioc: string): string`
- `domainsMatch(inputDomain: string, whitelistDomain: string): boolean`
- `normalizeIOC(ioc: string, type?: IOCType): string`
- `detectIOCType(ioc: string): IOCType`
- `getHashType(hash: string): 'md5'|'sha1'|'sha256'|null`
- `validateIOCList(iocs: string[]): { valid: ...; invalid: ... }`
- Usage: utility layer; IOC parsing/normalization flows (explicit and inferred).

#### src/lib/fallback-analysis.ts
- `performFallbackAnalysis(ioc: string, type: string): FallbackAnalysisResult`
- `createFallbackVTResult(ioc: string, type: string): any`
- Logic: heuristic suspicion from ranges/domain patterns.
- Usage: fallback path when upstream data unavailable (assumed, low direct import visibility).

#### src/lib/features.ts
- Executable functions: none.
- Exports constants: `FEATURES`.
- Usage: analyze UI gating imports.

#### src/lib/ioc-cache.ts
- `getIOCFromCache(ioc: string, type: string)`
- `saveIOCAnalysis(input: SaveIOCAnalysisInput)`
- `recordUserHistory(params: {...}): Promise<void>`
- `getUserHistory(filters: UserHistoryFilters)`
- `getLatestHistoryRecord(userId: string, value: string)`
- Logic:
  - read/write cache doc with TTL (`expiresAt`)
  - write user history record with metadata
  - paginated/filterable history retrieval
- Used in:
  - `src/app/api/ioc-v2/route.ts`
  - `src/app/api/history-v2/[ioc]/route.ts`
  - `src/app/api/file-analysis-v2/services/analysis-engine-v2.ts`
  - threat-intel IOC analyzer service

#### src/lib/loaders.ts
- Executable functions: none.
- Exports constants: `LOADING_STYLES`, `LOADING_CONTAINER`.
- Used in: chart/table/loading skeleton UI components.

#### src/lib/network-diagnostic.ts
- No active exports; file is fully commented/deprecated.

#### src/lib/normalize.ts
- `normalizeVTResponse(vtData: VTRawData): VTNormalized`
- `extractThreatIntelligence(attrs): { threatTypes; detections }`
- `getVerdictColor(verdict: Verdict): string`
- `getVerdictText(verdict: Verdict): string`
- `getSeverityLevel(stats): 'critical'|'high'|'medium'|'low'|'unknown'`
- `getThreatTypeColor(threatType: string): string`
- `getThreatTypeIcon(threatType: string): string`
- Logic: VT map/filter/score helpers with threat keyword extraction.
- Used in: VT normalization/analysis display flows (direct + inferred).

#### src/lib/risk.ts
- `computeUnifiedRisk(vt: VTReduced | null, abuse: AbuseReduced | null): UnifiedRisk`
- Logic: legacy blended VT + AbuseIPDB score mapping.
- Used in: appears superseded by `risk-scoring.service.ts` (low/legacy use).

#### src/lib/routes.ts
- `normalizeRoute(path: string): string`
- `isPublicRoute(path: string): boolean`
- Constants: `PUBLIC_ROUTES`
- Used in: `src/components/layout/MainLayout.tsx` route access behavior.

#### src/lib/typography.ts
- Executable functions: none.
- Exports constants: `TYPOGRAPHY` token object.
- Used across dashboard/analyze/file-analysis/history/layout.

#### src/lib/utils.ts
- `cn(...inputs: ClassValue[]): string`
- Used in: many `src/components/ui/*` components.

#### src/lib/validators.ts
- Schemas: `SubmitIOCRequestSchema`, `DetectionSchema`, `VTNormalizedSchema`, `ThreatIntelSchema`, `IOCRecordSchema`, `SubmitIOCResponseSchema`, `IOCQuerySchema`
- Functions:
  - `detectIOCType(ioc: string): IOCType`
  - `validateIOC(ioc: string, type?: IOCType): { valid: boolean; error?: string }`
  - `getVerdictScore(verdict: Verdict): number`
  - `getSeverityScore(severity?: string): number`
- Used in:
  - `src/app/api/ioc-v2/route.ts`
  - threat-intel service layer (`ioc-analyzer.service.ts` uses detectIOCType)

#### src/lib/cache/cache-ttl.ts
- `getCacheTTL(iocType: IOCType, source?: string): number`
- `getCacheTTLConfig(iocType: IOCType): CacheTTLConfig`
- `isCacheExpired(lastAnalyzedAt, ttlSeconds): { expired, ageSeconds, ... }`
- `formatCacheLog(ioc, status, details?): string`
- `formatTTLDuration(seconds: number): string`
- `validateTTL(ttl, min?, max?): number`
- `getTTLFromEnv(iocType: IOCType): number`
- Constants: `TTL`
- Used in:
  - `src/app/api/ioc-v2/route.ts`
  - `src/app/api/file-analysis-v2/services/analysis-engine-v2.ts`
  - `src/lib/threat-intel/services/ioc-analyzer.service.ts`

#### src/lib/models/IocCache.ts
- Runtime exports: mongoose model `IocCache`.
- Data role: persisted cache with TTL index.
- Used in: dashboard/history API aggregation, IOC routes, cache service.

#### src/lib/models/IocUserHistory.ts
- Runtime exports: mongoose model `IocUserHistory`.
- Data role: user IOC search/audit history.
- Used in: dashboard/history APIs and cache service.

#### src/lib/models/User.ts
- Runtime exports: mongoose model `User` + password compare method.
- Used in: auth login/register, file-analysis dynamic user load.

#### src/lib/threat-intel/index.ts
- Re-export barrel of services, clients, normalizers, orchestrator helpers, types.
- Usage: convenience import path; direct imports typically target specific files.

#### src/lib/threat-intel/clients/base.client.ts
- Interface `ThreatIntelClient`
- Abstract class `BaseThreatIntelClient`
  - `query(...)`
  - `isAvailable()`
  - `getQuota()`
  - helpers: `supportsIOCType`, `createErrorResult`, `createSuccessResult`
- Used by all threat-intel client implementations.

#### src/lib/threat-intel/clients/vt.client.ts
- Class `VirusTotalClient extends BaseThreatIntelClient`
  - `query(iocValue, iocType): Promise<ClientResult>`
  - `isAvailable(): Promise<boolean>`
  - `getQuota(): Promise<number>`
- Uses singleton `vtClient.lookupIOCEnhanced`.
- Used in: multi-source orchestrator, health-threat-intel route.

#### src/lib/threat-intel/clients/greynoise.client.ts
- Class `GreyNoiseClient`
  - `query(iocValue, iocType)` via `axios.get('https://api.greynoise.io/v3/community/{ip}')`
  - `isAvailable()`
- Uses API key manager for key rotation.

#### src/lib/threat-intel/clients/ipqs.client.ts
- Class `IPQSClient`
  - `query(iocValue, iocType)` via IPQS GET endpoint
  - `isAvailable()`
- Endpoint templates:
  - `https://ipqualityscore.com/api/json/ip/{key}/{value}`
  - `https://ipqualityscore.com/api/json/url/{key}/{encoded}`

#### src/lib/threat-intel/clients/malwarebazaar.client.ts
- Class `MalwareBazaarClient`
  - `query(iocValue, iocType)` via `POST https://mb-api.abuse.ch/api/v1/`
  - `isAvailable()`
- Form payload: `query=get_info&hash={ioc}`

#### src/lib/threat-intel/clients/threatfox.client.ts
- Class `ThreatFoxClient`
  - `query(iocValue, iocType)` via `POST https://threatfox-api.abuse.ch/api/v1/`
  - `isAvailable()`
- Form payload: `query=search_ioc&search_term={ioc}`

#### src/lib/threat-intel/clients/urlhaus.client.ts
- Class `URLhausClient`
  - `query(iocValue, iocType)` via `POST https://urlhaus-api.abuse.ch/v1/url/`
  - `isAvailable()`
- Form payload: `url={encodedURL}`

#### src/lib/threat-intel/config/sources.config.ts
- `getSourcesForIOCType(iocType: string): SourceConfig[]`
- `getRequiredSources(): SourceConfig[]`
- `getEnabledSources(): SourceConfig[]`
- `hasMinimumSources(iocType: string): boolean`
- Exports constants: `SOURCES` weights/priorities/support matrix.
- Used by orchestrator/config decisions (direct/inferred).

#### src/lib/threat-intel/normalizers/base.normalizer.ts
- Interface `ThreatDataNormalizer`
- Abstract class `BaseNormalizer`
  - `normalize(result)` abstract
  - helper methods: `createUnavailableResponse`, `determineVerdict`, `cleanArray`, `scoreToSeverity`

#### src/lib/threat-intel/normalizers/vt.normalizer.ts
- Class `VTNormalizer`
  - `normalize(result: ClientResult): UnifiedThreatData`
- Logic:
  - pull stats from multiple VT response shapes
  - compute score and confidence
  - normalize threat types/detections/family labels

#### src/lib/threat-intel/normalizers/greynoise.normalizer.ts
- Class `GreyNoiseNormalizer`
  - `normalize(result): UnifiedThreatData`
- Logic: RIOT handling, classification to score/verdict mapping.

#### src/lib/threat-intel/normalizers/ipqs.normalizer.ts
- Class `IPQSNormalizer`
  - `normalize(result): UnifiedThreatData`
- Logic: fraud score boosts for tor/vpn/phishing/malware/recent_abuse.

#### src/lib/threat-intel/normalizers/malwarebazaar.normalizer.ts
- Class `MalwareBazaarNormalizer`
  - `normalize(result): UnifiedThreatData`
- Logic: known hash -> high malicious score; not found -> clean.

#### src/lib/threat-intel/normalizers/threatfox.normalizer.ts
- Class `ThreatFoxNormalizer`
  - `normalize(result): UnifiedThreatData`
- Logic: confidence-based score + C2/payload_delivery boosts.

#### src/lib/threat-intel/normalizers/urlhaus.normalizer.ts
- Class `URLhausNormalizer`
  - `normalize(result): UnifiedThreatData`
- Logic: online URL status increases score; extracts payload signatures.

#### src/lib/threat-intel/orchestrator/extractors.ts
- Class `VTDataExtractor` static methods:
  - `extractDetectionStats`
  - `extractFileInfo`
  - `extractThreatClassification`
  - `extractCommunityVotes`
  - `extractSubmissionInfo`
  - `extractPackers`
  - `extractDetectItEasy`
  - `extractELFInfo`
  - `extractYARAMatches`
  - `extractDetections`
  - `extractSandboxAnalysis`
- Used in: `threat-intel.orchestrator.ts` and VT-centric processing paths.

#### src/lib/threat-intel/orchestrator/multi-source.orchestrator.ts
- Class `MultiSourceOrchestrator`
  - `analyzeIOC(ioc, iocType): Promise<IOCAnalysisResult>`
  - private internals: `querySource`, `storeSourceData`, `aggregateResults`, `extractSeverity`, `severityToVerdict`
- Exported helpers:
  - `formatIOCResponse(result, cached?): any`
  - `createErrorResult(ioc, iocType, error): any`
- Logic:
  - parallel multi-client query
  - per-source normalization
  - severity aggregation
  - hash-specific enrichment (MITRE/sandbox/family labels)
  - rich `multiSourceData` output
- Used in:
  - `src/app/api/ioc-v2/route.ts`
  - `src/app/api/file-analysis-v2/services/analysis-engine-v2.ts`
  - health threat-intel route

#### src/lib/threat-intel/orchestrator/threat-intel.orchestrator.ts
- Class `ThreatIntelOrchestrator`
  - `analyzeIOC(iocValue, iocType, userId?)`
  - private: `transformToStorageFormat`, `extractMalwareFamilies`, `extractAllTags`, `buildVTLink`, `queryAllSources` (TODO), `aggregateResults` (TODO)
- Status: partially implemented/placeholder TODO sections.

#### src/lib/threat-intel/services/ioc-analyzer.service.ts
- `analyzeIOC(ioc, label?, userId?): Promise<IOCAnalysisResult>`
- `analyzeIOCBatch(iocs, label?, userId?): Promise<IOCAnalysisResult[]>`
- Internal: `enrichIPData(result)`
- Logic:
  - detect IOC type
  - orchestrator analyze
  - IP geolocation + abuse enrichment
  - save cache/history with TTL
- Used in:
  - `src/app/api/ioc-v2/route.ts`
  - `src/app/api/health-threat-intel/route.ts`

#### src/lib/threat-intel/services/ip-reputation.service.ts
- `getGeolocationData(ip): Promise<GeolocationData | null>`
- `checkAbuseIPDB(ip): Promise<AbuseIPDBData | null>`
- Internal helper: `fetchWithRetry(url, options, maxRetries, timeout)`
- Endpoint usage:
  - internal geolocation provider from `IP_GEOLOCATION_API_URL`
  - fallback `http://ip-api.com/json/{ip}`
  - AbuseIPDB `https://api.abuseipdb.com/api/v2/check?...`

#### src/lib/threat-intel/services/risk-scoring.service.ts
- `calculateIPRiskScore(multiSourceData, abuseData): RiskScoreResult`
- `calculateVTScore(stats): number`
- `calculateNonIPSeverity(multiSourceData, vtStats?): RiskScoreResult`
- `getRiskLevelDetails(level, score): RiskDetails`
- Logic: weighted source blending + threshold mapping to level/verdict/severity.

#### src/lib/threat-intel/services/vt-extractor.service.ts
- `extractFileInfo(vtResult, hash): FileInfo | null`
- `extractDetections(vtResult): Detection[]`
- `extractFamilyLabels(vtResult): string[]`
- `determinePopularThreat(detections, familyLabels): string | null`
- `parseMitreAttack(mitreData): MitreAttackData | null`
- `generateSandboxData(maliciousCount): any`
- Used in: multi-source orchestrator hash enrichment.

#### src/lib/threat-intel/types/storage.types.ts
- Executable functions: none.
- Exports interface: `IOCStorageDocument`.

#### src/lib/threat-intel/types/threat-intel.types.ts
- Executable functions: none.
- Exports core type/interface contracts for whole threat stack.

#### src/lib/threat-intel/utils/api-key-manager.ts
- Singleton export: `apiKeyManager`
- Public methods:
  - `getNextKey(service): string | null`
  - `reportFailure(service, apiKey): void`
  - `reportSuccess(service, apiKey): void`
  - `getStats(service): KeyRotationStats & { totalKeys; availableKeys }`
  - `reloadKeys(): void`
- Used in: IP reputation + IPQS/GreyNoise clients.

#### src/lib/virustotal/vt.ts
- Class `EnhancedVirusTotalClient` public methods:
  - `lookupIOCEnhanced(ioc, type)`
  - `lookupIOC(ioc, type)`
  - `getStats()`
  - `clearCache()`
  - `runQueue()`
  - `isConfigured()`
  - `fetchCodeInsights(fileHash)`
  - `fetchMitreAttack(fileHash)`
  - `fetchGraphSummary(fileHash)`
  - `fetchFileRelationships(fileHash, relationship)`
- Exports:
  - `EnhancedVirusTotalClient`
  - singleton `vtClient`
  - `isVirusTotalConfigured()`
- Used by: threat-intel VT client adapter.

#### src/lib/virustotal/vt-client.ts
- Class `ClientVirusTotalService`
  - `analyzeIOC(ioc, type): Promise<VTAnalysisResult>`
  - `analyzeBatch(iocs, onProgress?)`
  - static `summarizeResults(results)`
- Uses `apiFetch` against `/api/ioc` endpoint.
- Usage: client-side VT interaction paths (legacy/auxiliary).

#### src/lib/virustotal/vt-orchestrator.ts
- Exported class `VirusTotalClient`
  - `lookupIndicator(indicator, options?)`
  - `fetchAllFileRelationships(fileHash)`
  - `fetchAllDomainRelationships(domain)`
  - `fetchAllIPRelationships(ip)`
  - `fetchAllURLRelationships(url)`
  - `buildGraph(indicator, type?)`
  - `fetchCodeInsights(fileHash)`
  - `fetchMitreAttack(fileHash)`
  - `fetchGraphSummary(fileHash)`
  - `fetchFileRelationships(fileHash, relationship)`
  - `getStats()`
  - `runQueue()`
  - `clearCache()`
- Supports relationship graph retrieval and throttled request queueing.

### 4.3 API Wrappers / Services (lib)

#### Internal app API wrappers

- `src/lib/apiFetch.ts`
  - method: generic wrapper over `fetch`
  - auth logic: if 401 -> broadcast `auth:logout`

- `src/lib/virustotal/vt-client.ts`
  - endpoint: `/api/ioc`
  - methods:
    - POST for single/batch IOC analysis
  - headers: `Content-Type: application/json`

#### External threat intelligence/reputation APIs

- VirusTotal v3 (in `src/lib/virustotal/vt-orchestrator.ts`)
  - base: `https://www.virustotal.com/api/v3`
  - auth: `x-apikey`
  - methods: GET

- GreyNoise (`src/lib/threat-intel/clients/greynoise.client.ts`)
  - GET `https://api.greynoise.io/v3/community/{ip}`
  - header auth: `key`

- IPQualityScore (`src/lib/threat-intel/clients/ipqs.client.ts`)
  - GET `https://ipqualityscore.com/api/json/ip/{key}/{value}`
  - GET `https://ipqualityscore.com/api/json/url/{key}/{value}`

- MalwareBazaar (`src/lib/threat-intel/clients/malwarebazaar.client.ts`)
  - POST `https://mb-api.abuse.ch/api/v1/`
  - form body: `query=get_info&hash={ioc}`
  - header auth: `Auth-Key`

- ThreatFox (`src/lib/threat-intel/clients/threatfox.client.ts`)
  - POST `https://threatfox-api.abuse.ch/api/v1/`
  - form body: `query=search_ioc&search_term={ioc}`
  - header auth: `Auth-Key`

- URLhaus (`src/lib/threat-intel/clients/urlhaus.client.ts`)
  - POST `https://urlhaus-api.abuse.ch/v1/url/`
  - form body: `url={encoded}`
  - header auth: `Auth-Key`

- Geolocation and abuse enrichment (`src/lib/threat-intel/services/ip-reputation.service.ts`)
  - internal: `${IP_GEOLOCATION_API_URL}/{ip}`
  - fallback geolocation: `http://ip-api.com/json/{ip}?fields=...`
  - AbuseIPDB: `https://api.abuseipdb.com/api/v2/check?...`

### 4.4 Data Transformations

Key mapping/filtering/aggregation in lib:

- IOC parsing/normalization:
  - `detect.ts` and `validators.ts` map raw IOC strings to canonical types/forms.

- Threat source normalization:
  - `threat-intel/normalizers/*` convert source-native payloads into `UnifiedThreatData`.

- Severity/score synthesis:
  - `risk-scoring.service.ts`:
    - weighted source aggregation for IP
    - VT-based non-IP severity scoring

- VT extraction and enrichment:
  - `vt-extractor.service.ts` and `orchestrator/extractors.ts` map raw VT nested fields into:
    - stats
    - detections
    - families
    - MITRE
    - sandbox
    - file metadata

- Cache/history shaping:
  - `ioc-cache.ts` builds minimal analysis fallback for thin cache docs and writes normalized history rows.

- Dashboard API transformation (`src/app/api/dashboard-v2/route.ts`, fed by lib models/types):
  - verdict and severity bucketing
  - daily trend bucketing
  - threat vectors from `analysis.threatIntel.threatTypes`
  - geo aggregation from `analysis.reputation.geolocation`
  - file type aggregation from history metadata

### 4.5 UNUSED / HIDDEN DATA (VERY IMPORTANT)

Data present in API/lib but not fully surfaced in dashboard UI:

- `/api/dashboard-v2` hidden fields:
  - `stats.cleanIOCs`, `stats.suspiciousIOCs`, `stats.pendingIOCs`, `stats.trends`
  - `threatIntelligence.bySeverity`
  - `detectionEngines` (chart exists but currently not mounted)
  - `mitreAttack` object (currently static empty payload)
  - `timeRange`, `daysIncluded`, `startDate`, `endDate`, `cachedAt`, `dataVersion`, `privacyMode`

- Rich IOC response (from `formatIOCResponse`) not represented in dashboard cards:
  - `multiSourceData.greynoise/ipqs/malwarebazaar/threatfox/urlhaus`
  - expanded `vtData` fields (popular threat classification, network/file/domain fields)
  - sandbox verdict details and MITRE structures

- Dormant/underused module opportunities:
  - `risk.ts` legacy score model can be retired or compared for A/B scoring
  - `network-diagnostic.ts` commented diagnostics can be converted to an admin troubleshoot panel
  - `vt-orchestrator` graph relationship APIs appear underused in dashboard

---

## 5. 📊 Data Structure (GLOBAL VIEW)

```json
{
  "auth": {
    "jwtPayload": {
      "userId": "string",
      "username": "string",
      "role": "user|admin"
    }
  },
  "dashboard": {
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
        "type": "string",
        "count": "number",
        "percentage": "number",
        "color": "string"
      }
    ],
    "iocTypeDistribution": [
      {
        "type": "string",
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
    ]
  },
  "iocAnalysis": {
    "ioc": "string",
    "type": "ip|domain|url|hash",
    "verdict": "malicious|suspicious|clean|unknown|whitelisted|error",
    "severity": "critical|high|medium|low|clean|unknown",
    "stats": {
      "malicious": "number",
      "suspicious": "number",
      "harmless": "number",
      "undetected": "number"
    },
    "threatIntel": {
      "threatTypes": ["string"],
      "detections": [
        {
          "engine": "string",
          "category": "string",
          "result": "string"
        }
      ],
      "confidence": "number"
    },
    "multiSourceData": {
      "greynoise": "object|null",
      "ipqs": "object|null",
      "malwarebazaar": "object|null",
      "threatfox": "object|null",
      "urlhaus": "object|null"
    }
  },
  "persistence": {
    "iocCache": {
      "value": "string",
      "type": "ip|domain|url|hash",
      "analysis": "IOCAnalysisResult",
      "expiresAt": "date"
    },
    "iocUserHistory": {
      "userId": "string",
      "value": "string",
      "type": "ip|domain|url|hash",
      "searched_at": "date",
      "metadata": {
        "filename": "string",
        "filesize": "number",
        "filetype": "string"
      }
    }
  }
}
```

---

## 6. 📈 Graph & Visualization Mapping

### ThreatTrendChart
- Type: Line chart
- Library: Recharts
- Data source: `/api/dashboard-v2` -> `dailyTrends`
- X-axis: `dateLabel` (formatted from `displayTime`/`day`/`displayDate`)
- Y-axis: numeric count
- Y fields: `clean`, `threats`
- Transformations:
  - `threatRate` computation
  - trend direction from first-half vs second-half threats
  - line emphasis by hovered legend key

### ThreatSeverityChart
- Type: Stacked horizontal bar
- Library: Recharts
- Data source: `threatIntelligence`
- X-axis: counts
- Y-axis: single category row
- Series: `Critical`, `High`, `Medium`, `Low`
- Transformations: tile percentages from total

### IOCTypeDistributionChart
- Type: Donut + list
- Library: Recharts
- Data source: `iocTypeDistribution`
- Pie value: `count`
- Labels: `type`
- Transformations: total sum + per-type percentages

### FileAnalysisGraph
- Type: KPI cards + horizontal bar
- Library: Recharts
- Data source: `fileAnalysis`
- Y-axis category: `topFileTypes[].type`
- X-value: `topFileTypes[].count`
- Transformations: malicious/clean percentages + top-4 slice

### ThreatTypePieChart
- Type: Donut chart
- Library: ECharts (`echarts-for-react`)
- Data source: `threatTypes`
- Values: `count`
- Labels: `type` normalized (`Harmless` -> `Clean`)
- Transformations: sort descending by count, drop zero counts

### GeographicDistributionChart
- Type: Bar + country grid
- Library: Recharts
- Data source: `geoDistribution`
- X-axis: `country`
- Y-axis: `count`
- Transformations:
  - top 8 chart items, top 4 grid items
  - threat-rate color escalation based on `threatPercentage`

### MalwareFamiliesChart
- Type: Bar + list grid
- Library: Recharts
- Data source: `malwareFamilies`
- X-axis: `name`
- Y-axis: `count`
- Transformations: severity-color mapping, top slicing

### TopThreatsGraph
- Type: Horizontal bar
- Library: Recharts
- Data source: `threatVectors`
- X-axis: `count`
- Y-axis: `name`
- Transformations: filter `count > 0`, sort desc, top-8

### Dormant chart
- DetectionEnginePerformanceChart
  - Source: `detectionEngines`
  - Not mounted in current dashboard page

---

## 7. 🧠 Business Logic

### Server-side dashboard logic (`/api/dashboard-v2`)

- Auth + user scoping by JWT payload userId
- 30-second in-memory cache keyed by user + timeRange
- Range windows: daily=1, weekly=7, monthly=30 days
- Aggregations:
  - verdict counts and derived detection rate
  - severity counts from normalized severity
  - daily trend buckets (`total`, `threats`, `clean`)
  - threat vectors from `analysis.threatIntel.threatTypes`
  - geo distribution from IP geolocation fields
  - file analysis from history metadata + source/type filters
  - malware families from VT-derived fields
  - detection engine stats from detections arrays

### Threat-intel business logic (lib)

- Multi-source parallel querying and source normalization
- Weighted risk model for IPs
- VT-enhanced scoring for non-IP
- Severity to verdict conversion
- Cache + history write-through behavior after analysis
- Key-rotation and blacklisting for unstable API keys

### Derived metrics currently shown in dashboard

- Threat rate percentages
- Detection rates
- Severity distribution percentages
- Country threat percentages
- Type distribution percentages

---

## 8. ⚙️ State Management

### Local state

- Dashboard parent:
  - `headerStats`, `loading`, `error`, polling interval ref
- Every chart:
  - local `timeRange`
  - local `data`
  - local `loading`
  - hover state indexes/keys

### Global state

- `AuthContext`:
  - user, token, loading, auth flags
  - login/logout lifecycle + localStorage bootstrap
- `SidebarContext`:
  - open/close/toggle state (currently not driving fixed sidebar width)

### Data flow

- Context token -> `apiFetch` headers -> API response -> local component states.

---

## 9. 🔁 Interactions & Events

- Time filter selection in each card triggers per-card re-fetch.
- Sidebar icon clicks route to pages.
- Logout button triggers auth logout + redirect.
- Hover interactions trigger chart/list highlighting and tooltips.
- `apiFetch` emits `auth:logout` event when status 401.
- Parent dashboard polling refreshes header stats every 30s.

---

## 10. 📂 File & Folder Mapping

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
        ThreatTrendChart.tsx
        ThreatSeverityChart.tsx
        IOCTypeDistributionChartNew.tsx
        FileAnalysisGraphCompact.tsx
        ThreatTypePieChartModern.tsx
        GeographicDistributionChartNew.tsx
        MalwareFamiliesChartNew.tsx
        TopThreatsGraph.tsx
        DetectionEnginePerformanceChartNew.tsx
        RiskScoreTrend.tsx
        RealTimeThreatFeed.tsx
        TimeFilterDropdown.tsx
    api/
      dashboard-v2/route.ts
      ioc-v2/route.ts
      history-v2/route.ts
      file-analysis-v2/...
      auth/... 
  components/
    ProtectedPage.tsx
    layout/
      MainLayout.tsx
      Header.tsx
      Sidebar.tsx
    ui/*
  contexts/
    AuthContext.tsx
    SidebarContext.tsx
  lib/
    (all 50 files listed in Section 4.1)
```

---

## 11. 🧪 Dependencies

Chart/data/UI dependencies used by dashboard system:
- `next@^15.5.9`
- `react@^18.3.1`, `react-dom@^18.3.1`
- `recharts@^3.1.2`
- `echarts-for-react@^3.0.5`
- `axios@^1.13.2` (threat-intel clients)
- `mongoose@^8.8.6`
- `jsonwebtoken@^9.0.2`
- `zod@^3.24.1`
- `lucide-react@^0.469.0`
- `clsx@^2.1.1`, `tailwind-merge@^3.3.1`
- `@radix-ui/*` component primitives

Installed but not currently central for dashboard cards:
- `@mui/x-charts`
- `d3`

---

## 12. 🚀 Rebuild + Improvement Plan

### 12.1 Rebuild Steps

1. Recreate shell and auth flow
- Build `MainLayout` with fixed sidebar + header + protected route gate.
- Rebuild `AuthContext` and `apiFetch` 401 event behavior.

2. Recreate backend data contract
- Rebuild `/api/dashboard-v2` response contract exactly.
- Rebuild Mongo models (`IocCache`, `IocUserHistory`) and indexes.
- Implement cache keying and 30s API cache policy.

3. Rebuild dashboard UI in rows
- Header stats + time filter.
- Row 1, row 2, row 3 card layout with exact breakpoints.
- Recreate chart components with same field mappings.

4. Rebuild threat-intel foundation
- Recreate source clients and normalizers.
- Recreate orchestrator + scoring services + VT extractors.

5. Rebuild file/history integration
- Ensure `ioc-cache.ts` writes history and cache with TTL.
- Ensure dashboard-v2 can aggregate from these documents.

6. Add robust testing gates
- API contract tests for `/api/dashboard-v2`
- unit tests for scoring and normalizers
- component tests for card data mapping

### 12.2 Improvements (IMPORTANT)

#### New charts possible from unused/hidden data

- Detection Engine Performance chart
  - Source already returned: `detectionEngines`
  - Mount existing component and add sorting toggles.

- Trend Delta cards
  - Use `stats.trends.totalIOCs` and `stats.trends.threatsDetected` in header.

- Severity timeline
  - Build area/stacked chart from `threatIntelligence.bySeverity` + time slices (API extension).

- Multi-source confidence chart
  - Use `multiSourceData.*.score/verdict` from IOC analysis payload.

- Threat family evolution
  - Extend dashboard API to bucket `malwareFamilies` by day.

#### Better data aggregation ideas

- Single dashboard query fanout
  - Fetch once in parent and pass slices to cards (or SWR/React Query cache key).
  - Current implementation issues many duplicate requests.

- Unified global time range
  - One source of truth for `timeRange` to keep all cards coherent.

- Pre-aggregation strategy
  - Optionally materialize daily aggregates for high-volume tenants.

#### Performance improvements

- Deduplicate card fetches using shared cache layer.
- Add server-side compression and selective field payload mode.
- Reduce expensive `cacheDocs` lookup fanout with indexed joins/aggregation patterns.

#### Cleaner architecture suggestions

- Consolidate IOC type detection into one module (`detect.ts` vs `validators.ts` overlap).
- Retire or clearly mark legacy `risk.ts` if unused.
- Move placeholder `threat-intel.orchestrator.ts` behind feature flag or complete it.
- Promote `sources.config.ts` into runtime health diagnostics endpoint.

#### UX and reliability fixes

- Wire parent error Retry button to real refetch.
- Surface API cache metadata (`X-Cache`, `cachedAt`) in dashboard debug panel.
- Render data freshness indicator using `cachedAt` and polling timestamp.

---

## Appendix: Rebuild Risks to Watch

- Local per-card time ranges create inconsistent analytics snapshots.
- Source support matrix mismatch risk:
  - Example: config says URLhaus supports hash, client currently supports url/domain.
- Multiple normalization layers increase schema drift risk.
- Threat-intel and dashboard contracts should be schema-validated in CI.
