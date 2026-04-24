# Backend & Error Handling Issues Report
Generated: 2026-04-24
Total Issues Found: 42
Critical Issues: 8

---

## SUMMARY TABLE

| # | Category | File | Route | Severity | Status |
|---|----------|------|-------|----------|--------|
| BE-001 | Missing Try/Catch | ioc-v2/route.ts | POST | MEDIUM | OPEN |
| BE-002 | Missing Try/Catch | domain-intel/route.ts | GET | MEDIUM | OPEN |
| BE-003 | Inconsistent Response | ioc-v2/route.ts | GET | HIGH | OPEN |
| BE-004 | Inconsistent Response | dashboard-v2/route.ts | GET | HIGH | OPEN |
| BE-005 | Inconsistent Response | auth/logout/route.ts | POST | MEDIUM | OPEN |
| BE-006 | Inconsistent Response | contact/route.ts | POST | MEDIUM | OPEN |
| BE-007 | HTTP Status Misuse | file-analysis-v2/route.ts | POST | HIGH | OPEN |
| BE-008 | HTTP Status Misuse | ioc-v2/route.ts | POST | MEDIUM | OPEN |
| BE-009 | Input Validation | contact/route.ts | POST | HIGH | OPEN |
| BE-010 | Input Validation | ioc-v2/route.ts | GET | MEDIUM | OPEN |
| BE-011 | Input Validation | dashboard-v2/route.ts | GET | MEDIUM | OPEN |
| BE-012 | Input Validation | domain-intel/route.ts | GET | MEDIUM | OPEN |
| BE-013 | Input Validation | file-analysis-v2/route.ts | POST | HIGH | OPEN |
| BE-014 | DB Error Handling | ioc-cache.ts | saveIOCAnalysis | MEDIUM | OPEN |
| BE-015 | DB Error Handling | ioc-cache.ts | getUserHistory | MEDIUM | OPEN |
| BE-016 | DB Error Handling | ioc-cache.ts | recordUserHistory | MEDIUM | OPEN |
| BE-017 | DB Error Handling | dashboard-v2/route.ts | GET | MEDIUM | OPEN |
| BE-018 | External API | domain-intel/route.ts | GET (RDAP) | HIGH | OPEN |
| BE-019 | External API | domain-intel/route.ts | GET (crt.sh) | HIGH | OPEN |
| BE-020 | External API | ioc-v2/route.ts | POST (geo/abuse) | MEDIUM | OPEN |
| BE-021 | External API | General | All external fetches | CRITICAL | OPEN |
| BE-022 | Error Propagation | ioc-v2/route.ts | GET | HIGH | OPEN |
| BE-023 | Error Propagation | file-analysis-v2/route.ts | POST | HIGH | OPEN |
| BE-024 | Error Propagation | apiFetch.ts | All | MEDIUM | OPEN |
| BE-025 | Rate Limiting | auth/login/route.ts | POST | CRITICAL | OPEN |
| BE-026 | Rate Limiting | auth/register/route.ts | POST | CRITICAL | OPEN |
| BE-027 | Rate Limiting | contact/route.ts | POST | HIGH | OPEN |
| BE-028 | Rate Limiting | ioc-v2/services/rate-limit.ts | All | HIGH | OPEN |
| BE-029 | Rate Limiting | domain-intel/route.ts | GET | HIGH | OPEN |
| BE-030 | Rate Limiting | history-v2/route.ts | GET | MEDIUM | OPEN |
| BE-031 | Auth/JWT | ioc-v2/route.ts | POST/GET | CRITICAL | OPEN |
| BE-032 | Auth/JWT | dashboard-v2/route.ts | GET | HIGH | OPEN |
| BE-033 | Auth/JWT | auth.ts | verifyToken | HIGH | OPEN |
| BE-034 | Auth/JWT | system-user.ts | N/A | CRITICAL | OPEN |
| BE-035 | Auth/JWT | auth/logout/route.ts | POST | MEDIUM | OPEN |
| BE-036 | Logging | contact/route.ts | POST | MEDIUM | OPEN |
| BE-037 | Logging | ioc-v2/route.ts | POST | MEDIUM | OPEN |
| BE-038 | Logging | file-analysis-v2/route.ts | POST | MEDIUM | OPEN |
| BE-039 | Logging | General | All routes | LOW | OPEN |
| BE-040 | DB Error Handling | ioc-cache.ts | userId bug | CRITICAL | OPEN |
| BE-041 | Input Validation | history-v2/route.ts | GET (RegExp) | HIGH | OPEN |
| BE-042 | Input Validation | ioc-cache.ts | getUserHistory (RegExp) | HIGH | OPEN |

