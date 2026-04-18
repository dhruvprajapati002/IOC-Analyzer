# Cache Data Flow - Complete Documentation

## Overview
This document explains how IOC analysis data flows from API → Storage → Cache → API Response.

---

## 1. Fresh Analysis Flow

### Step 1: API Request → Multi-Source Orchestrator
**File**: `src/app/api/ioc-v2/route.ts` (Lines 290-293)

```typescript
if (!analysisResult) {
  analysisResult = await orchestrator.analyzeIOC(iocValue, iocType);
}
```

**What happens:**
- Orchestrator queries 6 sources: VirusTotal, GreyNoise, IPQS, ThreatFox, MalwareBazaar, URLhaus
- Each source returns `UnifiedThreatData`
- Data is aggregated into `IOCAnalysisResult`

---

### Step 2: IP Enrichment (Only for IP Type)
**File**: `src/app/api/ioc-v2/route.ts` (Lines 296-340)

```typescript
if (iocType === 'ip') {
  const [geoData, abuseData] = await Promise.all([
    getGeolocationData(iocValue),
    checkAbuseIPDB(iocValue)
  ]);
  const riskResult = calculateIPRiskScore(multiSourceData, abuseData);
  // Add riskScore, riskLevel, reputation to result
}
```

**What's added:**
- `riskScore` (0-100)
- `riskLevel` ('critical' | 'high' | 'medium' | 'low')
- `reputation.geolocation` (country, city, ASN, ISP)
- `reputation.abuseipdb` (abuse score, reports, whitelist)

---

### Step 3: Save to OpenSearch
**File**: `src/app/api/ioc-v2/route.ts` (Lines 342-357)

```typescript
if (!cached) {
  await saveIOCAnalysis({
    ioc: iocValue,
    type: iocType,
    userId: userId,
    username: username,
    label: label,
    source: 'api_search',
    analysisResult: analysisResult,
    fetchedAt: new Date(),
    cacheTtlSec: 3600 // 1 hour for IOCs
  });
}
```

**What's saved:**
1. **Global Cache** (`iocs_cache` index) - Flattened full analysis data
2. **User Index** (`iocs_client_{userId}` index) - Reference + metadata

---

### Step 4: Flatten for Storage
**File**: `src/lib/opensearch/ioc-advanced.ts` (Lines 31-167)

**Critical Fields Stored in `vt_full_data` (JSON string):**

For **Hash Type**:
```json
{
  "md5": "...",
  "sha1": "...",
  "sha256": "...",
  "reputation": 0,
  "popular_threat_classification": {...},
  "last_analysis_stats": {...},
  "last_analysis_date": 1234567890,
  "creation_date": 1234567890,
  "type_description": "Win32 EXE",
  "meaningful_name": "file.exe",
  "names": ["file.exe", "malware.exe"],
  "size": 32256,
  "first_submission_date": 1234567890,
  "last_submission_date": 1234567890,
  "sandbox_verdicts": {
    "C2AE": {
      "category": "undetected",
      "malware_classification": ["UNKNOWN_VERDICT"],
      "sandbox_name": "C2AE"
    }
  },
  "trid": [...],
  "detectiteasy": {...},
  "type_tag": "peexe"
}
```

**Other Flattened Fields:**
- `vt_popular_threat_label`
- `vt_suggested_threat_label`
- `vt_malware_families` (array)
- `threat_types` (array)
- `stats_malicious`, `stats_suspicious`, `stats_harmless`, `stats_undetected`
- `has_virustotal`, `has_greynoise`, `has_ipqs`, etc. (boolean flags)
- Source-specific fields: `greynoise_classification`, `ipqs_fraud_score`, etc.

For **IP Type**:
- `risk_score`, `risk_level`
- `geo_country`, `geo_city`, `geo_asn`, `geo_isp`
- `abuse_confidence`, `abuse_reports`, `abuse_whitelisted`

---

## 2. Cache Retrieval Flow

### Step 1: Check Cache
**File**: `src/app/api/ioc-v2/route.ts` (Lines 107-109)

```typescript
const cachedData = await getIOCFromCache(iocValue, userId);
if (cachedData && cachedData.success !== false) {
  console.log(`[IOC-API-V2] 💾 Cache hit for ${iocValue}`);
}
```

---

### Step 2: Reconstruct from Flattened Data
**File**: `src/lib/opensearch/ioc-advanced.ts` (Lines 349-455)

**Reconstruction Process:**

1. **Parse `vt_full_data` JSON string:**
```typescript
const vtFullData = cacheData.vt_full_data ? JSON.parse(cacheData.vt_full_data) : null;
```

2. **Rebuild `multiSourceData` object:**
```typescript
multiSourceData: {
  virustotal: {
    score: cacheData.vt_score,
    popular_threat_label: cacheData.vt_popular_threat_label,
    suggested_threat_label: cacheData.vt_suggested_threat_label,
    malware_families: cacheData.vt_malware_families,
    full_data: vtFullData  // ✅ Contains all hash info
  },
  greynoise: { ... },
  ipqs: { ... },
  malwarebazaar: { ... },
  threatfox: { ... },
  urlhaus: { ... }
}
```

