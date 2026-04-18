# History Feature Update - Database Integration Enhancement

## Overview
Updated the history feature to properly fetch and display all information from OpenSearch database, including file metadata, threat intelligence, and enhanced analysis details.

## Changes Made

### 1. Backend API Updates

#### ✅ `/api/history-v2/[ioc]/route.ts` (Detail View)
Updated to use **flattened OpenSearch schema** for better performance and reliability:

**Before:**
- Used nested paths like `globalRecord.vt?.normalized?.stats`
- Missing file metadata from client index
- Inconsistent data structure

**After:**
- Direct flattened fields: `globalRecord.stats_malicious`, `globalRecord.vt_reputation`
- Includes client index metadata (filename, filesize, filetype)
- Parse VT full data JSON for comprehensive file information
- Better error handling with try-catch for JSON parsing

**Key Improvements:**
```typescript
// Stats now use flat fields
stats: {
  malicious: globalRecord.stats_malicious || 0,
  suspicious: globalRecord.stats_suspicious || 0,
  harmless: globalRecord.stats_harmless || 0,
  undetected: globalRecord.stats_undetected || 0
}

// File metadata from client index
metadata: {
  filename: clientSource.metadata?.filename || null,
  filesize: clientSource.metadata?.filesize || null,
  filetype: clientSource.metadata?.filetype || null,
  source: clientSource.source || null
}

// Parse VT full data for file info
fileInfo: iocType === 'hash' ? (() => {
  const vtData = JSON.parse(globalRecord.vt_full_data || '{}');
  return {
    name: vtData.meaningful_name || vtData.names?.[0] || 'Unknown',
    size: vtData.size || 0,
    md5: vtData.md5,
    sha256: vtData.sha256,
    // ... etc
  };
})() : null
```

#### ✅ `/api/history-v2/route.ts` (List View)
Enhanced to include metadata in list responses:

**New Fields:**
```typescript
{
  // ... existing fields
  metadata: {
    filename: source.metadata?.filename || null,
    filesize: source.metadata?.filesize || null,
    filetype: source.metadata?.filetype || null,
    riskScore: cachedData.vt_score || null,
    riskLevel: cachedData.severity || null
  }
}
```

### 2. Frontend Updates

#### ✅ `HistoryTable.tsx`
Enhanced file size display with better formatting:

**Improvement:**
```typescript
const filesize = record.metadata.filesize 
  ? record.metadata.filesize > 1024 * 1024
    ? `${(record.metadata.filesize / (1024 * 1024)).toFixed(2)} MB`
    : `${(record.metadata.filesize / 1024).toFixed(1)} KB`
  : null;
```

#### ✅ `IOCDetailPanel.tsx`
Already has proper file metadata display section that shows:
- Filename
- File size (formatted)
- File type
- Hashes (MD5, SHA1, SHA256)

### 3. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
│               GET /api/history-v2                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│          Query Client Index (iocs_client_{userId})          │
│   - value (IOC)                                             │
│   - type                                                     │
│   - label                                                    │
│   - source                                                   │
│   - searched_at                                              │
│   - metadata { filename, filesize, filetype }               │
│   - ioc_cache_ref ◄─────────────────────┐                  │
└─────────────────────────┬────────────────┴──────────────────┘
                          │                 │
                          │                 │ JOIN
                          ▼                 │
┌─────────────────────────────────────────────────────────────┐
│           Batch Fetch from Cache (iocs_cache)               │
│   - verdict, severity, confidence                           │
│   - stats_malicious, stats_suspicious, etc                  │
│   - threat_types, vt_malware_families                       │
│   - vt_popular_threat_label                                 │
│   - vt_full_data (JSON string with ALL VT data)            │
│   - detections array                                         │
│   - ipqs_fraud_score, greynoise_classification              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Merge & Format Response                         │
│   - Client metadata (file info, user labels)                │
│   - Cache data (threat intel, detections)                   │
│   - Parse vt_full_data for detailed file info               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 Return to Frontend                           │
│   MyAnalysesTable → HistoryTable → Display                  │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Used

### Client Index (`iocs_client_{userId}`)
```json
{
  "value": "8.8.8.8",
  "type": "ip",
  "label": "Google DNS",
  "source": "file_analysis",
  "ioc_cache_ref": "8.8.8.8",
  "searched_at": "2026-01-22T10:30:00Z",
  "metadata": {
    "filename": "malware.exe",
    "filesize": 204800,
    "filetype": "application/x-msdownload"
  },
  "user_verdict": "malicious",
  "user_notes": "Detected in network traffic"
}
```