---

## CATEGORY 1 — MISSING TRY/CATCH

### Issue BE-001
**File:** src/app/api/ioc-v2/route.ts
**Function:** POST handler, lines 247–250
**Severity:** MEDIUM
**Problem:**
`getGeolocationData()` and `checkAbuseIPDB()` are called with `await Promise.all()` but **without** `.catch()` handlers in the IP enrichment section (line 247). If either fails, the entire promise rejects and the outer catch handles it, but the partial IP analysis result is lost.
**Current Code:**
```ts
const [geoData, abuseData] = await Promise.all([
  getGeolocationData(iocValue),
  checkAbuseIPDB(iocValue),
]);
```
**Fix:**
Add `.catch(() => null)` to each, consistent with the error-case handling at line 160–162:
```ts
const [geoData, abuseData] = await Promise.all([
  getGeolocationData(iocValue).catch(() => null),
  checkAbuseIPDB(iocValue).catch(() => null),
]);
```

### Issue BE-002
**File:** src/app/api/domain-intel/route.ts
**Function:** GET handler, lines 44, 159
**Severity:** MEDIUM
**Problem:**
`connectDB()` at line 44 has no specific error handling. If MongoDB is down, it throws an unhandled exception that falls to the outer catch. The `findOneAndUpdate` at line 159 has no specific error handling — if this fails, the fresh domain intel result is lost even though it was successfully gathered.
**Fix:**
Wrap DB save in try/catch so the response still returns even if caching fails:
```ts
try {
  await IocCache.findOneAndUpdate(...);
} catch (dbErr) {
  console.error('[domain-intel] Cache save failed:', dbErr);
}
```

---

## CATEGORY 2 — INCONSISTENT ERROR RESPONSE SHAPES

### Issue BE-003
**File:** src/app/api/ioc-v2/route.ts
**Line:** 511–517
**Severity:** HIGH
**Code Found:**
```ts
return NextResponse.json(
  { error: 'Internal server error',
    details: error instanceof Error ? error.message : 'Unknown error' },
  { status: 500 }
);
```
**Problem:**
GET handler error response uses `{ error, details }` shape — missing the `success` field. The POST handler error response at line 337 uses `{ success: false, error }`. These are inconsistent.
**Fix:**
Standardize to:
```ts
return NextResponse.json(
  { success: false, error: 'internal_error', message: 'Something went wrong' },
  { status: 500 }
);
```

### Issue BE-004
**File:** src/app/api/dashboard-v2/route.ts
**Line:** 604–610
**Severity:** HIGH
**Code Found:**
```ts
return NextResponse.json(
  { error: 'Failed to build dashboard payload',
    message: error?.message ?? 'Unknown error' },
  { status: 500 }
);
```
**Problem:**
Error response uses `{ error, message }` without `success: false`. Also leaks internal error message via `error?.message`.
**Fix:**
```ts
return NextResponse.json(
  { success: false, error: 'dashboard_error', message: 'Failed to load dashboard data' },
  { status: 500 }
);
```

### Issue BE-005
**File:** src/app/api/auth/logout/route.ts
**Line:** 14–16
**Severity:** MEDIUM
**Code Found:**
```ts
return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
```
**Problem:**
Missing `success: false`. Different shape from other auth endpoints which use `{ success: false, error: { message: '...' } }`.
**Fix:**
```ts
return NextResponse.json({ success: false, error: { message: 'Logout failed' } }, { status: 500 });
```