3. **Return reconstructed data:**
```typescript
return { 
  success: true, 
  data: reconstructedData, 
  cached: true 
};
```

---

### Step 3: Transform to `IOCAnalysisResult` Format
**File**: `src/app/api/ioc-v2/route.ts` (Lines 110-281)

**Key Transformations:**

1. **Extract vtFullData:**
```typescript
const vtFullData = (data as any).multiSourceData?.virustotal?.full_data;
```

2. **Reconstruct vtData:**
```typescript
vtData: {
  available: true,
  score: data.multiSourceData.virustotal.score,
  verdict: data.verdict,
  malware_families: data.multiSourceData.virustotal.malware_families,
  raw_data: vtFullData ? {
    raw: {
      data: {
        attributes: vtFullData
      }
    }
  } : undefined,
  details: {
    popular_threat_label: data.multiSourceData.virustotal.popular_threat_label,
    suggested_threat_label: data.multiSourceData.virustotal.suggested_threat_label,
    stats: data.stats
  }
}
```

3. **Reconstruct all sources:**
```typescript
greynoiseData: { available: true, score, verdict, details },
ipqsData: { available: true, score, verdict, details },
threatfoxData: { available: true, score, verdict, details },
malwarebazaarData: { available: true, score, verdict, details },
urlhausData: { available: true, score, verdict, details }
```

4. **Extract fileInfo (for hash type):**
```typescript
if (type === 'hash' && vtFullData) {
  fileInfo: {
    name: vtFullData.meaningful_name || vtFullData.names[0],
    type: vtFullData.type_description,
    size: vtFullData.size,
    md5: vtFullData.md5,
    sha1: vtFullData.sha1,
    sha256: vtFullData.sha256 || data.ioc,
    firstSeen: new Date(vtFullData.first_submission_date * 1000).toISOString(),
    lastAnalysis: new Date(vtFullData.last_analysis_date * 1000).toISOString(),
    uploadDate: new Date(vtFullData.creation_date * 1000).toISOString()
  }
}
```

5. **Extract sandboxAnalysis (for hash type):**
```typescript
if (vtFullData.sandbox_verdicts) {
  const verdicts = Object.entries(vtFullData.sandbox_verdicts).map(
    ([sandboxKey, verdictData]) => ({
      sandbox: sandboxKey,
      verdict: verdictData.category || 'unknown',
      malware_classification: verdictData.malware_classification || [],
      confidence: verdictData.confidence || 0,
      sandbox_name: verdictData.sandbox_name || sandboxKey
    })
  );
  
  sandboxAnalysis: {
    verdicts: verdicts,
    summary: {
      malicious: verdicts.filter(v => v.verdict === 'malicious').length,
      suspicious: verdicts.filter(v => v.verdict === 'suspicious').length,
      clean: verdicts.filter(v => v.verdict === 'clean').length,
      total: verdicts.length
    }
  }
}
```

6. **Reconstruct IP reputation (for IP type):**
```typescript
if (type === 'ip' && data.reputation_data) {
  riskScore: data.reputation_data.riskScore,
  riskLevel: data.reputation_data.riskLevel,
  reputation: {
    geolocation: {
      countryName: data.reputation_data.geolocation.countryName,
      countryCode: data.reputation_data.geolocation.countryCode,
      city: data.reputation_data.geolocation.city,
      asn: data.reputation_data.geolocation.asn,
      isp: data.reputation_data.geolocation.isp
    },
    abuseipdb: {
      abuseConfidenceScore: data.reputation_data.abuseipdb.abuseConfidenceScore,
      totalReports: data.reputation_data.abuseipdb.totalReports,
      isWhitelisted: data.reputation_data.abuseipdb.isWhitelisted
    }
  }
}
```

---

### Step 4: Format API Response
**File**: `src/lib/threat-intel/orchestrator/multi-source.orchestrator.ts` (Lines 471-635)

```typescript
return formatIOCResponse(analysisResult, cached);
```

**Response Structure:**
```json
{
  "ioc": "a7ac6a84...",
  "type": "hash",
  "verdict": "suspicious",
  "severity": "medium",
  "stats": { ... },
  "threatIntel": { ... },
  "vtData": {
    "popular_threat_label": null,
    "threat_categories": ["Malware", "Trojan"],
    "suggested_threat_label": "trojan.msil/expl",
    "family_labels": ["cve-2021-36934", "exploit"],
    "stats": { ... },
    "raw": { ... },
    "last_analysis_results": { ... }
  },
  "multiSourceData": {
    "virustotal": { ... },
    "greynoise": null,
    "ipqs": null,
    "malwarebazaar": {
      "available": true,
      "verdict": "clean",
      "score": 0
    },
    "threatfox": null,
    "urlhaus": null
  },
  "fileInfo": {
    "name": "CVE-2021-36934.exe",
    "type": "Win32 EXE",
    "size": 32256,
    "md5": "934d6e4d...",
    "sha1": "35af9273...",
    "sha256": "a7ac6a84...",
    "firstSeen": "2025-12-19T08:17:49.000Z",
    "lastAnalysis": "Fri, 26 Dec 2025 11:47:00 GMT",
    "uploadDate": "2080-05-14T00:26:24.000Z"
  },
  "sandboxAnalysis": {
    "verdicts": [
      {
        "sandbox": "C2AE",
        "verdict": "undetected",
        "malware_classification": ["UNKNOWN_VERDICT"],
        "confidence": 0,
        "sandbox_name": "C2AE"
      }
    ],
    "summary": {
      "malicious": 0,
      "suspicious": 0,
      "clean": 1,
      "total": 1
    }
  },
  "cached": true,
  "fetchedAt": "2026-01-19T11:29:04.891Z",
  "sources_available": ["virustotal", "malwarebazaar"],
  "sources_failed": ["greynoise", "ipqs", "threatfox", "urlhaus"]
}
```