### Global Cache (`iocs_cache`)
```json
{
  "value": "8.8.8.8",
  "type": "ip",
  "verdict": "malicious",
  "severity": "high",
  "stats_malicious": 45,
  "stats_suspicious": 12,
  "stats_harmless": 3,
  "stats_undetected": 10,
  "threat_types": ["trojan", "malware"],
  "vt_popular_threat_label": "Emotet",
  "vt_malware_families": ["Emotet", "Dridex"],
  "vt_score": 85,
  "vt_reputation": -50,
  "vt_full_data": "{...full VT response...}",
  "detections": [
    {
      "engine": "Kaspersky",
      "category": "malicious",
      "result": "Trojan.Win32.Emotet",
      "method": "heuristic"
    }
  ],
  "ipqs_fraud_score": 95,
  "greynoise_classification": "malicious"
}
```

## Benefits

### ✅ Performance
- Uses flattened fields (no nested path lookups)
- Batch fetches from cache (mget)
- Reduced database queries

### ✅ Reliability
- Handles missing data gracefully
- Try-catch for JSON parsing
- Fallback values for all fields

### ✅ Completeness
- All file metadata visible in UI
- Full threat intelligence displayed
- Risk scores and levels shown
- User-specific data (notes, labels)

### ✅ User Experience
- File analysis shows filename and size
- Clear source indicators (IP search, file analysis, etc.)
- Proper file size formatting (KB/MB)
- Detailed threat information

## Testing

### Test File Analysis History
1. Upload a file via `/file-analysis`
2. Go to `/history`
3. Verify file shows:
   - ✅ Filename in "Analysis" column
   - ✅ File size in "Analysis" column
   - ✅ File icon (FileText)
   - ✅ Click row → detail panel shows full file metadata

### Test IP/Domain History
1. Search an IP/domain
2. Check history shows:
   - ✅ Label or "IP Reputation Check"
   - ✅ Threat types
   - ✅ Detection stats
   - ✅ Risk level

## Next Steps

### Recommended Enhancements
1. **Add Filters:**
   - Filter by source (file_analysis, ip_search, etc.)
   - Already implemented in `HistoryFilters.tsx`

2. **Export with Metadata:**
   - Include filename/filesize in CSV export
   - Already supported in export function

3. **Graph Integration:**
   - Add graph_cache_ref to history display
   - Show "View Graph" button if available

## API Reference

### GET `/api/history-v2`
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search query
- `type`: Filter by IOC type (ip, domain, url, hash)
- `verdict`: Filter by verdict (malicious, suspicious, harmless)
- `source`: Filter by source (file_analysis, ip_search, etc.)
- `sortBy`: Sort field (default: searched_at)
- `sortOrder`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "doc_id",
        "ioc": "8.8.8.8",
        "type": "ip",
        "verdict": "malicious",
        "stats": { "malicious": 45, "suspicious": 12, ... },
        "searchedAt": "2026-01-22T10:30:00Z",
        "threatTypes": ["trojan", "malware"],
        "severity": "high",
        "popularThreatLabel": "Emotet",
        "familyLabels": ["Emotet"],
        "label": "Suspicious IP",
        "source": "file_analysis",
        "metadata": {
          "filename": "malware.exe",
          "filesize": 204800,
          "filetype": "application/x-msdownload",
          "riskScore": 85,
          "riskLevel": "high"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 47,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

### GET `/api/history-v2/[ioc]`
Returns detailed information including:
- Full detection list
- File information (for hashes)
- Geolocation (for IPs)
- MITRE ATT&CK (for files)
- Sandbox analysis
- Code insights (YARA, Sigma, IDS)
- User metadata

## Troubleshooting

### Issue: Missing File Metadata
**Cause:** File not saved with metadata in client index
**Solution:** Ensure file upload includes metadata:
```typescript
await saveIOCAnalysis({
  ioc,
  type: 'hash',
  userId,
  source: 'file_analysis',
  fileMetadata: {
    originalFilename: file.name,
    uploadedSize: file.size,
    uploadedType: file.type,
    uploadedAt: new Date().toISOString()
  },
  analysisResult
});
```

### Issue: Stats Showing Zero
**Cause:** Using old nested schema instead of flattened
**Solution:** Updated in this PR - use flat fields like `stats_malicious`

### Issue: VT Data Not Showing
**Cause:** `vt_full_data` not parsed or corrupted
**Solution:** Added try-catch with fallback values

## Conclusion

The history feature now properly displays all information from the OpenSearch database with:
- ✅ File metadata (filename, size, type)
- ✅ Threat intelligence (types, severity, labels)
- ✅ Detection statistics (malicious, suspicious, clean)
- ✅ User-specific data (labels, notes, verdicts)
- ✅ Source tracking (file_analysis, ip_search, etc.)
- ✅ Enhanced formatting and UI display

All data flows correctly from database → API → frontend with proper error handling and fallback values.
