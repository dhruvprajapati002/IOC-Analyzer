# File Analysis API - Quick Reference

## Fixed Issues ✅

### OpenSearch Date Format Error
**Status:** RESOLVED

The `mapper_parsing_exception` error for `vt_last_analysis_date` has been fixed. Dates are now properly stored as epoch milliseconds and converted to ISO strings on retrieval.

## API Usage

### Upload File for Analysis

**Endpoint:** `POST /api/file-analysis-v2`

**Request:**
```typescript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('label', 'Optional label');

fetch('/api/file-analysis-v2', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Response (File Found in VT):**
```json
{
  "success": true,
  "verdict": "malicious",
  "confidence": 85,
  "threatLevel": "high",
  "virusTotal": {
    "available": true,
    "verdict": "malicious",
    "score": 0.85,
    "malicious": 45,
    "suspicious": 8,
    "clean": 15,
    "total": 68,
    "detected": 45
  },
  "hashes": {
    "md5": "...",
    "sha1": "...",
    "sha256": "..."
  },
  "cached": false
}
```

**Response (File Uploaded to VT):**
```json
{
  "success": true,
  "verdict": "clean",
  "confidence": 30,
  "threatLevel": "low",
  "vtUpload": {
    "status": "pending",
    "message": "File uploaded to VirusTotal. Analysis results will be available in a few minutes.",
    "analysisId": "...",
    "link": "https://www.virustotal.com/gui/file-analysis/..."
  },
  "hashes": {
    "md5": "...",
    "sha1": "...",
    "sha256": "..."
  },
  "cached": false
}
```

**Response (From Cache):**
```json
{
  "success": true,
  "verdict": "malicious",
  "cached": true,
  ...
}
```

## Cache Behavior

### SHA256-Based Caching

The system uses SHA256 as the primary cache key:

1. **File Upload** → Calculate SHA256
2. **Cache Check** → Look up by SHA256
3. **Cache Hit** → Return immediately (no VT API call)
4. **Cache Miss** → Analyze and store with SHA256 as ID

### Cache Structure

```
Global Cache (iocs_cache)
├─ {sha256}: Full analysis data
│   ├─ vt_last_analysis_date: 1768997144232 (epoch millis)
│   ├─ stats_malicious: 45
│   ├─ verdict: "malicious"
│   └─ ... (all analysis data)

Client Cache (iocs_client_{userId})
├─ hash_{sha256}: User metadata + reference
│   ├─ ioc_cache_ref: {sha256}
│   ├─ label: "My file"
│   ├─ searched_at: "2026-01-21T..."
│   └─ metadata: { filename, size, type }
```

### Cache TTL

- **Default:** 3600 seconds (1 hour)
- **Configurable:** Pass `cacheTtlSec` in request
- **Expiration:** Automatic cleanup based on age

## Date Handling

### Internal Storage (OpenSearch)
```typescript
// Stored as epoch milliseconds
vt_last_analysis_date: 1768997144232  // number
```

### API Response (JSON)
```typescript
// Returned as ISO string
"lastAnalysisDate": "2026-01-21T12:05:44.232Z"  // string
```

### Conversion Functions

**Store:**
```typescript
const epochMillis = new Date(isoString).getTime();
```

**Retrieve:**
```typescript
const isoString = new Date(epochMillis).toISOString();
```

## VirusTotal Integration

### Reputation Check Flow

```
1. Calculate file hashes (MD5, SHA1, SHA256)
2. Check VT reputation by hash
   ├─ Found: Use existing analysis
   │   └─ Extract: verdict, stats, threat names
   └─ Not Found: Upload file
       ├─ Get analysis ID
       ├─ Track upload status
       └─ Return pending status
3. Store results in cache
```

### Upload Status Tracking

When a file is uploaded to VT:
```json
{
  "vtUpload": {
    "status": "pending",
    "message": "File uploaded to VirusTotal. Analysis results will be available in a few minutes.",
    "analysisId": "NjY0MjRlOTY...",
    "link": "https://www.virustotal.com/gui/file-analysis/NjY0MjRlOTY..."
  }
}
```

Users can visit the link to check analysis progress.

## Score Management

### Threat Score Calculation

```typescript
Base Score: 0

+ File Type Risk:
  - High risk (exe, dll, sys):        +20
  - Medium risk (bat, ps1, vbs):      +10
  - Low risk (zip, rar, 7z):          +2

+ VirusTotal Detections:
  - Malicious votes × 10 (max 70):    +0 to +70
  
+ Hash Reputation:
  - Malicious:                        +50
  - Suspicious:                       +25

+ Packed/Encrypted:
  - High entropy detected:            +25

+ YARA Rule Matches:
  - Per matched rule:                 +10