### Issue BE-006
**File:** src/app/api/contact/route.ts
**Line:** 38–40
**Severity:** MEDIUM
**Code Found:**
```ts
return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
```
**Problem:**
Error response uses `{ error: string }` instead of `{ error: { message: string } }`. Inconsistent with auth endpoints.
**Fix:**
Standardize to `{ success: false, error: { message: 'Internal server error' } }`.

---

## CATEGORY 3 — HTTP STATUS CODE MISUSE

### Issue BE-007
**File:** src/app/api/file-analysis-v2/route.ts
**Line:** 213–219
**Severity:** HIGH
**Code Found:**
```ts
return NextResponse.json(
  { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
  { status: 500 }
);
```
**Problem:**
Returns raw `error.message` to the client in production. If the error comes from an internal library or database, this could leak internal system details (file paths, DB queries). All errors returned as 500 — no distinction between validation errors (400) and actual server errors (500).
**Fix:**
```ts
const message = error instanceof Error ? error.message : 'Analysis failed';
console.error('[FileAnalysisV2] Error:', message);
return NextResponse.json(
  { success: false, error: 'Analysis failed' },
  { status: 500 }
);
```

### Issue BE-008
**File:** src/app/api/ioc-v2/route.ts
**Line:** Various
**Severity:** MEDIUM
**Problem:**
The route correctly uses 400, 413, 429, and 500 status codes. However, there is no 502 or 503 when all external APIs fail. When all sources fail, it returns a result with `verdict: 'error'` in a 200 response — the frontend must interpret the body, not the status code.
**Fix:**
Consider returning 502 when all threat intel sources fail:
```ts
if (sourcesAvailable.length === 0) {
  return NextResponse.json(
    { success: false, error: 'All intelligence sources unavailable' },
    { status: 502 }
  );
}
```

---

## CATEGORY 4 — INPUT VALIDATION GAPS

### Issue BE-009
**File:** src/app/api/contact/route.ts
**Line:** 5–6
**Severity:** HIGH
**Problem:**
Contact form has no Zod validation. Only checks for truthy values. No email format validation, no length limits, no sanitization.
**Current Code:**
```ts
const { name, email, subject, message } = body;
if (!name || !email || !subject || !message) { ... }
```
**Fix:**
```ts
const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(255),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});
const parsed = contactSchema.safeParse(body);
```

### Issue BE-010
**File:** src/app/api/ioc-v2/route.ts
**Line:** 367–373
**Severity:** MEDIUM
**Problem:**
GET endpoint query parameters `type`, `verdict`, `severity`, `search` are not validated against allowed values. A user could pass arbitrary strings.
**Fix:**
Validate query params:
```ts
const allowedTypes = ['ip', 'domain', 'url', 'hash'];
const type = allowedTypes.includes(typeParam) ? typeParam : undefined;
```

### Issue BE-011
**File:** src/app/api/dashboard-v2/route.ts
**Line:** 98–99
**Severity:** MEDIUM
**Problem:**
`range` parameter is validated by `toRange()` function (defaulting to 'weekly') which is good. However, no other query params are expected or rejected — an attacker could send many unexpected params without being stopped.
**Fix:**
Low priority — the route only reads `range`, so extra params are harmless.

### Issue BE-012
**File:** src/app/api/domain-intel/route.ts
**Line:** 33
**Severity:** MEDIUM
**Problem:**
Domain parameter is trimmed and lowercased, then validated with `isDomain()`. However, there's no max length check. An extremely long string could cause regex CPU issues.
**Fix:**
Add: `if (domainParam.length > 255) return badRequest;`

### Issue BE-013
**File:** src/app/api/file-analysis-v2/route.ts
**Line:** 31–32
**Severity:** HIGH
**Problem:**
No file type validation. The only check is file size (50MB max). No MIME type or extension validation. A user could upload any file type.
**Fix:**
Add file type validation:
```ts
const allowedMimes = ['application/x-dosexec', 'application/pdf', 'application/zip', ...];
if (!allowedMimes.includes(file.type)) { ... }
```