---

## 3. Issues Fixed

### ✅ Issue 1: FileInfo Field Names
**Before:** `fileName`, `fileType`, `fileSize`  
**After:** `name`, `type`, `size`

### ✅ Issue 2: Hash Mapping
**Before:** `md5` contained SHA256, `sha1` and `sha256` were empty  
**After:** Correct hashes extracted from `vtFullData.md5`, `vtFullData.sha1`, `vtFullData.sha256`

### ✅ Issue 3: Date Fields
**Before:** `firstSeen`, `lastSeen`  
**After:** `firstSeen`, `lastAnalysis`, `uploadDate`

### ✅ Issue 4: MalwareBazaar Empty Object
**Before:** `{}`  
**After:** `{ available: true, verdict: 'clean', score: 0, details: {...} }`

### ✅ Issue 5: Missing Sandbox Verdicts
**Before:** Always `null` in cached response  
**After:** Extracted from `vtFullData.sandbox_verdicts` if present

### ✅ Issue 6: Missing Hash Fields in Storage
**Before:** `vt_full_data` didn't include `md5`, `sha1`, `sha256`, `sandbox_verdicts`  
**After:** All critical hash fields now stored in cache

---

## 4. Cache vs Fresh Comparison

| Field | Fresh Analysis | Cached Response | Notes |
|-------|---------------|-----------------|-------|
| **ioc** | ✅ | ✅ | Same |
| **verdict** | ✅ | ✅ | Same |
| **stats** | ✅ | ✅ | Same |
| **vtData** | ✅ Full | ✅ Full | Includes popular_threat_label, family_labels |
| **multiSourceData** | ✅ | ✅ | All 6 sources properly reconstructed |
| **fileInfo** | ✅ | ✅ | Correct field names (name/type/size), all hashes |
| **sandboxAnalysis** | ✅ | ✅ | Extracted from vtFullData.sandbox_verdicts |
| **mitreAttack** | ✅ | ❌ null | Not cached (too large, rarely used) |
| **threatIntel.detections** | ✅ 20 items | ❌ [] | Not cached (reduces size by ~50KB) |
| **riskScore/riskLevel** | ✅ (IP only) | ✅ (IP only) | IP reputation data preserved |
| **cached** | `false` | `true` | Indicates data source |

---

## 5. Cache TTL

- **IOC Cache**: 3600 seconds (1 hour)
- **File Cache**: 86400 seconds (24 hours)
- **Expired cache**: Returns `{ success: false, expired: true }`

---

## 6. Testing

### Test Fresh Analysis:
```bash
curl -X POST http://localhost:9000/api/ioc-v2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"iocs":["a7ac6a8432c7b74e4f0ffaf75688a56b5d8e3c7319ffc7cb8d9493b723559985"]}'
```

### Test Cached Response (run same hash again):
```bash
# Same request - should return cached=true with all fields
```

### Verify Cache Storage:
```bash
# Check global cache
curl -X GET http://localhost:9200/iocs_cache/_doc/a7ac6a8432c7b74e4f0ffaf75688a56b5d8e3c7319ffc7cb8d9493b723559985

# Check user index
curl -X GET http://localhost:9200/iocs_client_USER_ID/_doc/hash_a7ac6a8432c7b74e4f0ffaf75688a56b5d8e3c7319ffc7cb8d9493b723559985
```

---

## 7. Summary

**Data Flow:**
```
API Request 
  → Multi-Source Orchestrator (6 sources queried)
  → IP Enrichment (if IP type)
  → Flatten & Save to OpenSearch (iocs_cache + iocs_client_userId)
  → Format Response
  → Return to Client

Cache Hit:
  → Get from OpenSearch (iocs_cache)
  → Reconstruct multiSourceData from flattened storage
  → Transform to IOCAnalysisResult
  → Extract fileInfo, sandboxAnalysis from vtFullData
  → Format Response
  → Return to Client (cached: true)
```

**Storage Optimization:**
- ✅ No nested objects (prevents field explosion)
- ✅ Controlled arrays (max 20 items)
- ✅ Boolean flags instead of full source objects
- ✅ VT full_data as JSON string (parsed on retrieval)
- ✅ Detections not cached (reduces size)
- ✅ MITRE not cached (rarely used)

**Result:** Cached responses now match fresh responses exactly (except for intentionally excluded fields).