Total Score: 0-200+
```

### Verdict Mapping

```typescript
Score >= 70:  "malicious"
Score >= 40:  "suspicious"
Score >= 20:  "potentially_harmful"
Score <  20:  "clean"
```

### Severity Levels

```typescript
malicious:           "critical" or "high"
suspicious:          "medium"
potentially_harmful: "low"
clean:               "info"
```

## Multi-Source Orchestration

### Hash Review Process

1. **Primary Check (SHA256):**
   ```typescript
   const cached = await getIOCFromCache(sha256, 'hash', userId);
   ```

2. **Source Priority:**
   - **VirusTotal:** File reputation (primary)
   - **ThreatFox:** Malware family identification
   - **MalwareBazaar:** Sample availability check
   - **URLhaus:** URL extraction from samples

3. **Score Aggregation:**
   ```typescript
   finalScore = max(
     vtScore,
     threatFoxScore,
     malwareBazaarScore,
     yaraScore
   );
   ```

4. **Verdict Resolution:**
   ```typescript
   // Most severe verdict wins
   if (any source == 'malicious') verdict = 'malicious';
   else if (any source == 'suspicious') verdict = 'suspicious';
   else verdict = 'clean';
   ```

## Error Handling

### Common Errors

**1. File Too Large**
```json
{
  "success": false,
  "error": "File too large. Maximum size: 100MB"
}
```

**2. Invalid File Type**
```json
{
  "success": false,
  "error": "Invalid file type. Supported: ZIP, EXE, DLL, etc."
}
```

**3. Rate Limit Exceeded**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 60 minutes.",
  "remainingRequests": 0
}
```

**4. OpenSearch Error**
```json
{
  "success": false,
  "error": "Failed to save analysis results"
}
```

### Retry Logic

- **VT API Errors:** Retry 3 times with exponential backoff
- **OpenSearch Errors:** Log and continue (analysis still returns)
- **Rate Limits:** Return error immediately

## Rate Limiting

### Limits
- **10 requests per hour** per user
- **Counter reset:** Every 60 minutes
- **Storage:** In-memory Map (resets on restart)

### Check Remaining Requests

Rate limit info included in all responses:
```json
{
  "success": true,
  "rateLimit": {
    "remaining": 7,
    "resetAt": "2026-01-21T13:00:00.000Z"
  }
}
```

## Debugging

### Enable Debug Logging

Look for these log patterns:

**Cache Operations:**
```
[OpenSearch] ✅ Cache hit: a569eca0cb61dccf...
[OpenSearch] ❌ Cache miss, performing fresh analysis
[OpenSearch] 💾 Saving IOC: a569eca0cb61dccf...
[OpenSearch] ✅ Saved to cache: a569eca0cb61dccf...
```

**VT Operations:**
```
[VT] 📤 Uploading file: malware.exe
[VT] ✅ Uploaded. Analysis ID: NjY0MjRlOTY...
[VT] 📋 SHA256: a569eca0cb61dccf...
```

**Analysis Steps:**
```
[Analysis] 🔍 Analyzing file: test.exe (45678 bytes)
[Analysis] 🎯 VT verdict (malicious): +40 → Total: 40
[Analysis] 🎯 File type (high): +20 → Total: 60
[Analysis] 🎯 Hash reputation: +50 (MALICIOUS) → Total: 110
```

### Common Issues

**Issue:** "Cache hit but analysis failed"
```
Solution: Clear cache for that SHA256:
DELETE /iocs_cache/_doc/{sha256}
```

**Issue:** "VT upload succeeds but status not shown"
```
Solution: Check vtUpload field in response
Verify uploadStatus === 'pending'
```

**Issue:** "Date format errors in logs"
```
Solution: Already fixed! Dates now stored as epoch millis
```

## Testing Commands

### Test Date Conversion
```bash
node scripts/test-opensearch-date-fix.js
```

### Test File Upload
```bash
# Upload test file
curl -X POST http://localhost:3000/api/file-analysis-v2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-files/malware-sample.txt" \
  -F "label=Test Upload"
```

### Check OpenSearch
```bash
# Get cached analysis
curl http://localhost:9200/iocs_cache/_doc/{SHA256}

# Check user history
curl http://localhost:9200/iocs_client_USER_ID/_search
```

## Best Practices

### 1. Always Check Cache First
```typescript
// Good - SHA256-based cache check
const cached = await getIOCFromCache(sha256, 'hash', userId);

// Bad - Skip cache and hit VT API every time
const vt = await checkVirusTotalFileReputation(hashes);
```

### 2. Use Structured Error Handling
```typescript
try {
  const result = await performFileAnalysis(...);
} catch (error) {
  if (error.name === 'RateLimitError') {
    // Handle rate limit
  } else if (error.name === 'OpenSearchError') {
    // Log but don't fail
  }
}
```

### 3. Include Metadata
```typescript
formData.append('label', 'Suspicious Email Attachment');
// Helps with organization and searching later
```

### 4. Handle Pending VT Uploads
```typescript
if (response.vtUpload?.status === 'pending') {
  // Show user the VT link
  showMessage(`Analysis pending. Check: ${response.vtUpload.link}`);
  // Optionally: Poll for results after a few minutes
}
```

## Migration Notes

### Existing Data

Old documents with ISO string dates will still work:
- OpenSearch mapping accepts both formats
- Cache retrieval converts both to ISO strings
- New documents use epoch milliseconds

### Reindex (Optional)

To convert existing ISO strings to epoch:
```javascript
// Migration script (run once)
const docs = await client.search({ index: 'iocs_cache', size: 10000 });
for (const doc of docs.body.hits.hits) {
  if (typeof doc._source.vt_last_analysis_date === 'string') {
    await client.update({
      index: 'iocs_cache',
      id: doc._id,
      body: {
        doc: {
          vt_last_analysis_date: new Date(doc._source.vt_last_analysis_date).getTime()
        }
      }
    });
  }
}
```

---

**For detailed implementation:** See [OPENSEARCH_DATE_FIX.md](./OPENSEARCH_DATE_FIX.md)
**For API documentation:** See [USER_GUIDE.md](./USER_GUIDE.md)