### Issue BE-041
**File:** src/app/api/history-v2/route.ts
**Line:** 19
**Severity:** HIGH
**Problem:**
User-supplied `search` parameter is passed directly to `new RegExp(params.search, 'i')` without sanitization. This is a ReDoS vulnerability — a malicious regex like `(a+)+$` could hang the server.
**Current Code:**
```ts
const regex = new RegExp(params.search, 'i');
match.$or = [{ value: regex }, { label: regex }];
```
**Fix:**
Escape special regex characters:
```ts
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const regex = new RegExp(escapeRegex(params.search), 'i');
```

### Issue BE-042
**File:** src/lib/ioc-cache.ts
**Line:** 230
**Severity:** HIGH
**Problem:**
Same ReDoS issue — user `search` input passed directly to `new RegExp(filters.search, 'i')`.
**Fix:**
Same regex escaping as BE-041.

---

## CATEGORY 5 — DATABASE ERROR HANDLING

### Issue BE-014
**File:** src/lib/ioc-cache.ts
**Function:** saveIOCAnalysis, line 125
**Severity:** MEDIUM
**Problem:**
`connectDB()` can throw if MongoDB is unreachable. While the caller (ioc-v2 route) handles this, the function itself has no explicit error documentation or retry logic.
**Fix:**
Document that this function may throw, or add try/catch internally.

### Issue BE-015
**File:** src/lib/ioc-cache.ts
**Function:** getUserHistory, line 204
**Severity:** MEDIUM
**Problem:**
`Promise.all` at line 244 runs `countDocuments` and `find` in parallel. If either throws, the other is not cancelled and may leak. No timeout on either query.
**Fix:**
Add mongoose query timeout: `.maxTimeMS(10000)`.

### Issue BE-016
**File:** src/lib/ioc-cache.ts
**Function:** recordUserHistory, line 177
**Severity:** MEDIUM
**Problem:**
No error handling at all — if `IocUserHistory.create()` fails (e.g., validation error or duplicate), the error propagates unhandled.
**Fix:**
Wrap in try/catch and log, allowing the caller to decide if this is fatal.

