# Backend Deep Analysis and Rebuild Specification

## 1. 📍 Backend Overview

- Framework: Next.js App Router Route Handlers (serverless-style API endpoints under src/app/api).
- Runtime: Node.js runtime used by Next route handlers.
- Data layer: MongoDB + Mongoose.
- Validation: Zod schemas on selected routes.
- Auth: JWT bearer token with a system-public token fallback mode.

### Project backend structure

- API routes:
  - src/app/api/**/route.ts
- Route-local services:
  - src/app/api/ioc-v2/services/*
  - src/app/api/file-analysis-v2/services/*
- Shared backend libs:
  - src/lib/auth.ts
  - src/lib/db.ts
  - src/lib/ioc-cache.ts
  - src/lib/cache/cache-ttl.ts
  - src/lib/threat-intel/**
  - src/lib/models/*.ts

### Entry point

- There is no custom Express/Nest server entry file.
- Effective backend entry is Next.js route-handler dispatch at build/runtime.
- API handler entry points are the exported route functions GET/POST/HEAD/OPTIONS in each src/app/api/.../route.ts.

---

## 2. 🛣️ Route Mapping (CRITICAL)

### 2.1 All Routes

| Method | Path | File | Notes |
|---|---|---|---|
| POST | /api/auth/login | src/app/api/auth/login/route.ts | username/password login, JWT issue |
| POST | /api/auth/register | src/app/api/auth/register/route.ts | registration + JWT issue |
| GET | /api/auth/me | src/app/api/auth/me/route.ts | validate token and return user payload |
| POST | /api/auth/logout | src/app/api/auth/logout/route.ts | stateless success response |
| GET | /api/dashboard-v2 | src/app/api/dashboard-v2/route.ts | dashboard aggregate payload |
| POST | /api/ioc-v2 | src/app/api/ioc-v2/route.ts | IOC analysis batch endpoint |
| GET | /api/ioc-v2 | src/app/api/ioc-v2/route.ts | IOC history/search endpoint |
| OPTIONS | /api/ioc-v2 | src/app/api/ioc-v2/route.ts | service capability metadata |
| GET | /api/ioc | src/app/api/ioc/route.ts | re-export from /api/ioc-v2 |
| POST | /api/ioc | src/app/api/ioc/route.ts | re-export from /api/ioc-v2 |
| OPTIONS | /api/ioc | src/app/api/ioc/route.ts | re-export from /api/ioc-v2 |
| POST | /api/file-analysis-v2 | src/app/api/file-analysis-v2/route.ts | upload file and analyze |
| GET | /api/file-analysis-v2 | src/app/api/file-analysis-v2/route.ts | endpoint metadata/features |
| GET | /api/history-v2 | src/app/api/history-v2/route.ts | paginated user history list |
| HEAD | /api/history-v2 | src/app/api/history-v2/route.ts | lightweight update check |
| GET | /api/history-v2/[ioc] | src/app/api/history-v2/[ioc]/route.ts | IOC detail by value |
| GET | /api/history | src/app/api/history/route.ts | re-export from /api/history-v2 |
| HEAD | /api/history | src/app/api/history/route.ts | re-export from /api/history-v2 |
| GET | /api/history/[ioc] | src/app/api/history/[ioc]/route.ts | re-export from /api/history-v2/[ioc] |
| POST | /api/contact | src/app/api/contact/route.ts | contact message submit |
| GET | /api/health | src/app/api/health/route.ts | infra and key config health |
| GET | /api/health-threat-intel | src/app/api/health-threat-intel/route.ts | TI deep health check |
| POST | /api/health-threat-intel | src/app/api/health-threat-intel/route.ts | run test IOC analysis |

### 2.2 IOC-V2 Route Deep Analysis (VERY IMPORTANT)

### POST /api/ioc-v2

- Purpose:
  - Analyze one or many IOCs using multi-source intelligence (VT, GreyNoise, IPQS, ThreatFox, MalwareBazaar, URLhaus), enrich IP with geolocation + AbuseIPDB, cache and record history.

- Request body structure:

```json id="iocv2_post_req"
{
  "iocs": ["8.8.8.8", "example.com", "http://x.y", "<sha256>"],
  "label": "Threat Hunt Analysis"
}
```

- Body normalization behavior:
  - If iocs is missing but ioc/iocValue/value exists, server converts it to iocs: [single].

- Query params:
  - none.

- Validation:
  - SubmitIOCRequestSchema (zod): iocs must be non-empty string array, min 1, max 1000.
  - Additional runtime cap: MAX_BATCH_SIZE = 50.
  - Payload cap: content-length must be <= 50 KB.

- Response structure (success):

```json id="iocv2_post_res"
{
  "success": true,
  "results": [
    {
      "ioc": "8.8.8.8",
      "type": "ip",
      "verdict": "malicious|suspicious|clean|unknown|error",
      "severity": "critical|high|medium|low|clean|unknown",
      "riskScore": 78,
      "riskLevel": "high",
      "stats": {
        "malicious": 9,
        "suspicious": 3,
        "harmless": 72,
        "undetected": 12
      },
      "threatIntel": {
        "threatTypes": ["Scanner", "Botnet"],
        "detections": [],
        "severity": "high",
        "confidence": 0.85
      },
      "vtData": {},
      "multiSourceData": {
        "greynoise": {},
        "ipqs": {},
        "threatfox": {},
        "malwarebazaar": {},
        "urlhaus": {}
      },
      "fileInfo": null,
      "sandboxAnalysis": null,
      "mitreAttack": null,
      "reputation": {
        "geolocation": {},
        "abuseipdb": {},
        "riskScore": 78,
        "riskLevel": "high"
      },
      "fetchedAt": "ISO",
      "cached": false,
      "sources_available": ["virustotal", "ipqs"],
      "sources_failed": ["greynoise"]
    }
  ],
  "analyzed": 2,
  "successful": 2,
  "failed": 0,
  "requestId": "uuid",
  "timestamp": "ISO",
  "analysisTimeMs": 1432
}
```

- Headers:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset
  - X-Analysis-Time

- कौन call करता है:
  - src/app/analyze/AnalyzePageView.tsx
  - src/lib/virustotal/vt-client.ts via /api/ioc alias

### GET /api/ioc-v2

- Purpose:
  - Return analyzed IOC history (system user scope first; all-users fallback if system has no records), with cache-enriched fields and filters.

- Request query params:
  - limit (default 20, max 100)
  - skip (default 0)
  - type
  - verdict
  - severity
  - search

- Request body:
  - none.

- Response structure:

```json id="iocv2_get_res"
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "string",
        "ioc": "string",
        "type": "ip|domain|url|hash",
        "label": "string|null",
        "source": "string|null",
        "metadata": {},
        "searched_at": "ISO",
        "verdict": "string",
        "severity": "string",
        "stats": {
          "malicious": 0,
          "suspicious": 0,
          "harmless": 0,
          "undetected": 0
        },
        "threatTypes": ["string"],
        "confidence": 0.0,
        "popularThreatLabel": "string|null",
        "familyLabels": ["string"],
        "hasData": {
          "virustotal": true,
          "greynoise": false,
          "ipqs": true,
          "threatfox": false,
          "malwarebazaar": false,
          "urlhaus": false
        },
        "scores": {
          "virustotal": 0,
          "ipqs": 0,
          "greynoise": 0
        },
        "sources_available": ["string"],
        "ipReputation": {
          "riskScore": 0,
          "riskLevel": "low",
          "geolocation": {}
        }
      }
    ],
    "total": 10,
    "limit": 20,
    "skip": 0,
    "hasMore": false,
    "page": 1,
    "totalPages": 1
  },
  "metadata": {
    "timestamp": "ISO",
    "userId": "system-public-user",
    "dataScope": "system|legacy-fallback",
    "filters": {
      "type": null,
      "verdict": null,
      "severity": null,
      "search": null
    }
  }
}
```

- कौन call करता है:
  - No active direct frontend call in current UI (assumed: reserved for future/admin or legacy client utility).

### OPTIONS /api/ioc-v2

- Purpose:
  - Return endpoint capability metadata, supported sources/types/rate-limit config.

- Response contains:
  - endpoints block (analyze/search)
  - rateLimit config from RATE_LIMIT_CONFIG
  - features list
  - source descriptions
  - supportedTypes
  - maxBatchSize
  - responseFormat contract

- कौन call करता है:
  - No current frontend caller found (assumed: tooling/docs/preflight introspection).

---

## 3. ⚙️ Controller / Handler Logic

### POST /api/auth/login (function: POST)

- File: src/app/api/auth/login/route.ts
- Logic:
  1. connectDB()
  2. Parse JSON body and validate via loginSchema.
  3. Query User by username with select(+password).
  4. Compare password with user.comparePassword().
  5. Update lastLogin.
  6. generateToken(user._id, username, role)
  7. Return token + user payload.

### POST /api/auth/register (function: POST)

- File: src/app/api/auth/register/route.ts
- Logic:
  1. connectDB()
  2. Parse JSON and validate via registerSchema.
  3. Check username uniqueness with User.exists.
  4. Create User document (password hash in pre-save hook).
  5. generateToken.
  6. Return created user + token.

### GET /api/auth/me (function: GET)

- File: src/app/api/auth/me/route.ts
- Logic:
  1. verifyAuth(req) -> JwtPayload|null.
  2. If null, return 401.
  3. Return payload user fields.

### POST /api/auth/logout (function: POST)

- File: src/app/api/auth/logout/route.ts
- Logic:
  1. No token invalidation.
  2. Returns success message only.

### GET /api/dashboard-v2 (function: GET)

- File: src/app/api/dashboard-v2/route.ts
- Logic:
  1. verifyAuth(request) called (return value not enforced).
  2. Parse range query daily/weekly/monthly.
  3. Serve memory cache if cache key fresh (<30s).
  4. connectDB()
  5. Query IocUserHistory by system user and date range.
  6. Fallback to all users if system scope empty.
  7. Build unique value::type set.
  8. Fetch matching IocCache docs.
  9. Compute all aggregates:
     - iocTypeDistribution
     - verdict threatTypes
     - dailyTrends
     - threatIntelligence severity counts
     - detectionEngines
     - malwareFamilies
     - threatVectors
     - geoDistribution
     - fileAnalysis summary
     - threatFeed
  10. Compute high-level stats and trend deltas.
  11. Save response in memory map cache.
  12. Return payload with cache headers.

### POST /api/ioc-v2 (function: POST)

- File: src/app/api/ioc-v2/route.ts
- Logic:
  1. Check content-length (50KB).
  2. Parse JSON body, normalize single IOC field to iocs array.
  3. Validate with SubmitIOCRequestSchema.
  4. Apply in-memory rate limit by SYSTEM_USER_ID.
  5. Enforce max batch size 50.
  6. For each IOC:
     - detectIOCType
     - try getIOCFromCache
     - if cache miss, call orchestrator.analyzeIOC
     - if no sources available:
       - for IP: try geolocation + AbuseIPDB fallback error payload
       - for non-IP: return formatted error payload
     - ensure threatIntel default object exists
     - for IP: enrich with geolocation/abuse and recalc risk via calculateIPRiskScore
     - persist via saveIOCAnalysis with source api_search and TTL from getCacheTTL
     - format result via formatIOCResponse
     - on per-item failure: createErrorResult
  7. Build summary counts and timings.
  8. Return response + rate-limit headers.

### GET /api/ioc-v2 (function: GET)

- File: src/app/api/ioc-v2/route.ts
- Logic:
  1. Apply in-memory rate limit by SYSTEM_USER_ID.
  2. Parse pagination and filters.
  3. getUserHistory(system user).
  4. If empty, fallback getUserHistory(includeAllUsers=true).
  5. Fetch related cache docs by value/type pairs.
  6. Build enriched records with hasData and scores blocks.
  7. Apply severity filter in-memory.
  8. Return data records + paging metadata + filter metadata.

### OPTIONS /api/ioc-v2 (function: OPTIONS)

- File: src/app/api/ioc-v2/route.ts
- Logic:
  1. Return static service metadata and supported features.

### GET/POST/OPTIONS /api/ioc

- File: src/app/api/ioc/route.ts
- Logic:
  1. Re-export handlers from ../ioc-v2/route.

### POST /api/file-analysis-v2 (function: POST)

- File: src/app/api/file-analysis-v2/route.ts
- Logic:
  1. Apply in-memory rate limit by SYSTEM_USER_ID.
  2. Parse multipart formData.
  3. Validate file presence and max size 50MB.
  4. Convert file ArrayBuffer -> Buffer.
  5. performFileAnalysis(buffer, name, size, userId, label).
  6. Normalize VT-heavy data shape for frontend compatibility.
  7. Normalize threatfoxData/malwarebazaarData from multiSourceData.
  8. Return response payload + timing/rate/cache headers.

### GET /api/file-analysis-v2 (function: GET)

- File: src/app/api/file-analysis-v2/route.ts
- Logic:
  1. Return static endpoint metadata/features.

### GET /api/history-v2 (function: GET)

- File: src/app/api/history-v2/route.ts
- Logic:
  1. Extract bearer token and verifyToken.
  2. Parse pagination/search/filter/sort params.
  3. connectDB().
  4. Build aggregation pipeline:
     - match by userId + filters
     - sort by searched_at desc
     - group by value+type (latest record per IOC/type)
     - replaceRoot
  5. Run count and paginated pipeline in parallel.
  6. Query IocCache for returned IOC pairs.
  7. Merge cached analysis into response records.
  8. Return records + pagination object.

### HEAD /api/history-v2 (function: HEAD)

- File: src/app/api/history-v2/route.ts
- Logic:
  1. Verify token.
  2. connectDB.
  3. Count user history rows, optional since timestamp filter.
  4. Return only headers X-Total-Count and X-Last-Updated.

### GET /api/history-v2/[ioc] (function: GET)

- File: src/app/api/history-v2/[ioc]/route.ts
- Logic:
  1. Verify token.
  2. Decode IOC from route param.
  3. getLatestHistoryRecord(userId, iocValue).
  4. getIOCFromCache(iocValue, historyRecord.type).
  5. Build detailed response object from history + analysis.
  6. Return details.

### GET/HEAD /api/history and GET /api/history/[ioc]

- Files:
  - src/app/api/history/route.ts
  - src/app/api/history/[ioc]/route.ts
- Logic:
  - Simple re-export wrappers to history-v2 handlers.

### POST /api/contact (function: POST)

- File: src/app/api/contact/route.ts
- Logic:
  1. Parse JSON body.
  2. Validate required fields present.
  3. Log payload to console (placeholder).
  4. Return success (no persistence/mail provider implemented).

### GET /api/health (function: GET)

- File: src/app/api/health/route.ts
- Logic:
  1. Build service-status object.
  2. connectDB health probe and latency.
  3. Report env-key availability flags.
  4. Return 200 if ok else 503.

### GET /api/health-threat-intel (function: GET)

- File: src/app/api/health-threat-intel/route.ts
- Logic:
  1. Parse mode and ioc query params.
  2. Instantiate all clients and test isAvailable/getQuota.
  3. In full mode, test getGeolocationData and checkAbuseIPDB.
  4. Instantiate MultiSourceOrchestrator.
  5. In full mode, run analyzeIOC(testIOC, ...).
  6. Return composite health report with status healthy/degraded/unhealthy.

### POST /api/health-threat-intel (function: POST)

- File: src/app/api/health-threat-intel/route.ts
- Logic:
  1. Parse JSON body {ioc,label}.
  2. Validate ioc exists.
  3. Run analyzeIOC.
  4. Return condensed analysis summary payload.

---

## 4. 🔌 Service / LIB Layer

### Core service/function inventory used by routes

| Function | File | Input | Output | Purpose | Used by route(s) |
|---|---|---|---|---|---|
| generateToken | src/lib/auth.ts | userId, username, role | JWT string | Sign auth token | /api/auth/login, /api/auth/register |
| verifyToken | src/lib/auth.ts | bearer token | JwtPayload or null | JWT verification incl system token | /api/history-v2, /api/history-v2/[ioc], /api/auth/* indirectly |
| getTokenFromRequest | src/lib/auth.ts | NextRequest | token or null | extract bearer token | /api/history-v2, /api/history-v2/[ioc] |
| verifyAuth | src/lib/auth.ts | NextRequest | JwtPayload or null | auth guard helper | /api/auth/me, /api/dashboard-v2 |
| connectDB | src/lib/db.ts | none | mongoose connection | DB connection singleton | auth, history-v2, dashboard-v2, health |
| checkRateLimit (IOC) | src/app/api/ioc-v2/services/rate-limit.ts | userId | allowed/remaining/resetAt | in-memory throttling | /api/ioc-v2 GET/POST |
| checkRateLimit (File) | src/app/api/file-analysis-v2/services/rate-limit.ts | userId | allowed/remaining/resetAt | in-memory throttling | /api/file-analysis-v2 POST |
| getCacheTTL | src/lib/cache/cache-ttl.ts | iocType, source | ttl seconds | TTL policy | /api/ioc-v2 POST, analysis-engine-v2 |
| detectIOCType | src/lib/validators.ts | IOC string | ip/domain/url/hash | IOC classification | /api/ioc-v2 POST, ioc-analyzer |
| SubmitIOCRequestSchema.safeParse | src/lib/validators.ts | body | parse result | request validation | /api/ioc-v2 POST |
| getIOCFromCache | src/lib/ioc-cache.ts | ioc, type | cached IOCAnalysisResult | cache read | /api/ioc-v2 POST, history-v2/[ioc], analysis-engine-v2 |
| saveIOCAnalysis | src/lib/ioc-cache.ts | SaveIOCAnalysisInput | success + id | upsert cache + create history | /api/ioc-v2 POST, analysis-engine-v2, ioc-analyzer |
| getUserHistory | src/lib/ioc-cache.ts | filter object | records + pagination | history query helper | /api/ioc-v2 GET |
| getLatestHistoryRecord | src/lib/ioc-cache.ts | userId, value | latest history doc | detail lookup | /api/history-v2/[ioc] |
| analyzeIOC | src/lib/threat-intel/services/ioc-analyzer.service.ts | ioc, label, userId | IOCAnalysisResult | orchestrated analysis + IP enrich + save | /api/health-threat-intel |
| MultiSourceOrchestrator.analyzeIOC | src/lib/threat-intel/orchestrator/multi-source.orchestrator.ts | ioc, iocType | IOCAnalysisResult | query clients + normalize + aggregate | /api/ioc-v2 POST, analysis-engine-v2, ioc-analyzer |
| formatIOCResponse | src/lib/threat-intel/orchestrator/multi-source.orchestrator.ts | IOCAnalysisResult, cached | API-ready object | response shaping | /api/ioc-v2 POST |
| createErrorResult | src/lib/threat-intel/orchestrator/multi-source.orchestrator.ts | ioc, type, error | error response object | per-IOC failure response | /api/ioc-v2 POST |
| calculateIPRiskScore | src/lib/threat-intel/services/risk-scoring.service.ts | multiSourceData, abuseData | RiskScoreResult | weighted IP risk compute | /api/ioc-v2 POST, ioc-analyzer |
| getRiskLevelDetails | src/lib/threat-intel/services/risk-scoring.service.ts | level, score | RiskDetails | UI risk metadata | /api/ioc-v2 POST, ioc-analyzer |
| getGeolocationData | src/lib/threat-intel/services/ip-reputation.service.ts | ip | geolocation object or null | geo enrichment | /api/ioc-v2 POST, health-threat-intel, ioc-analyzer |
| checkAbuseIPDB | src/lib/threat-intel/services/ip-reputation.service.ts | ip | abuse profile or null | abuse enrichment | /api/ioc-v2 POST, health-threat-intel, ioc-analyzer |
| performFileAnalysis | src/app/api/file-analysis-v2/services/analysis-engine-v2.ts | buffer, filename, size, userId, label | enriched analysis result | local+external file risk pipeline | /api/file-analysis-v2 POST |

### IOC-V2 service internals (important)

- MultiSourceOrchestrator internals:
  - querySource(sourceName, client, ioc, type)
  - storeSourceData(result, source, data)
  - aggregateResults(result, successfulSources)
  - extractSeverity(source)
  - severityToVerdict(severity)
- Threat source clients:
  - VirusTotalClient.query uses vtClient.lookupIOCEnhanced.
  - GreyNoiseClient.query, IPQSClient.query, ThreatFoxClient.query, MalwareBazaarClient.query, URLhausClient.query.
- Normalizers:
  - VTNormalizer, GreyNoiseNormalizer, IPQSNormalizer, ThreatFoxNormalizer, MalwareBazaarNormalizer, URLhausNormalizer convert source-specific payloads into UnifiedThreatData shape.
- API key rotation:
  - apiKeyManager.getNextKey/reportFailure/reportSuccess with per-service round-robin and temporary blacklist.

---

## 5. 🔄 Data Flow (END-TO-END)

### Flow A: Analyze Page IOC batch

Frontend (src/app/analyze/AnalyzePageView.tsx)
→ POST /api/ioc-v2
→ validate body + rate limit
→ detectIOCType for each IOC
→ cache lookup (getIOCFromCache)
→ cache miss path:
  - MultiSourceOrchestrator.analyzeIOC
  - source clients query external APIs
  - source normalizers produce UnifiedThreatData
  - aggregate verdict/severity/stats/detections
  - IP-only geolocation + AbuseIPDB + weighted risk recompute
→ persist (saveIOCAnalysis)
  - IocCache upsert (value+type)
  - IocUserHistory create row
→ formatIOCResponse
→ return results[] + summary + headers.

### Flow B: File upload analysis

Frontend (src/app/file-analysis/components/FileUploadZone.tsx)
→ POST multipart /api/file-analysis-v2
→ rate limit + file size validation
→ performFileAnalysis:
  - hash generation md5/sha1/sha256
  - cache lookup by sha256 hash
  - if incomplete cache or miss: orchestrator hash analysis
  - local static/dynamic heuristics (file signature, entropy, YARA-like patterns, content indicators, IP extraction)
  - combine local and multi-source scores into riskScore/verdict/riskLevel
  - enrich with fileInfo/sandbox-like summary
  - saveIOCAnalysis(source=file_analysis)
→ route-level VT payload reshape for frontend compatibility
→ return results[0] + timing headers.

### Flow C: History page list + details

Frontend (src/app/history/components/MyAnalysesTable.tsx)
→ GET /api/history-v2?page/limit/search/type/verdict/source
→ token verify
→ aggregate latest record per (value,type)
→ enrich each row from IocCache.analysis
→ return records + pagination
→ row click
→ GET /api/history-v2/[ioc]
→ latest user history row + cache details merge
→ return detail payload.

### Flow D: Dashboard page

Frontend (src/app/dashboard/DashboardPageView.tsx)
→ GET /api/dashboard-v2?range=weekly
→ optional auth check call
→ 30s in-memory response cache check
→ query history by range, fallback all-users
→ join with IocCache by value+type
→ compute KPIs/trends/distributions/feed
→ return consolidated dashboard payload.

---

## 6. 🧾 Request & Response Structures

### POST /api/auth/login

Request:

```json id="auth_login_req"
{
  "username": "alice",
  "password": "password123"
}
```

Response:

```json id="auth_login_res"
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt",
    "user": {
      "id": "objectid",
      "email": null,
      "username": "alice",
      "role": "user"
    }
  }
}
```

### POST /api/auth/register

Request:

```json id="auth_register_req"
{
  "username": "alice",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Response:

```json id="auth_register_res"
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "jwt",
    "user": {
      "id": "objectid",
      "email": null,
      "username": "alice",
      "role": "user"
    }
  }
}
```

### POST /api/ioc-v2

Request:

```json id="ioc_v2_req"
{
  "iocs": ["8.8.8.8", "example.com"],
  "label": "Threat Hunt Analysis"
}
```

Response: see Section 2.2 IOC-V2 POST response (full shape).

### GET /api/ioc-v2

Request query example:

```json id="ioc_v2_get_query"
{
  "limit": 20,
  "skip": 0,
  "type": "ip",
  "verdict": "malicious",
  "severity": "high",
  "search": "8.8"
}
```

Response: records array with enrichment + metadata (see Section 2.2 IOC-V2 GET).

### POST /api/file-analysis-v2

Request:

- multipart/form-data
  - file: binary file
  - label: optional string

Response:

```json id="file_analysis_v2_res"
{
  "success": true,
  "results": [
    {
      "ioc": "sha256",
      "type": "hash",
      "verdict": "malicious|suspicious|unknown|harmless",
      "riskScore": 0,
      "riskLevel": "critical|high|medium|low",
      "stats": {
        "malicious": 0,
        "suspicious": 0,
        "harmless": 0,
        "undetected": 0
      },
      "fileInfo": {},
      "vtData": {},
      "vtIntelligence": {},
      "threatIntel": {},
      "cached": false
    }
  ],
  "requestId": "uuid",
  "timestamp": "ISO",
  "analysisTimeMs": 1234,
  "vtUpload": {
    "status": "pending",
    "message": "...",
    "analysisId": "...",
    "link": "..."
  }
}
```

### GET /api/dashboard-v2

Request query:

```json id="dashboard_v2_req"
{
  "range": "daily|weekly|monthly"
}
```

Response (high-level):

```json id="dashboard_v2_res"
{
  "stats": {},
  "dailyTrends": [],
  "threatTypes": [],
  "iocTypeDistribution": [],
  "threatIntelligence": {},
  "geoDistribution": [],
  "threatVectors": [],
  "fileAnalysis": {},
  "malwareFamilies": [],
  "detectionEngines": [],
  "threatFeed": [],
  "timeRange": "weekly",
  "daysIncluded": 7,
  "startDate": "ISO",
  "endDate": "ISO",
  "cachedAt": "ISO",
  "dataVersion": "2.1-mongo",
  "privacyMode": "history-only|history-all-users-fallback"
}
```

### GET /api/history-v2

Request query:

```json id="history_v2_req"
{
  "page": 1,
  "limit": 10,
  "search": "malware",
  "type": "hash",
  "verdict": "malicious",
  "source": "file_analysis",
  "sortBy": "searched_at",
  "sortOrder": "desc"
}
```

Response:

```json id="history_v2_res"
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "string",
        "ioc": "string",
        "type": "hash",
        "verdict": "malicious",
        "stats": {},
        "searchedAt": "ISO",
        "threatTypes": [],
        "severity": "high",
        "popularThreatLabel": null,
        "familyLabels": [],
        "label": "string|null",
        "source": "file_analysis",
        "metadata": {
          "filename": "sample.exe",
          "filesize": 123456,
          "filetype": "Windows PE",
          "riskScore": 88,
          "riskLevel": "high"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 43,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

### GET /api/history-v2/[ioc]

Request:

- path param: ioc (URL-encoded IOC string)

Response:

```json id="history_v2_ioc_res"
{
  "success": true,
  "data": {
    "id": "string",
    "ioc": "string",
    "type": "string",
    "verdict": "string",
    "label": null,
    "stats": {},
    "reputation": 0,
    "riskScore": 0,
    "riskLevel": "string|null",
    "threatIntel": {},
    "detections": [],
    "fileInfo": null,
    "sandboxAnalysis": null,
    "mitreAttack": null,
    "abuseIPDB": null,
    "geolocation": null,
    "metadata": {
      "searchedAt": "ISO",
      "cacheTtl": 0,
      "source": "string|null"
    },
    "reputationData": null,
    "threatIntelData": {}
  }
}
```

---

## 7. 🗄️ Database Analysis (CRITICAL)

### 7.1 Database Type

- MongoDB (Mongoose ODM).

### 7.2 Schema / Collections

### users collection (model User)

- Source: src/lib/models/User.ts
- Fields:
  - _id: ObjectId
  - email: string | optional | unique sparse | lowercase
  - username: string | required | unique
  - password: string | required | select:false
  - role: enum user|admin
  - lastLogin: Date | nullable
  - createdAt: Date (timestamps)
  - updatedAt: Date (timestamps)
- Hooks/methods:
  - pre-save password hashing with bcrypt salt rounds 12.
  - comparePassword(candidate): Promise<boolean>.

### iocuserhistories collection (model IocUserHistory)

- Source: src/lib/models/IocUserHistory.ts
- Fields:
  - _id: ObjectId
  - userId: string | required
  - value: string | required
  - type: enum ip|domain|url|hash
  - searched_at: Date
  - verdict: string|null
  - label: string|null
  - source: string|null
  - metadata: object|null
    - filename: string?
    - filesize: number?
    - filetype: string?

### ioccaches collection (model IocCache)

- Source: src/lib/models/IocCache.ts
- Fields:
  - _id: ObjectId
  - value: string | required
  - type: enum ip|domain|url|hash
  - verdict: string
  - severity: string
  - riskScore: number
  - threatIntel:
    - threatTypes: string[]
    - confidence: number
  - analysis: Mixed (full IOCAnalysisResult payload)
  - created_at: Date
  - expiresAt: Date

### 7.3 Relationships

- No formal Mongoose ref/populate relationships.
- Logical relationships:
  - IocUserHistory.userId ↔ users._id (stored as string; no FK/ref enforcement).
  - IocUserHistory(value,type) ↔ IocCache(value,type) for enrichment joins.
- Join pattern:
  - Application-level joins via query pair list and in-memory Map keyed value::type.

### 7.4 Indexing & Performance

- users:
  - email unique sparse index
  - username unique index
  - role index
- iocuserhistories:
  - userId index
  - compound index (userId, searched_at desc)
- ioccaches:
  - unique index (value, type)
  - TTL index on expiresAt with expireAfterSeconds=0

Performance behavior in code:

- history-v2 uses aggregation group to deduplicate latest (value,type).
- dashboard-v2 computes heavy aggregates in app memory and uses a 30-second in-memory response cache.
- ioc-v2 and history-v2 perform manual join to cache with batched $or query.

---

## 8. 💾 Data Storage Logic

### Insert paths

- User registration:
  - User.create in /api/auth/register.
- IOC analysis save:
  - saveIOCAnalysis:
    - IocCache.findOneAndUpdate(..., {upsert:true})
    - IocUserHistory.create(...)
- Explicit history write helper:
  - recordUserHistory in src/lib/ioc-cache.ts

### Update paths

- Auth login updates lastLogin with User.updateOne.
- IocCache updates on repeated analysis via upsert path.
- History entries are append-only; no row update path in current routes.

### Delete paths

- No explicit application delete route for User/IocCache/IocUserHistory.
- IocCache automatic deletion via TTL index on expiresAt.

### Validation / sanitization

- Zod strict validation:
  - auth login/register
  - ioc-v2 submit
- Additional hard checks:
  - ioc-v2 payload size and batch cap
  - file-analysis-v2 file size cap
- Weak validation area:
  - contact route validates only required presence (no email format/sanitization).

---

## 9. 🔐 Authentication & Middleware

### Auth system

- JWT signed with JWT_SECRET via generateToken.
- verifyToken accepts either:
  - signed JWT
  - literal system-public-token (mapped to system-public-user).

### Middleware pattern

- No global middleware in these route handlers.
- Per-route auth checks:
  - Strict token verification in history-v2 and history-v2/[ioc], auth/me.
  - dashboard-v2 calls verifyAuth but does not enforce returned payload.
  - ioc-v2 and file-analysis-v2 do not verify bearer token; they run as system user.

### Role-based access

- Role exists in JWT and user model (user/admin).
- Route-level admin checks are not implemented in the analyzed API handlers.
- ProtectedPage (frontend) has optional requireAdmin gating, but backend routes mostly do not enforce role.

---

## 10. 🚨 Data Issues / Gaps (IMPORTANT)

1. User attribution bug in persistence:
- src/lib/ioc-cache.ts saveIOCAnalysis and recordUserHistory write userId: SYSTEM_USER_ID even when input userId is provided.
- Impact: all IOC history is effectively system-scoped; per-user separation is broken.

2. IOC-V2 auth mismatch:
- /api/ioc-v2 and /api/file-analysis-v2 use SYSTEM_USER_ID directly; no required token verification.
- Impact: endpoint behavior differs from advertised auth requirement and weakens authorization boundaries.

3. Dashboard auth not enforced:
- /api/dashboard-v2 calls verifyAuth(request) but does not reject null payload.
- Impact: likely unauthenticated access path.

4. In-memory rate limiting not production-safe:
- Both rate-limit services use process-local Map + setInterval cleanup.
- Impact: multi-instance deployments bypass limits; restart resets counters.

5. Potential regex DoS risk:
- history-v2 search uses new RegExp(search,'i') directly from user input.
- Impact: malformed/heavy regex pattern risk and inefficiency.

6. Data scope fallback risk:
- ioc-v2 GET and dashboard-v2 fallback to include all users when system scope empty.
- Impact: cross-tenant data exposure risk.

7. sortBy parameter is effectively ignored in history-v2:
- sortField is forced to searched_at regardless of sortBy value.

8. Contact route is placeholder-only:
- POST /api/contact logs payload only; no durable storage, no outbound email integration.

9. Schema contract drift:
- Detail UI expects some top-level fields (greynoiseData/ipqsData/threatfoxData) but history detail route currently exposes raw blocks under threatIntelData/reputationData.

10. API key assumptions inconsistent:
- ThreatFox/URLhaus clients require ABUSE_CH_API_KEY even though those APIs can be accessed publicly in some modes; behavior may fail unnecessarily if key absent.

---

## 11. 🚀 Backend Rebuild Plan

1. Define schema boundaries and tenancy model.
- Keep users, ioc_cache, ioc_history collections.
- Enforce real userId persistence (remove SYSTEM_USER_ID overwrite in save paths).
- Introduce optional analysis_runs collection for immutable run history and traceability.

2. Build route contracts first (OpenAPI).
- Freeze request/response DTOs for auth, ioc-v2, history-v2, dashboard-v2, file-analysis-v2.
- Add explicit versioning strategy and deprecation for /api/ioc alias.

3. Implement service orchestration layer cleanly.
- Move route logic into application services:
  - IOCAnalysisService
  - HistoryQueryService
  - DashboardAggregationService
  - FileAnalysisService
- Keep route handlers thin: validate -> call service -> map response.

4. Connect DB with repository abstractions.
- Repositories:
  - UserRepository
  - IocCacheRepository
  - IocHistoryRepository
- Encapsulate upserts, joins, aggregate pipelines.

5. Query and cache optimization.
- Replace in-memory rate limit with Redis/token-bucket.
- Replace in-memory dashboard cache with Redis keyed by range+scope.
- Escape search regex or use safe text index strategy.
- Keep TTL policy central and audited.

6. Security hardening.
- Enforce auth in all protected routes.
- Add role checks where needed.
- Add request sanitization for contact and any free text.

7. Observability and resilience.
- Structured logging with requestId across route -> service -> source client.
- Add circuit breakers/timeouts per source client.
- Track source success/failure metrics and latency histograms.

8. Test strategy.
- Unit tests: normalizers, risk scoring, cache TTL decisions.
- Integration tests: ioc-v2 happy/failure paths and auth rejection.
- Contract tests: snapshot major endpoint schemas.

---

## 12. 💡 Improvements (IMPORTANT)

### Better schema design

- Split heavy analysis payload from cache summary:
  - ioc_cache_summary (fast fields)
  - ioc_analysis_blob (versioned, compressed JSON)
- Add analysisVersion and sourceVersions fields for backward compatibility.

### Additional fields for dashboard

- Store normalized source confidence and verdict contributors per IOC.
- Persist firstSeen/lastSeen per IOC with rolling counters for trend accuracy.
- Add aggregation-ready dimensions:
  - sourceType
  - campaignTag
  - geoCountryCode
  - confidenceBucket

### Performance improvements

- Add compound index on IocUserHistory(userId, type, verdict, searched_at).
- Add index on IocUserHistory(value, type, searched_at desc) for detail lookups.
- Use projection to avoid loading full analysis blobs when listing history rows.
- Batch external source calls with concurrency limits and adaptive retry budgets.

### Cleaner architecture

- Introduce modular backend layers:
  - transport (route handlers)
  - application (use-cases)
  - domain (analysis/risk logic)
  - infrastructure (db/source clients/cache)
- Remove route-level business logic duplication between ioc-v2 and file-analysis-v2.
- Normalize source-to-unified mapping in one place with versioned normalizer contracts.

### Assumed items

- Assumed no other hidden backend routes outside src/app/api/**/route.ts.
- Assumed single Mongo database for all collections.
- Assumed no external queue/worker currently for IOC analysis jobs.
