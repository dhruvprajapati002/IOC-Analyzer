# Graph Route Fix - Using VT Orchestrator

## Problem Identified
The graph route (`/api/ioc/graph`) was using a **custom `VirusTotalGraphClient` class** with a single API key, which:
- ❌ Had no key rotation support
- ❌ Had no rate limit handling
- ❌ Had no error recovery mechanism
- ❌ Used hardcoded endpoints not compatible with orchestrator's error handling
- ❌ Could not handle 429 rate limit errors gracefully

## Solution Implemented
Replaced the custom client with the **working VT Orchestrator** (`vt-orchestrator.ts`) via the `vtClient` exported from `vt.ts`.

### Changes Made

#### 1. **Added Import** (Line 3)
```typescript
import { vtClient } from '@/lib/vt';
```
This brings in the `EnhancedVirusTotalClient` instance that has:
- ✅ 5 API keys with round-robin rotation
- ✅ 45-minute caching
- ✅ Automatic key switching on 403/401 errors
- ✅ Proper 429 rate limit handling

#### 2. **Removed Custom Class** (Lines 67-255)
Deleted the entire `VirusTotalGraphClient` class definition since we now use the orchestrator.

#### 3. **Updated Route Handler** (Lines 87-143)
Changed from:
```typescript
const apiKey = process.env.VT_API_KEY;
const vtClient = new VirusTotalGraphClient(apiKey);
nodes = await vtClient.fetchFileRelationships(value);
```

To:
```typescript
// Uses orchestrator which handles key rotation automatically
const data = await vtClient.fetchFileRelationships(value, relationship);
```

## How It Works Now

```
Graph Route Request
    ↓
Use vtClient (from vt.ts)
    ↓
Calls orchestrator.fetchFileRelationships()
    ↓
Picks available API key (round-robin)
    ↓
Makes VT API call with proper headers
    ├─ If 200 OK → Returns data ✅
    ├─ If 403 Forbidden → Tries next key 🔄
    ├─ If 429 Rate Limited → Queues request ⏸️
    └─ If 401 Unauthorized → Mark key invalid ❌
    ↓
Returns graph data to frontend
```

## Testing

### Before Fix
```
❌ 403 Forbidden errors when single key rate limited
❌ No fallback to other keys
❌ Graph requests fail completely
```

### After Fix
```
✅ Automatic key rotation on 403/401
✅ Rate limit queue for 429 errors
✅ 45-minute response caching
✅ Graceful error handling with fallbacks
```

## API Endpoints Using This Fix

- `GET /api/ioc/graph?value=<hash|ip|domain|url>`

Supports:
- **File hashes**: MD5, SHA1, SHA256
- **IPs**: IPv4 addresses
- **Domains**: Domain names
- **URLs**: HTTP/HTTPS URLs

## Key Features of New Implementation

| Feature | Before | After |
|---------|--------|-------|
| **API Keys** | 1 (single) | 5 (rotated) |
| **Rate Limiting** | ❌ None | ✅ Automatic queue |
| **Error Recovery** | ❌ Fails on 403 | ✅ Next key tried |
| **Caching** | ❌ None | ✅ 45 minutes |
| **Relationship Types** | Limited | Full access |
| **Retry Logic** | ❌ None | ✅ Automatic |

## Files Modified
- `src/app/api/ioc/graph/route.ts` - Refactored to use orchestrator

## Status
✅ **Complete** - Graph route now uses the reliable VT Orchestrator with proper API key management, rate limiting, and error handling.
