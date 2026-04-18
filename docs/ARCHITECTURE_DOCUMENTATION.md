# Architecture Documentation - IOC Analysis System

## Table of Contents
1. [Overview](#overview)
2. [Data Flow Architecture](#data-flow-architecture)
3. [File-by-File Documentation](#file-by-file-documentation)
4. [API Endpoints](#api-endpoints)
5. [Database Architecture](#database-architecture)
6. [Centralization Opportunities](#centralization-opportunities)

---

## Overview

This system performs Indicator of Compromise (IOC) analysis using:
- **VirusTotal API** for threat intelligence
- **OpenSearch** for caching and user-specific storage
- **Next.js API Routes** for backend processing
- **React/TypeScript** for frontend

### Key Components:
1. **VirusTotal Integration Layer** - Multi-key orchestration with rate limiting
2. **OpenSearch Storage Layer** - Two-tier caching (global + client-specific)
3. **Data Normalization Layer** - Standardizes responses across providers
4. **API Layer** - REST endpoints for IOC submission and retrieval

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                           │
│                    (IOC Submission/Query)                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                            │
│         /api/ioc, /api/history, /api/graph, etc.                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴────────────────┐
                ▼                                ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   OpenSearch Check       │    │   VirusTotal Lookup      │
│   (iocs_cache index)     │    │   (vt-orchestrator.ts)   │
└────────┬─────────────────┘    └──────────┬───────────────┘
         │                                  │
         │ Cache Hit                        │ Fresh Data
         │                                  │
         └──────────────┬───────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA NORMALIZATION                            │
│                    (normalize.ts)                                │
│  - Compute verdict (malicious/suspicious/harmless)              │
│  - Extract threat types (Trojan, Malware, Ransomware, etc.)    │
│  - Calculate severity (critical/high/medium/low)                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴────────────────┐
                ▼                                ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   Global Cache Save      │    │   Client Index Save      │
│   (iocs_cache)           │    │   (iocs_client_USER_ID)  │
│   Full VT Data           │    │   Reference + Metadata   │
└──────────────────────────┘    └──────────────────────────┘
```

---

## File-by-File Documentation

### 1. OpenSearch Layer

#### `src/lib/opensearch/client.ts`
**Purpose:** OpenSearch client initialization and connection testing

**Key Functions:**
- `testConnection()` - Verifies OpenSearch is accessible
- `indexExists(indexName)` - Checks if an index exists

**Exports:**
- `client` - Singleton OpenSearch client instance

**Environment Variables:**
- `OPENSEARCH_URL` - OpenSearch endpoint (default: `http://localhost:9200`)

---

#### `src/lib/opensearch/indexes.ts`
**Purpose:** Index lifecycle management (create, delete, stats)

**Key Functions:**

1. **`createClientIndex(clientId: string)`**
   - Creates user-specific index: `iocs_client_${clientId}`
   - **Mapping:**
     ```typescript
     {
       client_id: keyword,
       user_id: keyword,
       value: keyword,           // IOC value
       type: keyword,            // ip/domain/hash/url
       ioc_cache_ref: keyword,   // Reference to iocs_cache
       label: text,
       source: keyword,          // api_search/file_upload
       searched_at: date,
       graph_summary: object,    // Graph analytics
       graph_cache_ref: keyword, // Reference to graphs_cache
       metadata: {               // File upload metadata
         filename: text,
         filesize: long,
         filetype: keyword
       }
     }
     ```

2. **`createIOCsCacheIndex()`**
   - Creates global cache: `iocs_cache`
   - Stores complete VirusTotal responses
   - **Mapping:**
     ```typescript
     {
       value: keyword,
       type: keyword,
       verdict: keyword,
       reputation_score: integer,
       detection_count: integer,
       threat_types: keyword[],
       family_labels: keyword[],
       vt_link: keyword,
       last_updated: date,
       cacheTtlSec: integer
     }
     ```

3. **`createGraphsCacheIndex()`**
   - Creates graph cache: `graphs_cache`
   - Stores VirusTotal graph/relationship data
   - **Mapping:** Node/edge structure with analytics

4. **`initializeAllIndexes()`**
   - Initializes all required indexes on startup

**Usage Pattern:**
```typescript
// On user registration/first IOC submission
await createClientIndex(userId);

// On application startup
await initializeAllIndexes();
```

---

#### `src/lib/opensearch/ioc.ts`
**Purpose:** Basic IOC CRUD operations (legacy, simpler interface)

**Key Functions:**

1. **`saveToCache(iocData)`**
   - Saves IOC to global cache (`iocs_cache`)
   - Uses IOC value as document ID

2. **`getFromCache(value)`**
   - Retrieves IOC from global cache
   - Returns `{ success, data }` or `{ success: false, notFound: true }`

3. **`saveToClientIndex(clientId, iocData)`**
   - Saves IOC reference to client index
   - Includes user metadata (notes, tags, risk score)

4. **`searchClientIOCs(clientId, filters)`**
   - Searches user's IOCs with filters
   - **Filters:** user_id, type, verdict, pagination

5. **`countClientIOCs(clientId)`**
   - Returns total IOC count for a client

**Note:** This is a simpler interface. `ioc-advanced.ts` is more feature-rich.

---

#### `src/lib/opensearch/ioc-advanced.ts`
**Purpose:** Advanced IOC operations with VT data joining and metadata

**Key Functions:**

1. **`saveIOCAnalysis(iocData)`**
   - **Two-tier save:**
     - Global cache: Full VT data
     - Client index: Reference + user metadata
   - **Handles:**
     - File upload metadata (filename, size, type)
     - Source tracking (api_search vs file_upload)
     - Threat intelligence extraction
   - **Returns:** `{ success, id }`

2. **`getIOCFromCache(ioc, type, userId)`**
   - **JOIN operation:**
     - Fetches VT data from `iocs_cache`
     - Fetches user metadata from `iocs_client_${userId}`
     - Merges both datasets
   - Returns combined data with caching info

3. **`searchUserIOCs(userId, filters)`**
   - **Multi-stage search:**
     1. Query client index for references
     2. Batch fetch VT data using `mget`
     3. Merge user metadata with VT data
     4. Apply filters (type, verdict, search text)
   - **Filters:**
     - type (ip/domain/hash/url)
     - verdict (malicious/suspicious/harmless)
     - search (text search on IOC value)
     - pagination (limit, skip)

**Data Flow Example:**
```typescript
// User submits IOC
await saveIOCAnalysis({
  ioc: '1.2.3.4',
  type: 'ip',
  userId: 'user123',
  source: 'api_search',
  vt: { ... },           // Full VT response
  threat_intel: { ... }, // Extracted threats
  fetchedAt: new Date()
});

// Saves to:
// 1. iocs_cache['1.2.3.4'] = { vt, threat_intel, ... }
// 2. iocs_client_user123['ip_1.2.3.4'] = { ioc_cache_ref: '1.2.3.4', label, ... }
```

---

#### `src/lib/opensearch/graph-advanced.ts`
**Purpose:** Graph/relationship data management for VirusTotal graphs

**Key Types:**
```typescript
interface GraphData {
  iocValue: string;
  iocType: string;
  root: { id, label, type, value };
  nodes: [{ id, label, count, items }];
  edges: [{ source, target }];
  metadata: { totalRelationships, vtLink, timestamp };
}
```

**Key Functions:**

1. **`saveGraphToCache(graphData)`**
   - Saves graph to `graphs_cache` index
   - Calculates analytics (most connected node, relationship types)
   - Sets TTL (24 hours default)

2. **`getGraphFromCache(iocValue, iocType)`**
   - Retrieves cached graph data
   - Updates access count
   - Returns null if expired or not found

3. **`updateIOCWithGraphSummary(clientId, iocValue, iocType, graphId, graphSummary)`**
   - Updates IOC record in client index with graph reference
   - Adds graph analytics to user's IOC record

4. **`getRecentIOCsForGraph(clientId, limit)`**
   - Gets user's recent IOCs that could have graphs
   - Used for graph dropdown UI

5. **`searchIOCsWithGraphs(clientId, filters)`**
   - Filters IOCs that have graph data
   - **Filters:** hasGraph, minRelationships, relationshipType

6. **`getGraphAnalytics(clientId)`**
   - Returns graph statistics for analytics dashboard
   - Total graphs, most connected nodes, etc.

7. **`cleanupExpiredGraphs()`**
   - Deletes expired graphs (TTL based)
   - Should run as cron job

**Usage Pattern:**
```typescript
// After IOC analysis, fetch graph
const graph = await vtClient.fetchGraphSummary(fileHash);

// Save to cache
await saveGraphToCache(graph);

// Update user's IOC record
await updateIOCWithGraphSummary(userId, fileHash, 'hash', graphId, summary);
```

---

### 2. VirusTotal Integration Layer

#### `src/lib/vt-orchestrator.ts`
**Purpose:** Core VirusTotal API orchestrator with rate limiting, caching, and multi-key rotation

**Key Classes:**

**`VirusTotalClient`**

**Constructor:**
```typescript
new VirusTotalClient(apiKeys: string[], options?: { ttlMs: number })
```
- Initializes with multiple API keys
- Default cache TTL: 45 minutes

**Key Methods:**

1. **`lookupIndicator(indicator, options)`**
   - Main entry point for IOC lookup
   - **Flow:**
     1. Normalize indicator (hash, URL, IP, domain)
     2. Check in-flight requests (deduplication)
     3. Check cache (TTL-based)
     4. Execute request with key rotation
     5. Handle rate limits (queue if all keys exhausted)
   - **Returns:** `LookupResult` with status (cached/live/queued/failed)

2. **`fetchCodeInsights(fileHash)`**
   - Fetches sandbox behavior analysis
   - Endpoint: `/files/{hash}/behaviour_summary`

3. **`fetchMitreAttack(fileHash)`**
   - Fetches MITRE ATT&CK techniques
   - Endpoint: `/files/{hash}/behaviour_mitre_trees`

4. **`fetchGraphSummary(fileHash)`**
   - Fetches relationship graph
   - **Relationships:** 
     - contacted_ips, contacted_domains, contacted_urls
     - embedded_urls, embedded_domains, embedded_ips
     - execution_parents, compressed_parents
     - itw_urls, itw_domains, itw_ips
   - Returns graph with nodes and edges

5. **`fetchFileRelationships(fileHash, relationship)`**
   - Fetches specific relationship type
   - Used for detailed relationship exploration

**Rate Limiting Strategy:**
- Tracks remaining requests per key (header: `X-Api-Key-Remaining`)
- Puts keys in cooldown when rate limited (header: `Retry-After`)
- Rotates to next available key
- Queues requests if all keys exhausted
- Auto-processes queue when keys reset

**Cache Strategy:**
- In-memory Map with TTL
- Key: `${type}:${normalized_indicator}`
- Cleans up expired entries periodically

**Key Rotation Logic:**
```typescript
// Round-robin with availability check
_pickAvailableKey() {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(currentKeyIndex + i) % keys.length];
    if (key.status === 'ok') {
      currentKeyIndex = (currentKeyIndex + i + 1) % keys.length;
      return key;
    }
  }
  return null; // All keys exhausted
}
```

**Statistics Tracking:**
```typescript
stats = {
  cacheHits: number,
  cacheMisses: number,
  totalRequests: number,
  queuedRequests: number,
  failedRequests: number,
  keyRotations: number
}
```

**Key Interfaces:**
```typescript
interface LookupResult {
  status: 'served_from_cache' | 'served_live' | 'queued_rate_limited' | 'failed';
  indicator: string;
  summary?: {
    malicious: number;
    suspicious: number;
    clean: number;
    undetected: number;
    totalScans: number;
    threatTypes?: string[];      // NEW: Extracted threat types
    detections?: Detection[];    // NEW: Top detections
    familyLabels?: string[];     // NEW: Malware families
  };
  vtLink?: string;
  keyId?: string;
  rateLimitInfo?: RateLimitInfo;
  eta?: Date;           // Estimated time when queued request will be processed
  error?: string;
  raw?: any;            // Full VT response
}
```

---

#### `src/lib/vt.ts`
**Purpose:** Enhanced VirusTotal client wrapper (high-level interface)

**Key Classes:**

**`EnhancedVirusTotalClient`**

**Constructor:**
- Reads API keys from environment:
  - `VT_API_KEYS` (comma-separated, preferred)
  - `VT_API_KEY`, `VT_API_KEY_1`, `VT_API_KEY_2`, etc. (backward compatible)
- Initializes `VirusTotalClient` orchestrator
- Sets `hasValidApiKey` flag

**Key Methods:**

1. **`lookupIOCEnhanced(ioc, type)`**
   - Checks if API key is configured
   - Calls orchestrator's `lookupIndicator`
   - Returns null if no API key (graceful degradation)

2. **`lookupIOC(ioc, type)`** (Legacy)
   - Backward-compatible interface
   - Converts orchestrator result to legacy `VTResponse` format
   - Returns structured response with meta information:
     ```typescript
     {
       data: { attributes: { ... }, id, type },
       meta: {
         success: boolean,
         error?: string,
         source: 'virustotal' | 'cache' | 'error' | 'no_api_key',
         timestamp: string
       }
     }
     ```

3. **`isConfigured()`**
   - Returns true if API keys are available
   - Used for health checks

4. **`getStats()`**
   - Returns orchestrator statistics

5. **`clearCache()`**
   - Clears orchestrator's in-memory cache

6. **`fetchCodeInsights(fileHash)`**
7. **`fetchMitreAttack(fileHash)`**
8. **`fetchGraphSummary(fileHash)`**
9. **`fetchFileRelationships(fileHash, relationship)`**
   - Proxy methods to orchestrator

**Exports:**
```typescript
export const vtClient = new EnhancedVirusTotalClient();
export function isVirusTotalConfigured(): boolean;
```

**Usage Pattern:**
```typescript
// In API routes
import { vtClient, isVirusTotalConfigured } from '@/lib/vt';

if (!isVirusTotalConfigured()) {
  return NextResponse.json({ error: 'VT not configured' }, { status: 503 });
}

const result = await vtClient.lookupIOCEnhanced(ioc, type);
```

---

#### `src/lib/vt-client.ts`
**Purpose:** Client-side VirusTotal service (browser-safe, proxies through API)

**Key Classes:**

**`ClientVirusTotalService`**

**Methods:**

1. **`analyzeIOC(ioc, type)`**
   - **Client-side method** (runs in browser)
   - Calls `/api/ioc` endpoint
   - Handles errors gracefully
   - Returns normalized result:
     ```typescript
     {
       ioc: string,
       type: string,
       verdict: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown' | 'error',
       stats: { malicious, suspicious, harmless, undetected },
       source: 'virustotal' | 'cache' | 'error',
       cached: boolean,
       threatTypes?: string[],
       topDetections?: string[]
     }
     ```

2. **`analyzeBatch(iocs, onProgress)`**
   - Batch analysis of multiple IOCs
   - Sends all IOCs in single request to `/api/ioc`
   - Calls `onProgress` callback for each result
   - Returns array of results

**Static Helper Methods:**

3. **`summarizeResults(results)`**
   - Aggregates batch results
   - Returns summary statistics:
     ```typescript
     {
       total: number,
       malicious: number,
       suspicious: number,
       harmless: number,
       undetected: number,
       errors: number,
       totalDetections: number,
       detectionRate: number,
       threatTypes: string[]
     }
     ```

4. **`isThreat(result)`**
   - Returns true if result indicates threat
   - Logic: malicious > 0 OR suspicious > 2

5. **`getThreatLevel(result)`**
   - Calculates threat level with color coding
   - Returns: `{ level, color, label }`
   - Levels:
     - **Critical:** malicious > 10 OR detection rate > 30%
     - **High:** malicious > 5 OR detection rate > 15%
     - **Medium:** malicious > 2 OR suspicious > 5 OR detection rate > 5%
     - **Low:** malicious > 0 OR suspicious > 0
     - **None:** Clean

**Exports:**
```typescript
export const vtService = new ClientVirusTotalService();
export const { summarizeResults, isThreat, getThreatLevel } = ClientVirusTotalService;
```

**Usage Pattern (Frontend):**
```typescript
import { vtService } from '@/lib/vt-client';

// Single IOC
const result = await vtService.analyzeIOC('1.2.3.4', 'ip');

// Batch
const results = await vtService.analyzeBatch(
  [{ ioc: '1.2.3.4', type: 'ip' }, { ioc: 'evil.com', type: 'domain' }],
  (current, total, result) => {
    console.log(`Progress: ${current}/${total}`);
  }
);

// Get threat level
const threat = vtService.getThreatLevel(result);
console.log(threat.level, threat.color); // 'high', 'red'
```

---

### 3. Data Normalization & Validation Layer

#### `src/lib/normalize.ts`
**Purpose:** Normalize VirusTotal responses to standard format

**Key Functions:**

1. **`normalizeVTResponse(vtData)`**
   - **Input:** Raw VT API response
   - **Output:** Standardized `VTNormalized` object
   - **Processing:**
     - Extracts stats (malicious, suspicious, harmless, undetected)
     - Computes verdict based on stats
     - Extracts threat types from tags, categories, and detections
     - Extracts provider information
     - Formats dates

2. **`extractThreatIntelligence(attributes)`**
   - **NEW:** Extracts threat intelligence from VT response
   - **Sources:**
     - Tags (trojan, malware, ransomware, etc.)
     - Categories (malware, phishing, etc.)
     - Detection results (parses engine results)
   - **Returns:**
     ```typescript
     {
       threatTypes: string[],    // ['Trojan', 'Malware']
       detections: Detection[]   // Top 20 detections with engine/category/result
     }
     ```

3. **`computeVerdict(stats)`**
   - **Logic:**
     - malicious >= 1 → 'malicious'
     - suspicious >= 1 → 'suspicious'
     - harmless > 0 (no malicious/suspicious) → 'harmless'
     - All zero except undetected → 'undetected'
     - Else → 'unknown'

**UI Helper Functions:**

4. **`getVerdictColor(verdict)`**
   - Returns CSS color for verdict
   - malicious: red, suspicious: orange, harmless: green, etc.

5. **`getVerdictText(verdict)`**
   - Returns display text for verdict

6. **`getSeverityLevel(stats)`** (NEW)
   - Calculates severity from stats
   - malicious > 10 → 'critical'
   - malicious > 5 → 'high'
   - malicious > 0 OR suspicious > 5 → 'medium'
   - suspicious > 0 → 'low'
   - Else → 'unknown'

7. **`getThreatTypeColor(threatType)`** (NEW)
   - Returns color for threat type badge
   - Trojan: #dc2626, Ransomware: #b91c1c, etc.

8. **`getThreatTypeIcon(threatType)`** (NEW)
   - Returns emoji icon for threat type
   - Trojan: 🐴, Ransomware: 🔐, Malware: 🦠, etc.

---

#### `src/lib/validators.ts`
**Purpose:** Zod schemas for request/response validation and type definitions

**Key Types:**
```typescript
export type IOCType = 'ip' | 'domain' | 'url' | 'hash';
export type Verdict = 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown' | 'pending';
```

**Key Schemas:**

1. **`SubmitIOCRequestSchema`**
   - Validates IOC submission requests
   - Fields: iocs (array, 1-1000 items), label (optional)

2. **`DetectionSchema`** (NEW)
   - Validates detection entries
   - Fields: engine, category, result, method

3. **`VTNormalizedSchema`**
   - Validates normalized VT response
   - Includes threatTypes, detections (NEW)

4. **`ThreatIntelSchema`** (NEW)
   - Validates threat intelligence data
   - Fields: threatTypes, detections, malwareFamily, severity, confidence

5. **`IOCRecordSchema`**
   - Validates MongoDB/OpenSearch IOC records
   - Includes threat_intel, reputation_data (NEW)

6. **`SubmitIOCResponseSchema`** (NEW)
   - Validates API response
   - Includes threatIntel in results

7. **`IOCQuerySchema`**
   - Validates search queries
   - New filters: threatType, severity

**Helper Functions:**

8. **`detectIOCType(ioc)`**
   - Auto-detects IOC type from value
   - Logic: Hash length (32/40/64), URL pattern, IP pattern, else domain

9. **`validateIOC(ioc, type)`**
   - Validates IOC format
   - Returns `{ valid, error? }`

10. **`getVerdictScore(verdict)`**
    - Returns numeric score for sorting (malicious: 5, suspicious: 4, etc.)

11. **`getSeverityScore(severity)`**
    - Returns numeric score for sorting (critical: 4, high: 3, etc.)

---

## API Endpoints - Complete Documentation

### Overview

The application uses Next.js API Routes with the following structure:
- **v2 APIs** - Latest production endpoints with enhanced features
- **Authentication** - JWT token-based (Bearer token in Authorization header)
- **Rate Limiting** - Per-user rate limits to prevent abuse
- **Caching** - Two-tier caching (memory + OpenSearch)

---

## 1. IOC Analysis API

### **POST /api/ioc-v2**
**Purpose:** Analyze IOCs (IPs, domains, URLs, hashes) with threat intelligence

**Authentication:** Required (Bearer token)

**Rate Limit:** 100 requests per 60 minutes per user

**Request:**
```typescript
{
  iocs: string[],        // Array of IOC values (max 50)
  label?: string         // Optional label for grouping
}
```

**Response:**
```typescript
{
  success: boolean,
  results: [{
    ioc: string,
    type: 'ip' | 'domain' | 'url' | 'hash',
    verdict: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown' | 'error',
    severity: 'critical' | 'high' | 'medium' | 'low' | 'clean' | 'unknown',
    
    // IP-specific fields (only for type: 'ip')
    riskScore?: number,      // 0-100 risk score
    riskLevel?: 'critical' | 'high' | 'medium' | 'low',
    riskDetails?: {
      level: string,
      color: string,
      badge: string,
      label: string,
      description: string,
      recommendation: string,
      action: string
    },
    
    stats: {
      malicious: number,
      suspicious: number,
      harmless: number,
      undetected: number
    },
    
    threatIntel: {
      threatTypes: string[],      // ['Trojan', 'Malware', 'Botnet']
      detections: Detection[],    // Top detections from AV engines
      severity: string,
      riskLevel?: string,         // Only for IPs
      riskScore?: number,         // Only for IPs
      confidence: number          // 0-1
    },
    
    vtData: {
      popular_threat_label: string | null,
      threat_categories: string[],
      suggested_threat_label: string | null,
      family_labels: string[],
      code_insights: any | null,      // For hashes
      mitre_attack: any | null,       // For hashes
      normalized: any
    },
    
    fileInfo?: any,              // For hashes
    sandboxAnalysis?: any,       // For hashes
    reputation?: {               // For IPs
      geolocation: GeolocationData,
      abuseipdb: AbuseIPDBData,
      riskScore: number,
      riskLevel: string
    },
    
    fetchedAt: Date,
    cached: boolean,
    error?: string
  }],
  analyzed: number,
  requestId: string,
  timestamp: string,
  analysisTimeMs: number
}
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2026-01-16T11:30:00Z
X-Analysis-Time: 1234ms
```

**Processing Flow:**
```
1. Authentication & Rate Limit Check
   ├─ Extract JWT token
   ├─ Verify user identity
   └─ Check rate limit (100 req/60min)

2. Request Validation
   ├─ Validate IOC array (1-50 items)
   └─ Validate label (optional)

3. Create Client Index
   └─ Ensure iocs_client_{userId} exists

4. Analyze Each IOC
   ├─ Detect IOC type (ip/domain/url/hash)
   ├─ Check OpenSearch cache
   │   ├─ If cached: Return from cache
   │   └─ If not cached: Fetch from VT
   │
   ├─ For IP:
   │   ├─ Fetch geolocation (EagleEyeSOC/ip-api.com)
   │   ├─ Check AbuseIPDB
   │   ├─ Compute unified risk score (0-100)
   │   └─ Determine risk level (critical/high/medium/low)
   │
   ├─ For Hash:
   │   ├─ Fetch VT file report
   │   ├─ Extract file info (name, type, size)
   │   ├─ Fetch MITRE ATT&CK techniques
   │   ├─ Fetch code insights (sandbox)
   │   └─ Generate sandbox analysis
   │
   ├─ For Domain/URL:
   │   ├─ Fetch VT report
   │   └─ Compute severity (no risk score)
   │
   └─ Extract threat intelligence:
       ├─ Threat types (Trojan, Malware, etc.)
       ├─ Top detections (AV engines)
       ├─ Family labels
       └─ Popular threat label

5. Save to OpenSearch
   ├─ Global cache: iocs_cache (full VT data)
   └─ Client index: iocs_client_{userId} (reference + metadata)

6. Return Results
   └─ Include rate limit headers
```

**Service Layer:** `src/app/api/ioc-v2/services/analyzer.ts`

**Key Functions:**
- `analyzeIOC(ioc, label?, userId?)` - Main analysis orchestrator
- `computeIPRisk(vtSummary, abuseData)` - IP risk calculation
- `computeNonIPSeverity(vtSummary, iocType)` - Hash/Domain/URL severity

**Helper Modules:**
- `formatters.ts` - Response formatting
- `ip-reputation.ts` - IP geolocation & AbuseIPDB checks
- `risk-unified.ts` - Unified risk scoring for IPs
- `threat-intel.ts` - Threat intelligence extraction
- `vt.ts` - VT data parsing

---

### **GET /api/ioc-v2**
**Purpose:** Search user's analyzed IOCs

**Authentication:** Required

**Rate Limit:** Shared with POST (100 req/60min)

**Query Parameters:**
```typescript
{
  limit?: number,          // Max results (default: 20, max: 100)
  skip?: number,           // Pagination offset (default: 0)
  type?: 'ip' | 'domain' | 'url' | 'hash',
  verdict?: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown',
  search?: string          // Wildcard search on IOC value
}
```

**Response:**
```typescript
{
  success: boolean,
  data: IOCRecord[],       // Same format as POST response
  total: number,
  timestamp: string
}
```

---

### **OPTIONS /api/ioc-v2**
**Purpose:** Get API information (no auth required)

**Response:**
```typescript
{
  service: 'IOC Analysis API v2',
  version: '2.0.0',
  endpoints: { analyze, search },
  rateLimit: { maxRequests, window, perUser },
  features: string[],
  supportedTypes: ['ip', 'domain', 'url', 'hash'],
  maxBatchSize: 50
}
```

---

## 2. File Analysis API

### **POST /api/file-analysis-v2**
**Purpose:** Upload and analyze files for malware detection

**Authentication:** Required (Bearer token)

**Rate Limit:** 10 requests per 60 minutes per user

**Request:** `multipart/form-data`
```typescript
FormData {
  file: File,              // Binary file (max 50MB)
  label?: string           // Optional label
}
```

**Response:**
```typescript
{
  success: boolean,
  results: [{
    ioc: string,                 // SHA256 hash
    type: 'hash',
    verdict: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown',
    severity: 'critical' | 'high' | 'medium' | 'low' | 'clean',
    
    stats: {
      malicious: number,
      suspicious: number,
      harmless: number,
      undetected: number
    },
    
    fileInfo: {
      name: string,
      size: number,
      type: string,
      md5: string,
      sha1: string,
      sha256: string,
      firstSeen: string,
      lastAnalysis: string,
      uploadDate: string
    },
    
    localAnalysis: {
      fileSignature: {
        detected: boolean,
        type: 'PE' | 'ELF' | 'PDF' | 'ZIP' | 'BAT' | 'PS1' | etc.,
        description: string,
        risk: 'high' | 'medium' | 'low'
      },
      contentAnalysis: {
        suspiciousPatterns: string[],
        encodedContent: boolean,
        obfuscation: boolean,
        riskScore: number
      },
      extractedIOCs: {
        ips: string[],
        domains: string[],
        urls: string[],
        emails: string[]
      },
      behaviorFlags: {
        hasShellCommands: boolean,
        hasRegistryAccess: boolean,
        hasNetworkActivity: boolean,
        hasFileSystemAccess: boolean,
        hasPowerShellUsage: boolean,
        hasEncodedCommands: boolean
      }
    },
    
    vtData: {
      popular_threat_label: string | null,
      family_labels: string[],
      mitre_attack: MitreAttackData | null,
      code_insights: any | null
    },
    
    sandboxAnalysis?: {
      status: string,
      runtime: string,
      environment: string,
      behaviorAnalysis: any
    },
    
    threatIntel: {
      threatTypes: string[],
      detections: Detection[],
      severity: string,
      confidence: number
    },
    
    fetchedAt: Date,
    cached: boolean,
    uploadedAt: string
  }],
  requestId: string,
  timestamp: string,
  analysisTimeMs: number
}
```

**Response Headers:**
```
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 2026-01-16T12:00:00Z
X-Analysis-Time: 3456ms
X-Cache-Hit: false
```

**Processing Flow:**
```
1. Authentication & Rate Limit
   └─ Check 10 req/60min limit

2. File Validation
   ├─ Check file exists
   ├─ Validate size (max 50MB)
   └─ Convert to buffer

3. Hash Computation
   ├─ MD5
   ├─ SHA1
   └─ SHA256

4. Local Analysis (YARA-style)
   ├─ File signature detection
   │   ├─ PE/ELF executables (high risk)
   │   ├─ Scripts (BAT/PS1/SH) (high risk)
   │   ├─ Archives (ZIP/RAR) (medium risk)
   │   └─ Documents (PDF/DOC) (low-medium risk)
   │
   ├─ Content analysis
   │   ├─ Detect obfuscation
   │   ├─ Find base64 encoded data
   │   ├─ Detect PowerShell commands
   │   ├─ Find registry access patterns
   │   └─ Identify network activity
   │
   ├─ IOC extraction
   │   ├─ IP addresses (regex)
   │   ├─ Domain names
   │   ├─ URLs
   │   └─ Email addresses
   │
   └─ Behavior flags
       ├─ Shell commands
       ├─ Registry access
       ├─ Network activity
       ├─ File system access
       ├─ PowerShell usage
       └─ Encoded commands

5. VirusTotal Check
   ├─ Check file hash reputation
   ├─ If not found: Upload to VT (optional)
   ├─ Fetch MITRE ATT&CK data
   └─ Fetch code insights

6. Threat Intelligence Aggregation
   ├─ Extract threat types
   ├─ Aggregate detections
   ├─ Compute severity
   └─ Calculate confidence

7. Save to OpenSearch
   ├─ iocs_cache (full analysis)
   └─ iocs_client_{userId} (reference + file metadata)

8. Return Results
```

**Service Layer:**
- `src/app/api/file-analysis-v2/services/analysis-engine-v2.ts` - Core analysis
- `src/app/api/file-analysis-v2/services/vt-service.ts` - VT integration

**File Signatures Detected:**
```typescript
{
  'PE': Windows PE Executable (high risk),
  'ELF': Linux ELF Executable (high risk),
  'MACHO': macOS Mach-O (high risk),
  'BAT': Batch Script (high risk),
  'PS1': PowerShell Script (high risk),
  'SH': Shell Script (high risk),
  'VBS': VBScript (high risk),
  'JS': JavaScript File (medium risk),
  'ZIP': ZIP Archive (medium risk),
  'RAR': RAR Archive (medium risk),
  '7Z': 7-Zip Archive (medium risk),
  'PDF': PDF Document (low risk),
  'DOC': MS Office Document (medium risk),
  'JPEG': JPEG Image (low risk),
  'PNG': PNG Image (low risk)
}
```

---

### **GET /api/file-analysis-v2**
**Purpose:** Get API information

**Response:**
```typescript
{
  service: 'File Analysis API v2',
  version: '2.0.0',
  endpoint: 'POST /api/file-analysis-v2',
  limits: {
    maxFileSize: '50MB',
    rateLimit: '10 requests per hour'
  },
  features: string[]
}
```

---

## 3. History API

### **GET /api/history-v2**
**Purpose:** Retrieve user's IOC search history with pagination

**Authentication:** Required

**Query Parameters:**
```typescript
{
  page?: number,           // Page number (default: 1)
  limit?: number,          // Results per page (default: 10, max: 100)
  search?: string,         // Wildcard search on IOC value or label
  type?: 'ip' | 'domain' | 'url' | 'hash' | 'all',
  verdict?: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown' | 'all',
  sortBy?: string,         // Sort field (default: 'searched_at')
  sortOrder?: 'asc' | 'desc' // Sort order (default: 'desc')
}
```

**Response:**
```typescript
{
  success: boolean,
  data: {
    records: [{
      ioc: string,
      type: 'ip' | 'domain' | 'url' | 'hash',
      label: string | null,
      verdict: string,
      severity: string,
      stats: {
        malicious: number,
        suspicious: number,
        harmless: number,
        undetected: number
      },
      source: 'api_search' | 'file_upload' | 'hash_search' | 'ip_search' | etc.,
      searchedAt: string,
      createdAt: string,
      updatedAt: string
    }],
    pagination: {
      currentPage: number,
      totalPages: number,
      totalCount: number,
      hasNextPage: boolean,
      hasPrevPage: boolean,
      limit: number
    }
  }
}
```

**Processing Flow:**
```
1. Authentication
2. Parse query parameters
3. Build OpenSearch query
   ├─ Search filter (wildcard on value/label)
   ├─ Type filter
   └─ Sort by field
4. Execute search on iocs_client_{userId}
5. Batch fetch VT data from iocs_cache (mget)
6. Merge client metadata with VT data
7. Apply verdict filter (post-merge)
8. Return paginated results
```

---

### **HEAD /api/history-v2**
**Purpose:** Check for updates (real-time update detection)

**Response Headers:**
```
X-Last-Modified: 2026-01-16T10:30:00Z
X-Total-Count: 42
```

---

### **GET /api/history-v2/[ioc]**
**Purpose:** Get detailed information for a specific IOC

**Authentication:** Required

**URL Parameter:**
- `ioc` - URL-encoded IOC value

**Response:**
```typescript
{
  success: boolean,
  data: {
    // Client metadata
    client: {
      value: string,
      type: string,
      label: string,
      source: string,
      searched_at: string,
      user_verdict: string | null,
      created_at: string,
      updated_at: string,
      graph_summary: GraphSummary | null,
      graph_viewed: boolean
    },
    
    // VT data from cache
    analysis: {
      verdict: string,
      severity: string,
      riskScore?: number,
      riskLevel?: string,
      stats: {
        malicious: number,
        suspicious: number,
        harmless: number,
        undetected: number
      },
      threatIntel: {
        threatTypes: string[],
        detections: Detection[],
        severity: string,
        confidence: number
      },
      vtData: any,
      reputation?: any,
      fileInfo?: any,
      sandboxAnalysis?: any
    },
    
    cached: boolean,
    fetchedAt: string
  }
}
```

---

## 4. Graph API

### **GET /api/graph-v2**
**Purpose:** Get graph/relationship data for an IOC

**Authentication:** Required

**Query Parameters:**
```typescript
{
  ioc: string,             // IOC value (required)
  type?: 'hash' | 'ip' | 'domain' | 'url',  // Auto-detected if not provided
  force?: 'true' | 'false' // Force refresh cache (default: false)
}
```

**Response:**
```typescript
{
  success: boolean,
  data: {
    root: {
      id: 'root',
      label: string,       // IOC value
      type: 'hash' | 'ip' | 'domain' | 'url',
      value: string
    },
    nodes: [{
      id: string,          // e.g., 'contacted_ips'
      label: string,       // e.g., 'Contacted IPs'
      count: number,       // Number of relationships
      items: string[]      // Array of related values
    }],
    edges: [{
      source: 'root',
      target: string       // Node ID
    }],
    metadata: {
      totalRelationships: number,
      vtLink: string,
      timestamp: string,
      cached: boolean,
      cached_at?: string
    }
  }
}
```

**Supported Relationships:**
```typescript
For Hash (File):
- contacted_ips       // IPs the file contacted
- contacted_domains   // Domains the file contacted
- contacted_urls      // URLs the file contacted
- embedded_ips        // IPs embedded in file
- embedded_domains    // Domains embedded in file
- embedded_urls       // URLs embedded in file
- execution_parents   // Parent processes
- compressed_parents  // Archives containing this file
- itw_urls           // In-the-wild URLs distributing file
- itw_domains        // In-the-wild domains
- itw_ips            // In-the-wild IPs

For IP:
- resolutions        // Domain resolutions
- communicating_files // Files that contacted this IP
- downloaded_files   // Files downloaded from this IP

For Domain:
- resolutions        // IP resolutions
- communicating_files // Files that contacted this domain
- downloaded_files   // Files served by this domain

For URL:
- network_location   // IP/domain of URL
- downloaded_files   // Files downloaded from URL
- communicating_files // Files that contacted URL
```

**Processing Flow:**
```
1. Authentication
2. Validate IOC format
3. Auto-detect IOC type (if not provided)
4. Check memory cache (5-minute TTL)
   └─ If cached: Return immediately
5. Check OpenSearch cache (graphs_cache)
   └─ If cached and not expired: Return
6. Fetch from VirusTotal
   ├─ Parallel fetch all relationships
   ├─ Build graph structure
   │   ├─ Create nodes (one per relationship type)
   │   ├─ Create edges (root to each node)
   │   └─ Deduplicate items
   └─ Calculate analytics
7. Save to caches
   ├─ Memory cache (5 min TTL)
   └─ OpenSearch (24 hour TTL)
8. Update IOC record with graph summary
9. Return graph data
```

---

### **POST /api/graph-v2**
**Purpose:** Batch fetch graphs for multiple IOCs

**Authentication:** Required

**Request:**
```typescript
{
  iocs: [{
    value: string,
    type?: 'hash' | 'ip' | 'domain' | 'url'
  }]
}
```

**Response:**
```typescript
{
  success: boolean,
  results: [{
    ioc: string,
    type: string,
    success: boolean,
    graph?: GraphData,
    error?: string
  }]
}
```

---

## 5. Dashboard API

### **GET /api/dashboard-v2**
**Purpose:** Get analytics dashboard data

**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
{
  force?: 'true' | 'false',           // Force refresh (default: false)
  range?: 'daily' | 'weekly' | 'monthly' // Time range (default: weekly)
}
```

**Response:**
```typescript
{
  success: boolean,
  data: {
    overview: {
      totalIOCs: number,
      malicious: number,
      suspicious: number,
      harmless: number,
      undetected: number,
      criticalThreats: number,
      highThreats: number
    },
    
    topThreats: [{
      ioc: string,
      type: string,
      verdict: string,
      severity: string,
      malicious: number,
      suspicious: number,
      threatTypes: string[],
      detectedAt: string
    }],
    
    typeDistribution: [{
      type: 'ip' | 'domain' | 'url' | 'hash',
      count: number,
      malicious: number,
      suspicious: number,
      harmless: number
    }],
    
    verdictDistribution: [{
      verdict: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown',
      count: number,
      percentage: number
    }],
    
    severityDistribution: [{
      severity: 'critical' | 'high' | 'medium' | 'low' | 'clean' | 'unknown',
      count: number,
      percentage: number
    }],
    
    threatTypeDistribution: [{
      threatType: string,  // 'Trojan', 'Malware', 'Botnet', etc.
      count: number,
      percentage: number
    }],
    
    topThreatTypes: string[],  // Most common threat types
    
    recentActivity: [{
      ioc: string,
      type: string,
      verdict: string,
      severity: string,
      searchedAt: string
    }],
    
    timelineData: [{
      date: string,        // YYYY-MM-DD
      malicious: number,
      suspicious: number,
      harmless: number,
      total: number
    }]
  },
  metadata: {
    userId: string,
    timeRange: string,
    startDate: string,
    endDate: string,
    cached: boolean,
    generatedAt: string
  }
}
```

**Processing Flow:**
```
1. Authentication
2. Check cache (30-second TTL)
   └─ If cached: Return immediately
3. Check if user index exists
   └─ If not: Return empty dashboard
4. Fetch user's IOC list (client index)
5. Batch fetch VT data (global cache)
6. Calculate aggregations:
   ├─ Overview stats
   ├─ Type distribution
   ├─ Verdict distribution
   ├─ Severity distribution
   ├─ Threat type distribution
   ├─ Top threats (sorted by severity)
   ├─ Recent activity (last 20)
   └─ Timeline data (daily aggregates)
7. Save to cache
8. Return dashboard data
```

**Cache Strategy:**
- Memory cache: 30 seconds
- Per user + time range
- Auto-refresh on force=true

---

## Service Layer Architecture

### IOC Analysis Service
**File:** `src/app/api/ioc-v2/services/analyzer.ts`

**Main Function:** `analyzeIOC(ioc, label?, userId?)`

**Flow:**
```typescript
async function analyzeIOC(ioc, label, userId) {
  // 1. Detect IOC type
  const iocType = detectIOCType(ioc);
  
  // 2. Validate format
  validateIOC(ioc, iocType);
  
  // 3. Check cache
  const cached = await getIOCFromCache(ioc, iocType, userId);
  if (cached) return formatResponse(cached, true);
  
  // 4. Fetch from VT
  const vtResult = await vtClient.lookupIOCEnhanced(ioc, iocType);
  
  // 5. Type-specific processing
  if (iocType === 'ip') {
    // Fetch geolocation
    const geoData = await getGeolocationData(ioc);
    
    // Check AbuseIPDB
    const abuseData = await checkAbuseIPDB(ioc);
    
    // Compute unified risk
    const riskData = computeIPRisk(vtResult.summary, abuseData);
    
    // Build reputation data
    const ipReputationData = {
      geolocation: geoData,
      abuseipdb: abuseData,
      riskScore: riskData.riskScore,
      riskLevel: riskData.riskLevel,
      ...
    };
  } else if (iocType === 'hash') {
    // Fetch MITRE ATT&CK
    const mitreData = await vtClient.fetchMitreAttack(ioc);
    
    // Fetch code insights
    const codeInsights = await vtClient.fetchCodeInsights(ioc);
    
    // Extract file info
    const fileInfo = extractFileInfo(vtResult, ioc);
    
    // Generate sandbox analysis
    const sandboxAnalysis = generateSandboxData(vtResult.summary.malicious);
  } else {
    // Domain/URL: Just compute severity
    const riskData = computeNonIPSeverity(vtResult.summary, iocType);
  }
  
  // 6. Extract threat intelligence
  const threatIntel = extractThreatIntel(vtResult, abuseData, detections);
  
  // 7. Build document
  const iocDoc = {
    ioc,
    type: iocType,
    label,
    vt: { raw: vtResult.raw, normalized: vtNormalized, ... },
    threat_intel: threatIntel,
    reputation_data: ipReputationData,
    fetchedAt: new Date(),
    cacheTtlSec: 86400
  };
  
  // 8. Save to OpenSearch
  await saveIOCAnalysis(iocDoc);
  
  // 9. Format and return
  return formatResponse(iocDoc, false);
}
```

---

### Helper Modules

#### **ip-reputation.ts**
**Purpose:** IP geolocation and reputation checking

**Key Functions:**

1. **`getGeolocationData(ip)`**
   - **Providers:** EagleEyeSOC (primary), ip-api.com (fallback), ipapi.co (secondary)
   - **Retry logic:** 3 attempts with exponential backoff
   - **Timeout:** 5 seconds per request
   - **Returns:** GeolocationData (country, region, city, ISP, ASN, lat/lon)

2. **`checkAbuseIPDB(ip)`**
   - **API:** AbuseIPDB v2
   - **Returns:** Abuse confidence score, total reports, usage type, whitelist status

3. **`getRiskLevelDetails(riskLevel, riskScore)`**
   - **Input:** Risk level (critical/high/medium/low) + score (0-100)
   - **Returns:** UI display details (color, badge, label, description, recommendation, action)

4. **`extractThreatInfo(vtData, abuseData)`**
   - **Extracts:** Categories, tags, malware families
   - **Returns:** ThreatInfo object

5. **`generateNetworkAnalysis(ip)`**
   - **Placeholder:** Returns WHOIS, DNS records, open ports (not implemented)

6. **`generateThreatIntelligence(ip, vtData, abuseData)`**
   - **Aggregates:** Blacklist info, feeds, reports, first/last seen

---

#### **risk-unified.ts**
**Purpose:** Unified risk scoring for all IOC types

**Key Functions:**

1. **`computeIPRisk(vtSummary, abuseData)`**
   - **For:** IP addresses only
   - **Logic:**
     ```typescript
     riskScore = (
       (malicious / totalScans) * 40 +
       (suspicious / totalScans) * 20 +
       (abuseConfidence) * 0.4
     )
     
     if (riskScore >= 70) riskLevel = 'critical'
     else if (riskScore >= 50) riskLevel = 'high'
     else if (riskScore >= 25) riskLevel = 'medium'
     else riskLevel = 'low'
     ```
   - **Returns:** riskScore, riskLevel, verdict, severity, confidence, riskDetails

2. **`computeNonIPSeverity(vtSummary, iocType)`**
   - **For:** Hash, Domain, URL
   - **Logic:**
     ```typescript
     if (malicious > 10) severity = 'critical', verdict = 'malicious'
     else if (malicious > 5) severity = 'high', verdict = 'malicious'
     else if (malicious > 2) severity = 'medium', verdict = 'malicious'
     else if (malicious > 0) severity = 'low', verdict = 'malicious'
     else if (suspicious > 5) severity = 'medium', verdict = 'suspicious'
     else if (suspicious > 0) severity = 'low', verdict = 'suspicious'
     else severity = 'clean', verdict = 'harmless'
     ```
   - **Returns:** verdict, severity, confidence (NO riskScore/riskLevel)

**Key Distinction:**
- **IPs:** Get riskScore (0-100) + riskLevel + severity
- **Others:** Get severity only (no risk score)

---

#### **threat-intel.ts**
**Purpose:** Extract threat intelligence from VT results

**Key Functions:**

1. **`extractThreatIntel(vtResult, abuseData, allDetections)`**
   - Extracts threat types from VT tags
   - Adds 'Abuse Reported' if AbuseIPDB score > 50
   - Calculates severity based on malicious count
   - Returns ThreatIntel object

2. **`determineVerdict(summary, abuseData)`**
   - Determines verdict based on stats
   - Considers AbuseIPDB data for IPs

3. **`calculateReputation(summary)`**
   - Simple reputation formula: clean - (malicious * 2) - suspicious

---

#### **vt.ts**
**Purpose:** Parse VT API responses

**Key Functions:**

1. **`extractFileInfo(vtResult, hash)`**
   - Extracts file metadata (name, size, type, hashes, dates)

2. **`extractAllDetections(vtResult)`**
   - Parses last_analysis_results
   - Returns array of Detection objects (engine, category, result)

3. **`extractFamilyLabels(vtResult)`**
   - Filters VT tags for malware family names
   - Removes generic terms (trojan, virus, gen, etc.)
   - Returns top 10 family labels

4. **`determinePopularThreat(detections, familyLabels)`**
   - Finds most common threat name across detections
   - Falls back to first family label

5. **`parseMitreAttack(mitreData)`**
   - Parses MITRE ATT&CK data from VT
   - Extracts tactics and techniques
   - Returns MitreAttackData object

6. **`generateSandboxData(maliciousCount)`**
   - Generates synthetic sandbox analysis based on malicious count
   - Returns behavior analysis if malicious > 0

---

#### **formatters.ts**
**Purpose:** Format API responses consistently

**Key Functions:**

1. **`formatResponse(iocDoc, cached)`**
   - Converts internal document format to API response format
   - Handles IP-specific fields (riskScore/riskLevel)
   - Includes all threat intelligence data

2. **`createErrorResult(ioc, error)`**
   - Creates error response when analysis fails
   - Handles rate limit errors specially
   - Includes default safe values

---

## Type Definitions

**File:** `src/app/api/ioc-v2/types.ts`

```typescript
interface GeolocationData {
  countryCode: string;
  countryName: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org: string;
  asn: string;
  asnName: string;
}

interface AbuseIPDBData {
  abuseConfidencePercentage: number;
  abuseConfidenceScore: number;
  usageType: string;
  isWhitelisted: boolean;
  totalReports: number;
  numDistinctUsers?: number;
  lastReportedAt?: string | null;
}

interface Detection {
  engine: string;      // AV engine name
  category: string;    // malicious/suspicious/harmless
  result: string;      // Threat name
}

interface ThreatIntel {
  threatTypes: string[];
  detections: Detection[];
  severity: string;
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
}

interface IPReputationData {
  riskScore: number;
  verdict: string;
  riskLevel: string;
  confidence: number;
  riskDetails: RiskDetails;
  threats: ThreatInfo;
  network: NetworkAnalysis;
  intelligence: ThreatIntelligence;
  virusTotal: any;
  abuseStats: any;
}

interface MitreTactic {
  id: string;          // e.g., TA0001
  name: string;        // e.g., Initial Access
  description?: string;
  link?: string;
}

interface MitreTechnique {
  id: string;          // e.g., T1059
  name: string;        // e.g., Command and Scripting Interpreter
  description?: string;
  link?: string;
}

interface MitreAttackData {
  tactics: MitreTactic[];
  techniques: MitreTechnique[];
}
```

---

## Database Architecture

### OpenSearch Index Structure

#### **1. iocs_cache (Global Cache)**
**Purpose:** Store complete VirusTotal responses (shared across all users)

**Document Structure:**
```json
{
  "_id": "1.2.3.4",
  "value": "1.2.3.4",
  "type": "ip",
  "vt": {
    "raw": { ... },           // Complete VT API response
    "normalized": {
      "verdict": "malicious",
      "stats": { ... },
      "threatTypes": ["Botnet", "Malware"],
      "detections": [...]
    }
  },
  "threat_intel": {
    "threatTypes": ["Botnet"],
    "detections": [...],
    "severity": "high",
    "confidence": 0.95
  },
  "reputation_data": {
    "sources": ["virustotal", "abuseipdb"],
    "abuseipdb": { ... },
    "greynoise": { ... }
  },
  "verdict": "malicious",
  "reputation_score": -50,
  "detection_count": 15,
  "vt_link": "https://www.virustotal.com/gui/ip-address/1.2.3.4",
  "last_updated": "2026-01-16T10:30:00Z",
  "created_at": "2026-01-16T10:30:00Z",
  "cacheTtlSec": 86400
}
```

**Indexing:** value (keyword) - Primary key

---

#### **2. iocs_client_{userId} (User-Specific Index)**
**Purpose:** Store user's IOC search history and metadata

**Document Structure:**
```json
{
  "_id": "ip_1.2.3.4",
  "client_id": "user123",
  "user_id": "user123",
  "username": "john@example.com",
  "value": "1.2.3.4",
  "type": "ip",
  "ioc_cache_ref": "1.2.3.4",     // Reference to iocs_cache
  "label": "Suspicious IPs from firewall",
  "source": "api_search",          // or "file_upload"
  "searched_at": "2026-01-16T10:30:00Z",
  
  // User annotations
  "user_notes": "Blocked this IP",
  "user_verdict": "confirmed_malicious",
  
  // Graph data (if fetched)
  "graph_summary": {
    "total_nodes": 15,
    "total_relationships": 45,
    "most_connected_type": "contacted_ips",
    "most_connected_count": 20
  },
  "graph_cache_ref": "hash_of_graph_id",
  "graph_viewed": true,
  "graph_viewed_at": "2026-01-16T10:35:00Z",
  
  // File upload metadata (if uploaded via file)
  "metadata": {
    "filename": "suspicious_ips.txt",
    "filesize": 1024,
    "filetype": "text/plain",
    "uploaded_at": "2026-01-16T10:30:00Z"
  },
  
  "created_at": "2026-01-16T10:30:00Z",
  "updated_at": "2026-01-16T10:35:00Z"
}
```

**Indexing:**
- client_id (keyword)
- type (keyword)
- searched_at (date)
- source (keyword)

---

#### **3. graphs_cache (Global Graph Cache)**
**Purpose:** Store VirusTotal graph/relationship data

**Document Structure:**
```json
{
  "_id": "hash_of_graph_id",
  "graph_id": "hash_of_graph_id",
  "ioc_value": "abc123...",
  "ioc_type": "hash",
  
  "root": {
    "id": "root",
    "label": "abc123...",
    "type": "hash",
    "value": "abc123..."
  },
  
  "nodes": [
    {
      "id": "contacted_ips",
      "label": "Contacted IPs",
      "count": 15,
      "items": ["1.2.3.4", "5.6.7.8", ...]
    },
    {
      "id": "contacted_domains",
      "label": "Contacted Domains",
      "count": 8,
      "items": ["evil.com", "malware.net", ...]
    }
  ],
  
  "edges": [
    { "source": "root", "target": "contacted_ips" },
    { "source": "root", "target": "contacted_domains" }
  ],
  
  "metadata": {
    "totalRelationships": 23,
    "vtLink": "https://www.virustotal.com/gui/file/abc123...",
    "timestamp": "2026-01-16T10:30:00Z"
  },
  
  "analytics": {
    "total_nodes": 8,
    "total_relationships": 23,
    "most_connected_type": "contacted_ips",
    "most_connected_count": 15,
    "relationship_types": ["contacted_ips", "contacted_domains", ...]
  },
  
  "fetched_at": "2026-01-16T10:30:00Z",
  "expires_at": "2026-01-17T10:30:00Z",
  "last_updated": "2026-01-16T10:30:00Z",
  "access_count": 5,
  "ttl_sec": 86400
}
```

**Indexing:**
- graph_id (keyword) - Primary key
- ioc_value (keyword)
- ioc_type (keyword)
- expires_at (date)

---

## Centralization Opportunities

### Current Issues:

1. **Duplicate IOC Operations**
   - `ioc.ts` and `ioc-advanced.ts` have overlapping functionality
   - `ioc.ts` is simpler, `ioc-advanced.ts` is feature-rich
   - **Recommendation:** Deprecate `ioc.ts`, use only `ioc-advanced.ts`

2. **VT Client Duplication**
   - `vt.ts` (server-side wrapper)
   - `vt-orchestrator.ts` (core logic)
   - `vt-client.ts` (browser-side proxy)
   - **Current:** This separation is intentional (server vs client), but could be better organized

3. **Normalization Logic Scattered**
   - `normalize.ts` has normalization functions
   - `vt-orchestrator.ts` also extracts threat types
   - **Recommendation:** Centralize all normalization in `normalize.ts`

4. **Graph Operations Isolated**
   - Graph operations are separate from IOC operations
   - Should be integrated more tightly

5. **Validation Logic**
   - `validators.ts` has schemas
   - Individual files also do validation
   - **Recommendation:** Use Zod schemas everywhere

---

### Proposed Centralized Architecture:

```
src/lib/
├── opensearch/
│   ├── client.ts                    # Keep as-is
│   ├── indexes.ts                   # Keep as-is
│   ├── operations.ts                # NEW: Merge ioc.ts + ioc-advanced.ts + graph-advanced.ts
│   └── queries.ts                   # NEW: Advanced search/filter logic
│
├── virustotal/
│   ├── orchestrator.ts              # Keep (core logic)
│   ├── server.ts                    # Rename from vt.ts (server-side wrapper)
│   ├── client.ts                    # Rename from vt-client.ts (browser-side)
│   └── types.ts                     # NEW: Shared VT types
│
├── core/
│   ├── normalize.ts                 # Centralized normalization (move all logic here)
│   ├── validators.ts                # Keep (Zod schemas)
│   ├── types.ts                     # NEW: Shared types across all modules
│   └── utils.ts                     # NEW: Common utilities
│
└── services/
    ├── ioc-service.ts               # NEW: High-level IOC service (orchestrates everything)
    └── graph-service.ts             # NEW: High-level graph service
```

---

### Centralized Service Layer Proposal:

#### **`src/lib/services/ioc-service.ts`** (NEW)

```typescript
export class IOCService {
  /**
   * Analyze IOC with full pipeline:
   * 1. Validate input
   * 2. Check cache
   * 3. Fetch from VT if needed
   * 4. Normalize response
   * 5. Save to OpenSearch
   * 6. Return result
   */
  async analyze(ioc: string, userId?: string, options?: {
    label?: string;
    source?: 'api_search' | 'file_upload';
    forceRefresh?: boolean;
  }): Promise<IOCAnalysisResult>;

  /**
   * Batch analyze IOCs
   */
  async analyzeBatch(iocs: string[], userId?: string, options?: ...): Promise<IOCAnalysisResult[]>;

  /**
   * Get IOC from cache (with user metadata if userId provided)
   */
  async get(ioc: string, userId?: string): Promise<IOCRecord | null>;

  /**
   * Search user's IOCs
   */
  async search(userId: string, filters: IOCQuery): Promise<SearchResult>;

  /**
   * Export user's IOCs
   */
  async export(userId: string, format: 'csv' | 'json', filters?: IOCQuery): Promise<Buffer>;
}

export const iocService = new IOCService();
```

---

## Next Steps for Centralization:

1. **Phase 1: Merge OpenSearch Operations**
   - Create `operations.ts` merging `ioc.ts` + `ioc-advanced.ts` + `graph-advanced.ts`
   - Remove duplicates
   - Keep only advanced versions

2. **Phase 2: Reorganize VT Layer**
   - Rename files for clarity
   - Extract shared types to `types.ts`
   - Ensure clear server/client separation

3. **Phase 3: Create Service Layer**
   - Build `IOCService` and `GraphService`
   - These orchestrate all lower-level operations
   - API routes only call service methods

4. **Phase 4: Consolidate Normalization**
   - Move all normalization logic to `normalize.ts`
   - Remove duplication from orchestrator

5. **Phase 5: Update API Routes**
   - Refactor to use new service layer
   - Simplify route handlers

---

## Summary

This system uses a **three-tier architecture**:

1. **Data Sources** (VirusTotal API)
2. **Caching Layer** (OpenSearch with global + client-specific indexes)
3. **API Layer** (Next.js routes)

**Key Flows:**
- IOC submission → VT lookup → Normalization → OpenSearch save → Response
- IOC retrieval → OpenSearch query → JOIN with cache → Response
- Graph generation → VT graph API → OpenSearch save → Response

**Centralization will:**
- Reduce code duplication
- Improve maintainability
- Create clear separation of concerns
- Enable easier testing
- Simplify API routes
