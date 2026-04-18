# History Feature - No Rescan Guide

## ✅ Correct Behavior (What Should Happen)

When you click an IOC from the history page:

```
User clicks IP in History
        ↓
Frontend: IOCDetailPanel.tsx
        ↓
fetch('/api/history-v2/8.8.8.8')
        ↓
Backend: history-v2/[ioc]/route.ts
        ↓
1. Search client index (iocs_client_userid)
2. Get ioc_cache_ref
3. Fetch from cache (iocs_cache)
4. Return cached data
        ↓
✅ Display cached data (NO NEW SCAN)
```

**Expected logs:**
```
[History-v2] 📖 Fetching details for IOC: 8.8.8.8 (user: 123)
[History-v2] ✅ Reading from DATABASE ONLY - NO NEW SCAN
[History-v2] 🔍 Looking up cache for: 8.8.8.8
[History-v2] ✅ Found cached data - Stats: M:45 S:12
[History-v2] 📦 Returning formatted data from cache (no new analysis)
```

**Time:** Should be ~100-300ms (database read only)

---

## ❌ Wrong Behavior (If It's Rescanning)

If you see these logs, it means a NEW scan is happening:

```
[VT-Orchestrator] 🔎 Lookup: ip:8.8.8.8
[VT-Orchestrator] 🔍 Request: ip:8.8.8.8 with key abc12345...
[VT-Orchestrator] ✅ Parsing VT response...
```

**Time:** Takes 5-10 seconds (making API calls)

---

## 🔍 Debugging Steps

### Step 1: Check What's Being Called

1. Open your app in the browser
2. Open **DevTools** (F12)
3. Go to **Network tab**
4. Click an IP from history
5. Look at the network requests

**✅ Correct - Should ONLY see:**
```
GET /api/history-v2/8.8.8.8
Status: 200
Time: ~200ms
```

**❌ Wrong - If you see:**
```
POST /api/analyze
POST /api/ioc
POST /api/threat-intel
```
→ This means frontend is calling the wrong API!

### Step 2: Check Server Logs

Run your app:
```bash
npm run dev
```

Click an IOC from history. Check the terminal for:

**✅ Good:**
```
[History-v2] 📖 Fetching details for IOC: 8.8.8.8
[History-v2] ✅ Reading from DATABASE ONLY - NO NEW SCAN
```

**❌ Bad:**
```
[VT-Orchestrator] 🔎 Lookup: ip:8.8.8.8
```

### Step 3: Verify Database Has Data

Check if the IOC exists in your database:

**Option A: Via API**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/history-v2?page=1&limit=10
```

**Option B: Check OpenSearch directly**
```bash
curl http://localhost:9200/iocs_cache/_search?q=value:8.8.8.8
```

If data exists, you should see:
```json
{
  "hits": {
    "total": { "value": 1 },
    "hits": [{
      "_source": {
        "value": "8.8.8.8",
        "verdict": "malicious",
        "stats_malicious": 45,
        ...
      }
    }]
  }
}
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Frontend Calling Wrong API

**Symptom:** Network tab shows `/api/analyze` or `/api/ioc` instead of `/api/history-v2`

**Fix:** Check `IOCDetailPanel.tsx` line 27:
```typescript
// ✅ Correct
const response = await fetch(`/api/history-v2/${encodeURIComponent(ioc)}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// ❌ Wrong
const response = await fetch(`/api/analyze`, {
  method: 'POST',
  body: JSON.stringify({ ioc })
});
```

### Issue 2: Data Not in Cache

**Symptom:** Logs show "No cached data found for this IOC"

**Cause:** IOC was never analyzed or cache expired

**Fix:** 
1. Analyze the IOC first from `/analyze` page
2. Check cache TTL settings (default: 24 hours)
3. Verify OpenSearch is running: `curl http://localhost:9200`

### Issue 3: Cache Reference Missing

**Symptom:** Client index exists but cache lookup fails

**Cause:** `ioc_cache_ref` field is empty or incorrect

**Fix:** Check client index:
```bash
curl http://localhost:9200/iocs_client_123/_search?q=value:8.8.8.8
```

Should have:
```json
{
  "value": "8.8.8.8",
  "ioc_cache_ref": "8.8.8.8",  ← This must exist
  ...
}
```

### Issue 4: History Button Triggers Re-analyze

**Symptom:** Clicking "View Details" or "Re-analyze" triggers new scan

**Cause:** Button is calling analysis API instead of history API

**Fix:** Check button click handler - should only open detail panel, not trigger analysis

---

## 📊 Performance Comparison

| Action | API Called | Database Queries | External APIs | Time |
|--------|-----------|------------------|---------------|------|
| **View History Details** | `/api/history-v2/[ioc]` | 2 (client + cache) | 0 | ~200ms |
| **New Analysis** | `/api/analyze` or `/api/ioc` | Multiple writes | 5-10 (VT, IPQS, etc.) | 5-10s |

---

## ✅ Verification Checklist

After the fix, verify:

- [ ] Clicking IOC in history takes < 500ms to show details
- [ ] No `[VT-Orchestrator]` logs when viewing history
- [ ] Network tab shows only `/api/history-v2/[ioc]` request
- [ ] Detail panel shows cached data immediately
- [ ] No "Analyzing..." or loading states for long time
- [ ] Browser console shows no errors

---

## 🧪 Test Case

1. **Analyze a new IOC:**
   ```
   Go to /analyze
   Enter: 8.8.8.8
   Click Analyze
   ✅ Should take 5-10s (new scan with API calls)
   ```

2. **View from history:**
   ```
   Go to /history
   Click the 8.8.8.8 row
   ✅ Should take < 500ms (database read only)
   ✅ Should show exact same data
   ```

3. **Verify logs:**
   ```
   Terminal should show:
   [History-v2] 📖 Fetching details for IOC: 8.8.8.8
   [History-v2] ✅ Reading from DATABASE ONLY - NO NEW SCAN
   
   NOT:
   [VT-Orchestrator] 🔎 Lookup: ip:8.8.8.8 ← This means it's rescanning!
   ```

---

## 📞 Still Having Issues?

If history is still triggering rescans:

1. **Share your terminal logs** when clicking history
2. **Share Network tab** screenshot from DevTools
3. **Run this diagnostic:**
   ```bash
   # Check if data exists
   curl http://localhost:9200/iocs_cache/_count
   
   # Should show count > 0 if you have analyzed IOCs
   ```

4. **Check if it's a UI issue:**
   - Does the detail panel show "Loading..." for > 2 seconds?
   - Do you see the same data that was from the original analysis?
   - Or is it showing new/different detection numbers?

---

## Summary

**History feature should:**
- ✅ Read from database ONLY
- ✅ Display cached data
- ✅ Be fast (< 500ms)
- ✅ No API calls to VT/IPQS/etc.
- ✅ No [VT-Orchestrator] logs

**If it's rescanning:**
- ❌ Something is calling `/api/analyze` or `/api/ioc`
- ❌ Or data is missing from cache
- ❌ Check frontend component and network requests