### Issue BE-017
**File:** src/app/api/dashboard-v2/route.ts
**Line:** 120–133
**Severity:** MEDIUM
**Problem:**
Multiple large `IocUserHistory.find()` queries without `.lean()` on the first call (it's there on line 125) but no `.maxTimeMS()` timeout. For large datasets, these queries could hang.
**Fix:**
Add `.maxTimeMS(15000)` to all dashboard queries.

### Issue BE-040
**File:** src/lib/ioc-cache.ts
**Line:** 156–157
**Severity:** CRITICAL
**Code Found:**
```ts
if (input.userId) {
  await IocUserHistory.create({
    userId: SYSTEM_USER_ID,  // ← BUG: Uses SYSTEM_USER_ID instead of input.userId
```
**Problem:**
When `input.userId` is truthy, the history record is created with `userId: SYSTEM_USER_ID` instead of `userId: input.userId`. This means ALL user history is recorded as the system user, making per-user history queries return nothing for real users (the history-v2 route falls back to "legacy-fallback" showing all users' data).
**Fix:**
```ts
userId: input.userId,  // Use the actual user's ID
```

---

## CATEGORY 6 — EXTERNAL API ERROR HANDLING

### Issue BE-018
**File:** src/app/api/domain-intel/route.ts
**Line:** 73–82
**Severity:** HIGH
**Problem:**
RDAP lookup uses `safeResolve` wrapper which catches errors, but the `fetch()` call has **no timeout**. If `rdap.org` hangs, the entire request hangs indefinitely.
**Fix:**
Add AbortController with timeout:
```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);
const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeout);
```

### Issue BE-019
**File:** src/app/api/domain-intel/route.ts
**Line:** 108–118
**Severity:** HIGH
**Problem:**
crt.sh fetch has no timeout. Also, `JSON.parse(text)` on line 115 will throw if crt.sh returns non-JSON (e.g., HTML error page), but this is inside `safeResolve` which catches it. However, the timeout issue remains.
**Fix:**
Add AbortController timeout as in BE-018.

### Issue BE-020
**File:** src/app/api/ioc-v2/route.ts
**Line:** 247–250
**Severity:** MEDIUM
**Problem:**
`getGeolocationData` and `checkAbuseIPDB` are called without timeout or retry logic. If the geolocation API is down, the request waits indefinitely.
**Fix:**
Add per-function timeouts. The orchestrator should have its own timeout handling.

### Issue BE-021
**File:** General — all external API integrations
**Severity:** CRITICAL
**Problem:**
No centralized external fetch wrapper with:
- Timeout handling (AbortController)
- Retry logic for transient failures (503, network errors)
- Circuit breaker pattern for repeatedly failing APIs
- Per-source error isolation (one source failing shouldn't affect others)
**Fix:**
Create `src/lib/external-fetch.ts`:
```ts
export async function externalFetch(url: string, opts: ExternalFetchOptions) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      if (res.status === 429) throw new RateLimitError(res);
      throw new ExternalApiError(res.status);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new TimeoutError(url);
    throw err;
  }
}
```

---

## CATEGORY 7 — ERROR PROPAGATION TO FRONTEND

### Issue BE-022
**File:** src/app/api/ioc-v2/route.ts
**Line:** 514
**Severity:** HIGH
**Code Found:**
```ts
details: error instanceof Error ? error.message : 'Unknown error',
```
**Problem:**
GET handler leaks internal `error.message` (which could contain DB connection strings, file paths, or stack trace info) directly to the frontend.
**Fix:**
Log the error internally, return generic message:
```ts
console.error('[IOC-API-V2] Error:', error);
return NextResponse.json(
  { success: false, error: 'internal_error', message: 'Something went wrong' },
  { status: 500 }
);
```

### Issue BE-023
**File:** src/app/api/file-analysis-v2/route.ts
**Line:** 216
**Severity:** HIGH
**Problem:**
Same pattern — `error.message` is returned directly to the client. If a Mongoose error or Node.js error occurs, it could leak internal details.
**Fix:**
Return generic message; log detailed error server-side only.

### Issue BE-024
**File:** src/lib/apiFetch.ts
**Line:** 4–17
**Severity:** MEDIUM
**Problem:**
`apiFetch` doesn't handle non-200 responses. On 401, it retries with the system token, but doesn't check `Content-Type` before calling `.json()` on the retry response. If the server returns HTML (e.g., Next.js error page), `JSON.parse` will fail.
**Fix:**
Check `content-type` header before parsing:
```ts
const contentType = res.headers.get('content-type');
if (!contentType?.includes('application/json')) {
  throw new Error(`Unexpected response type: ${contentType}`);
}
```

---

## CATEGORY 8 — RATE LIMITING GAPS

### Issue BE-025
**File:** src/app/api/auth/login/route.ts
**Severity:** CRITICAL
**Problem:**
**No rate limiting on the login endpoint.** An attacker can brute-force passwords with unlimited login attempts. This is the #1 priority security fix.
**Fix:**
Add rate limiting: 5 attempts per IP per 15 minutes with exponential backoff.

### Issue BE-026
**File:** src/app/api/auth/register/route.ts
**Severity:** CRITICAL
**Problem:**
**No rate limiting on registration.** An attacker can mass-create accounts to pollute the database or use as pivot for other attacks.
**Fix:**
Add rate limiting: 3 registrations per IP per hour.

### Issue BE-027
**File:** src/app/api/contact/route.ts
**Severity:** HIGH
**Problem:**
No rate limiting on contact form. Allows spam flooding.
**Fix:**
Add: 3 contact submissions per IP per hour.

### Issue BE-028
**File:** src/app/api/ioc-v2/services/rate-limit.ts
**Line:** 29
**Severity:** HIGH
**Code Found:**
```ts
const rateLimits = new Map<string, ClientRateLimit>();
```
**Problem:**
Rate limits use in-memory `Map`. On server restart, all rate limits are lost. In a multi-instance deployment, each instance has its own Map, so limits aren't shared. An attacker can bypass by targeting different instances.
**Fix:**
Use persistent storage (MongoDB collection with TTL index or Redis).

### Issue BE-029
**File:** src/app/api/domain-intel/route.ts
**Severity:** HIGH
**Problem:**
No rate limiting at all on domain intelligence endpoint. Each request makes 5+ external API calls (DNS, RDAP, crt.sh). An attacker can exhaust external API quotas.
**Fix:**
Add rate limiting similar to ioc-v2.

### Issue BE-030
**File:** src/app/api/history-v2/route.ts
**Severity:** MEDIUM
**Problem:**
No rate limiting. While this only reads data, it runs expensive MongoDB aggregation pipelines that could be abused for DoS.
**Fix:**
Add read rate limit: 30 requests per minute per IP.

---

## CATEGORY 9 — AUTHENTICATION & JWT ERRORS

### Issue BE-031
**File:** src/app/api/ioc-v2/route.ts
**Line:** 71, 343
**Severity:** CRITICAL
**Problem:**
**No authentication check on POST or GET handlers.** Both handlers use `SYSTEM_USER_ID` directly without verifying any token. Any unauthenticated request can analyze IOCs and consume API quotas.
**Fix:**
Add auth verification:
```ts
const payload = await verifyAuth(request);
if (!payload) return unauthorizedResponse();
const userId = payload.userId;
```

### Issue BE-032
**File:** src/app/api/dashboard-v2/route.ts
**Line:** 95
**Severity:** HIGH
**Code Found:**
```ts
await verifyAuth(request);  // Result is not checked!
const userId = SYSTEM_USER_ID;
```
**Problem:**
`verifyAuth()` is called but its return value is **ignored**. Whether the token is valid or not, the route proceeds with `SYSTEM_USER_ID`. This provides zero authentication protection.
**Fix:**
```ts
const payload = await verifyAuth(request);
if (!payload) return unauthorizedResponse();
const userId = payload.userId;
```

### Issue BE-033
**File:** src/lib/auth.ts
**Line:** 55
**Severity:** HIGH
**Code Found:**
```ts
const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
```
**Problem:**
`jwt.verify()` is called without specifying the `algorithms` option. This means the library will accept any algorithm, including `none` if the JWT library has bugs.
**Fix:**
```ts
const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JwtPayload;
```

### Issue BE-034
**File:** src/lib/system-user.ts
**Line:** 1–12
**Severity:** CRITICAL
**Code Found:**
```ts
export const SYSTEM_USER_ID = 'system-public-user';
export const SYSTEM_CLIENT_TOKEN = 'system-public-token';
```
**Problem:**
The system bypass allows **any request** with `Authorization: Bearer system-public-token` to authenticate as the system user. This is a hardcoded backdoor — the token is a plain string `system-public-token`, not a JWT. Auth verification in `auth.ts` line 47 explicitly checks for this token and returns a valid payload.
**Attack Scenario:**
```bash
curl -H "Authorization: Bearer system-public-token" https://app/api/history-v2
# Returns all history data for the system user
```
**Fix:**
Remove the system token authentication bypass entirely. If anonymous access is needed, create a proper guest role with limited permissions.

### Issue BE-035
**File:** src/app/api/auth/logout/route.ts
**Line:** 3–19
**Severity:** MEDIUM
**Problem:**
Logout endpoint doesn't actually invalidate the token. It just returns success. The JWT remains valid until expiry (7 days). There's no token blacklist.
**Fix:**
Implement token blacklist in MongoDB with TTL matching token expiry, or switch to short-lived access tokens + refresh tokens.

---

## CATEGORY 10 — LOGGING GAPS

### Issue BE-036
**File:** src/app/api/contact/route.ts
**Line:** 17
**Severity:** MEDIUM
**Code Found:**
```ts
console.log('Contact form submission:', { name, email, subject, message });
```
**Problem:**
Logs the full contact form submission including PII (name, email, message content) to stdout in production.
**Fix:**
Remove or redact: `console.log('Contact form submission from:', email.split('@')[0] + '@***');`

### Issue BE-037
**File:** src/app/api/ioc-v2/route.ts
**Line:** 151
**Severity:** MEDIUM
**Code Found:**
```ts
console.log(`[IOC-API-V2] Cache check failed: ${cacheError.message}`);
```
**Problem:**
Uses `console.log` instead of `console.error` for an error condition. Inconsistent with other error logging.
**Fix:**
Change to `console.error`.

### Issue BE-038
**File:** src/app/api/file-analysis-v2/route.ts
**Line:** 59
**Severity:** MEDIUM
**Code Found:**
```ts
console.log(`[FileAnalysisV2] 📦 Processing: ${file.name} (${file.size} bytes) for user ${userId}`);
```
**Problem:**
Logs the uploaded filename and user ID in production. While useful for debugging, uploaded filenames could be sensitive.
**Fix:**
Use structured logging with log levels. Only include filename hash in production.

### Issue BE-039
**File:** General
**Severity:** LOW
**Problem:**
No structured logging utility. Uses raw `console.log`/`console.error` throughout with inconsistent prefixes (`[IOC-API-V2]`, `[FileAnalysisV2]`, `[History-v2]`, `[MongoDB]`, no prefix on auth routes).
**Fix:**
Create `src/lib/logger.ts`:
```ts
export const logger = {
  info: (route: string, msg: string, data?: any) =>
    console.info(`[${route}] [INFO] ${new Date().toISOString()} ${msg}`, data ?? ''),
  error: (route: string, msg: string, data?: any) =>
    console.error(`[${route}] [ERROR] ${new Date().toISOString()} ${msg}`, data ?? ''),
  warn: (route: string, msg: string, data?: any) =>
    console.warn(`[${route}] [WARN] ${new Date().toISOString()} ${msg}`, data ?? ''),
};
```

---

## STATUS CODE REFERENCE GUIDE

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | Success | Successful GET/POST/PUT response |
| 201 | Created | After successful registration |
| 400 | Bad Request | Invalid/missing request body fields |
| 401 | Unauthorized | No valid token / token expired |
| 403 | Forbidden | Valid token but wrong role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate username on register |
| 413 | Payload Too Large | File/body exceeds size limit |
| 422 | Unprocessable | Valid format but invalid data |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Unhandled internal error |
| 502 | Bad Gateway | External API returned error |
| 503 | Unavailable | DB/external service down |

---

## PRIORITY FIX ORDER

| Priority | Issue | Impact |
|----------|-------|--------|
| 1 | **BE-034** — System token backdoor | Anyone can access all data |
| 2 | **BE-031** — IOC API has no auth | Unauthenticated users can analyze IOCs |
| 3 | **BE-032** — Dashboard ignores auth | Anyone can view dashboard data |
| 4 | **BE-025** — Login has no rate limit | Brute force password attacks |
| 5 | **BE-026** — Register has no rate limit | Mass account creation |
| 6 | **BE-040** — userId bug in saveIOCAnalysis | All history records are system user |
| 7 | **BE-041** — ReDoS in history search | Server DoS via crafted regex |
| 8 | **BE-033** — JWT algorithm not specified | Potential algorithm confusion |
| 9 | **BE-021** — No external fetch timeout | Requests hang forever |
| 10 | **BE-022/023** — Error message leaks | Internal details exposed |

---

## ROUTES WITH NO ERROR HANDLING

All routes have at least a top-level try/catch. No route is completely unhandled. However, the following have **minimal** error handling (just the outer catch):

| Route | Missing |
|-------|---------|
| `/api/auth/me` | No try/catch at all (relies on verifyAuth not throwing) |
| `/api/auth/logout` | Catches but returns inconsistent shape |
| `/api/contact` | No input validation, logs PII |
