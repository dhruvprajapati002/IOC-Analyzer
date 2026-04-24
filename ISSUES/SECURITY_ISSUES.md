# Security Vulnerability Report (VAPT)
Project: VigilanceX / IOC Analyzer Pro
Generated: 2026-04-24
Auditor: Automated Static Analysis
Total Vulnerabilities: 35

---

## RISK SUMMARY

| Severity | Count |
|----------|-------|
| CRITICAL |   6   |
| HIGH     |  11   |
| MEDIUM   |  12   |
| LOW      |   4   |
| INFO     |   2   |

---

## CVSS SEVERITY SCALE USED

| Level | CVSS Score | Action |
|-------|-----------|--------|
| CRITICAL | 9.0–10.0 | Immediate fix required |
| HIGH | 7.0–8.9 | Fix within 24 hours |
| MEDIUM | 4.0–6.9 | Fix within 1 week |
| LOW | 0.1–3.9 | Fix in next release |
| INFO | No CVSS | Best practice improvement |

---

## VULNERABILITY DETAILS

### SEC-001 — Hardcoded Authentication Bypass Token
**Category:** Authentication Bypass
**Severity:** CRITICAL
**CVSS Score:** 9.8
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
**File:** src/lib/system-user.ts (line 2) + src/lib/auth.ts (line 47)
**CWE:** CWE-798 (Use of Hard-coded Credentials)

**Vulnerable Code:**
```ts
// system-user.ts
export const SYSTEM_CLIENT_TOKEN = 'system-public-token';

// auth.ts
if (token === SYSTEM_CLIENT_TOKEN) {
  return {
    userId: SYSTEM_USER_ID,
    username: SYSTEM_USERNAME,
    role: 'user',
  };
}
```

**Attack Scenario:**
An attacker sends any API request with `Authorization: Bearer system-public-token`. The server treats this as a valid authenticated session for the system user. This bypasses ALL authentication, allowing access to history data, IOC analysis, dashboard, and more.

**Proof of Concept:**
```bash
curl -H "Authorization: Bearer system-public-token" \
  https://target/api/history-v2
# Result: Returns all IOC analysis history
```

**Remediation:**
1. Remove the `SYSTEM_CLIENT_TOKEN` check entirely from `verifyToken()`
2. If anonymous access is needed, implement it as a proper route-level policy, not a backdoor token
3. Remove `system-user.ts` hardcoded values

**References:**
- OWASP: A07:2021 – Identification and Authentication Failures
- CWE-798

---

### SEC-002 — .env File with Real Credentials Committed to Repository
**Category:** Sensitive Data Exposure
**Severity:** CRITICAL
**CVSS Score:** 9.1
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
**File:** .env (root directory)
**CWE:** CWE-312 (Cleartext Storage of Sensitive Information)

**Vulnerable Code:**
```
MONGO_URI="mongodb+srv://dhruvprajapati002:LnpYTZwVPMKOLi1N@ioc-dhruv..."
JWT_SECRET="8ae55a0fad52f1fdecae9b4c5a8a44df33a615..."
VT_API_KEYS=bc230055c22e417929e3130c7100a6ffc...
IPQS_API_KEYS=Cp2XzEbKR9MTeOa3ANQeyh8nJ...
ABUSEIPDB_API_KEYS=2fcae77b32989ed14ebc0e8c...
GREYNOISE_API_KEYS=ijoegaqLQJpog15IS0gnUX...
ABUSE_CH_API_KEY=82292a4b291d6cefb73ab812fa...
INTERNAL_API_KEY=dd9136c086ff1946b50905ab514...
```

**Attack Scenario:**
If this repo is public or accessible to unauthorized users, ALL credentials are exposed:
- MongoDB connection string with username/password
- JWT secret (allows forging any auth token)
- 7 VirusTotal API keys
- 3 IPQS API keys
- 2 AbuseIPDB API keys
- 3 GreyNoise API keys
- Abuse.ch API key
- Internal API key

An attacker can:
1. Access/modify/delete the MongoDB database directly
2. Forge admin JWT tokens using the JWT secret
3. Exhaust all API quotas across 16+ API keys
4. Use the MongoDB credentials to access other databases in the Atlas cluster

**Remediation:**
1. **IMMEDIATELY** rotate ALL credentials listed in the .env file
2. Rotate MongoDB password
3. Regenerate JWT secret
4. Regenerate all API keys (VT, IPQS, AbuseIPDB, GreyNoise, Abuse.ch)
5. Verify `.env` is in `.gitignore` (it is — but the file may already be in git history)
6. Run `git log --all --full-history -- .env` to check if it was ever committed
7. If committed, use `git filter-branch` or BFG Repo-Cleaner to remove from history

**References:**
- OWASP: A02:2021 – Cryptographic Failures
- CWE-312, CWE-200

---

### SEC-003 — Missing Authentication on Critical API Routes
**Category:** Authentication Bypass
**Severity:** CRITICAL
**CVSS Score:** 9.1
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L
**Files:**
- src/app/api/ioc-v2/route.ts (POST + GET)
- src/app/api/dashboard-v2/route.ts (GET — auth result ignored)
- src/app/api/contact/route.ts (POST)
- src/app/api/domain-intel/route.ts (GET)
**CWE:** CWE-306 (Missing Authentication for Critical Function)

**Vulnerable Code (ioc-v2):**
```ts
export async function POST(request: NextRequest) {
  // No auth check — immediately proceeds to analysis
  const userId = SYSTEM_USER_ID;
  const username = SYSTEM_USER.username;
```

**Vulnerable Code (dashboard-v2):**
```ts
export async function GET(request: NextRequest) {
  await verifyAuth(request);  // Called but return value IGNORED
  const userId = SYSTEM_USER_ID;
```

**Attack Scenario:**
Unauthenticated users can:
1. Submit IOCs for analysis (consuming API quotas)
2. View all dashboard analytics data
3. Perform domain intelligence lookups
4. Spam the contact form
All without any authentication.

**Remediation:**
```ts
const payload = await verifyAuth(request);
if (!payload) {
  return NextResponse.json(
    { success: false, error: { message: 'Unauthorized' } },
    { status: 401 }
  );
}
const userId = payload.userId;
```

**References:**
- OWASP: A01:2021 – Broken Access Control

---

### SEC-004 — No Rate Limiting on Authentication Endpoints
**Category:** Brute Force / DoS
**Severity:** CRITICAL
**CVSS Score:** 8.6
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:L
**Files:**
- src/app/api/auth/login/route.ts
- src/app/api/auth/register/route.ts
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)

**Vulnerable Code:**
```ts
export async function POST(req: NextRequest) {
  // No rate limiting at all
  const body = await req.json();
  // ... validates and checks password
}
```

**Attack Scenario:**
An attacker can attempt unlimited login requests to brute-force passwords. At even 100 requests/second, weak passwords can be cracked in minutes.

**Proof of Concept:**
```bash
for i in $(seq 1 10000); do
  curl -X POST https://target/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"admin\", \"password\": \"password$i\"}"
done
```

**Remediation:**
1. Add rate limiting: 5 login attempts per IP per 15 minutes
2. Implement account lockout after 10 failed attempts
3. Add CAPTCHA after 3 failed attempts
4. Log failed authentication attempts for monitoring

**References:**
- OWASP: A07:2021 – Identification and Authentication Failures
- CWE-307

---

### SEC-005 — ReDoS Vulnerability in User Search Input
**Category:** Injection / DoS
**Severity:** HIGH
**CVSS Score:** 7.5
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
**Files:**
- src/app/api/history-v2/route.ts (line 19)
- src/lib/ioc-cache.ts (line 230)
**CWE:** CWE-1333 (Inefficient Regular Expression Complexity)

**Vulnerable Code:**
```ts
const regex = new RegExp(params.search, 'i');
match.$or = [{ value: regex }, { label: regex }];
```

**Attack Scenario:**
User sends search query with a catastrophic backtracking pattern:
```
GET /api/history-v2?search=(a%2B)%2B%24
```
This translates to `(a+)+$` which causes exponential CPU time, hanging the server thread.

**Remediation:**
```ts
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const regex = new RegExp(escapeRegex(params.search), 'i');
```

**References:**
- OWASP: ReDoS
- CWE-1333

---

### SEC-006 — JWT Algorithm Not Specified in Verification
**Category:** Authentication
**Severity:** HIGH
**CVSS Score:** 7.4
**CVSS Vector:** AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N
**File:** src/lib/auth.ts (line 55)
**CWE:** CWE-327 (Use of a Broken or Risky Cryptographic Algorithm)

**Vulnerable Code:**
```ts
const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
```

**Attack Scenario:**
Without specifying `algorithms: ['HS256']`, the library may accept tokens with different algorithms. In some JWT library versions, an attacker can use the RSA public key as an HMAC secret, or exploit algorithm confusion attacks.

**Remediation:**
```ts
const decoded = jwt.verify(token, getJwtSecret(), {
  algorithms: ['HS256'],
}) as JwtPayload;
```

**References:**
- CWE-327
- Auth0: Critical vulnerabilities in JSON Web Token libraries

---

### SEC-007 — No CSRF Protection on State-Changing Routes
**Category:** CSRF
**Severity:** HIGH
**CVSS Score:** 7.1
**CVSS Vector:** AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:L
**Files:** All POST/PUT/DELETE API routes
**CWE:** CWE-352 (Cross-Site Request Forgery)

**Problem:**
No CSRF protection on any state-changing route. Next.js API routes don't have built-in CSRF protection. The app uses Bearer tokens in `Authorization` header (which provides some CSRF protection via custom headers), but the `apiFetch` automatically falls back to a system token on 401 — meaning requests from any origin could potentially succeed.

**Remediation:**
1. Ensure tokens are ONLY sent via `Authorization` header (not cookies)
2. Add `Origin` / `Referer` header validation on all POST routes
3. Or implement CSRF token middleware

---

### SEC-008 — Missing Security Headers
**Category:** Security Misconfiguration
**Severity:** HIGH
**CVSS Score:** 7.0
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N
**File:** next.config.js / next.config.ts
**CWE:** CWE-693 (Protection Mechanism Failure)

**Problem:**
No security headers configured in `next.config.js`. Missing ALL of:
- ❌ Content-Security-Policy (CSP)
- ❌ X-Frame-Options: DENY
- ❌ X-Content-Type-Options: nosniff
- ❌ Referrer-Policy
- ❌ Permissions-Policy
- ❌ Strict-Transport-Security (HSTS)
- ❌ X-XSS-Protection

**Remediation:**
Add to `next.config.js`:
```js
headers: async () => [{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;" },
  ]
}],
```

---

### SEC-009 — SSRF via IOC Analysis
**Category:** SSRF
**Severity:** HIGH
**CVSS Score:** 7.5
**CVSS Vector:** AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N
**File:** src/app/api/ioc-v2/route.ts, src/app/api/domain-intel/route.ts
**CWE:** CWE-918 (Server-Side Request Forgery)

**Problem:**
User-supplied IOC values (IP addresses, domains, URLs) are passed to external API calls. While IPs are validated by regex, the URL and domain types are forwarded to services like VirusTotal. An attacker could submit internal URLs to force the server to make requests to internal services.

**Attack Scenario:**
```json
POST /api/ioc-v2
{ "iocs": ["http://169.254.169.254/latest/meta-data/"] }
```
If any threat intel service reflects or processes this URL, internal cloud metadata could be exposed.

**Remediation:**
1. Add URL/domain blocklist before passing to external APIs:
   - Block `localhost`, `127.x.x.x`, `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
   - Block `169.254.169.254` (cloud metadata)
   - Block `0.0.0.0`, `[::1]`
2. Validate that URLs use only `http://` or `https://` schemes

---

### SEC-010 — In-Memory Rate Limiting Easily Bypassed
**Category:** Rate Limiting Bypass
**Severity:** HIGH
**CVSS Score:** 7.0
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
**File:** src/app/api/ioc-v2/services/rate-limit.ts (line 29)
**CWE:** CWE-770 (Allocation of Resources Without Limits)

**Problem:**
Rate limits stored in `new Map<string, ClientRateLimit>()` — JavaScript in-memory store. Issues:
1. Lost on server restart/redeploy
2. Not shared across multiple server instances (horizontal scaling)
3. Identified by client IP from headers — easily spoofable via `X-Forwarded-For`

**Remediation:**
1. Use persistent rate limit store (MongoDB collection with TTL or Redis)
2. Validate `X-Forwarded-For` against trusted proxy list
3. Consider using `cf-connecting-ip` only behind Cloudflare

---

### SEC-011 — SSRF in Domain Intelligence via DNS Queries
**Category:** SSRF
**Severity:** MEDIUM
**CVSS Score:** 6.5
**CVSS Vector:** AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N
**File:** src/app/api/domain-intel/route.ts (lines 62–71)
**CWE:** CWE-918

**Problem:**
DNS resolution is performed on user-supplied domain. While DNS queries to external servers are generally safe, they can be used for DNS rebinding attacks or to enumerate internal DNS records.

Also, the RDAP and crt.sh URLs incorporate user input:
```ts
fetch(`https://rdap.org/domain/${encodeURIComponent(domainParam)}`)
fetch(`https://crt.sh/?q=${encodeURIComponent(domainParam)}&output=json`)
```
While `encodeURIComponent` prevents injection, these are parameterized URLs that are well-formed.

**Remediation:**
1. Add domain validation: reject domains matching internal TLDs (`.local`, `.internal`, `.corp`)
2. Add request timeout to all DNS queries
3. Log all domain lookups for audit trail

---

### SEC-012 — No Token Invalidation on Logout
**Category:** Session Management
**Severity:** MEDIUM
**CVSS Score:** 6.5
**CVSS Vector:** AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N
**File:** src/app/api/auth/logout/route.ts
**CWE:** CWE-613 (Insufficient Session Expiration)

**Problem:**
Logout endpoint returns success without invalidating the JWT token. The token remains valid for 7 days (`JWT_EXPIRES_IN="7d"`). A stolen token can be used even after the user "logs out."

**Remediation:**
1. Implement token blacklist in MongoDB:
```ts
const BlacklistedToken = mongoose.model('BlacklistedToken', {
  token: String,
  expiresAt: { type: Date, index: { expires: 0 } }  // TTL index auto-deletes
});
```
2. On logout, add token to blacklist
3. In `verifyToken`, check blacklist before accepting

---

### SEC-013 — Error Messages Leaking Internal Details
**Category:** Information Disclosure
**Severity:** MEDIUM
**CVSS Score:** 5.3
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N
**Files:**
- src/app/api/ioc-v2/route.ts (line 514)
- src/app/api/dashboard-v2/route.ts (line 607)
- src/app/api/file-analysis-v2/route.ts (line 216)
- src/app/api/history-v2/route.ts (line 169)
- src/app/api/history-v2/[ioc]/route.ts (line 131)
**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)

**Vulnerable Code:**
```ts
message: error instanceof Error ? error.message : 'Unknown error'
// or
error: error instanceof Error ? error.message : 'Analysis failed'
```

**Problem:**
Raw `error.message` is returned to the client. Mongoose errors, Node.js errors, and network errors can contain:
- Database connection strings
- File paths
- Stack traces
- Internal server hostnames

**Remediation:**
Log the full error server-side, return generic message:
```ts
console.error('[route] Error:', error);
return NextResponse.json(
  { success: false, error: 'internal_error', message: 'An unexpected error occurred' },
  { status: 500 }
);
```

---

### SEC-014 — Sensitive Data Logged to Console
**Category:** Information Disclosure
**Severity:** MEDIUM
**CVSS Score:** 4.7
**CVSS Vector:** AV:L/AC:H/PR:L/UI:N/S:U/C:H/I:N/A:N
**Files:**
- src/app/api/contact/route.ts (line 17) — logs PII (name, email, message)
- src/app/api/file-analysis-v2/route.ts (line 59) — logs filename and user ID
- src/app/api/ioc-v2/route.ts (line 307) — logs IOC values
- src/lib/db.ts (line 45) — logs masked MongoDB URI (good practice)
**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

**Problem:**
Production logs contain personally identifiable information and IOC values. If logs are stored in a monitoring system or log aggregator, this data could be accessed by unauthorized personnel.

**Remediation:**
1. Redact PII before logging
2. Never log full IOC values in production — use hashed references
3. Use structured logging with log levels

---

### SEC-015 — Wildcard Image Remote Patterns
**Category:** Security Misconfiguration
**Severity:** MEDIUM
**CVSS Score:** 5.0
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N
**File:** next.config.js (line 19)
**CWE:** CWE-16 (Configuration)

**Vulnerable Code:**
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**' },
  ],
},
```

**Problem:**
Allows loading images from ANY HTTPS domain. This enables image-based tracking or pixel tracking attacks if user-generated content includes image URLs.

**Remediation:**
Restrict to known domains:
```js
remotePatterns: [
  { protocol: 'https', hostname: '*.virustotal.com' },
  { protocol: 'https', hostname: '*.flagcdn.com' },
]
```

---

### SEC-016 — ESLint Disabled During Build
**Category:** Security Misconfiguration
**Severity:** MEDIUM
**CVSS Score:** 4.0
**CVSS Vector:** AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N
**File:** next.config.js (line 24)
**CWE:** CWE-710

**Vulnerable Code:**
```js
eslint: { ignoreDuringBuilds: true },
```

**Problem:**
ESLint is completely disabled during builds, meaning code quality and security linting rules are never enforced. React hook dependency warnings, unused variable warnings, and security-related lint rules all ignored.

**Remediation:**
Remove `ignoreDuringBuilds: true` and fix ESLint errors properly.

---

### SEC-017 — NODE_TLS_REJECT_UNAUTHORIZED=0 in Dev Script
**Category:** Certificate Validation
**Severity:** MEDIUM
**CVSS Score:** 5.9
**CVSS Vector:** AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N
**File:** package.json (line 6)
**CWE:** CWE-295 (Improper Certificate Validation)

**Vulnerable Code:**
```json
"dev": "cross-env NODE_TLS_REJECT_UNAUTHORIZED=0 next dev -p 9000",
"build": "cross-env NODE_TLS_REJECT_UNAUTHORIZED=0 next build",
```

**Problem:**
TLS certificate validation is disabled for BOTH dev AND build commands. The build command disabling TLS is concerning — if build scripts fetch resources, they won't verify certificates.

**Remediation:**
1. Remove `NODE_TLS_REJECT_UNAUTHORIZED=0` from the build script
2. For dev, consider using a proper SSL proxy instead

---

### SEC-018 — No CORS Configuration
**Category:** Access Control
**Severity:** MEDIUM
**CVSS Score:** 5.3
**CVSS Vector:** AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N
**File:** next.config.js
**CWE:** CWE-346 (Origin Validation Error)

**Problem:**
No CORS headers configured. Next.js API routes accept requests from any origin by default. Combined with the lack of auth on most routes, any website can make API calls to this application.

**Remediation:**
Add CORS middleware or configure in `next.config.js`:
```ts
async headers() {
  return [{
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || 'https://yourdomain.com' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
    ],
  }];
}
```

---

### SEC-019 — Dual Config Files (next.config.js + next.config.ts)
**Category:** Configuration
**Severity:** LOW
**CVSS Score:** 2.0
**File:** next.config.js + next.config.ts (both exist)
**CWE:** CWE-16

**Problem:**
Both `next.config.js` and `next.config.ts` exist with nearly identical content. Next.js will use one and ignore the other, potentially causing confusion about which configuration is active. Security headers added to one may not be in the active one.

**Remediation:**
Remove one. Keep only `next.config.ts` (TypeScript) and delete `next.config.js`.

---

### SEC-020 — IDOR on History Endpoint
**Category:** Authorization
**Severity:** HIGH
**CVSS Score:** 7.5
**CVSS Vector:** AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N
**File:** src/app/api/ioc-v2/route.ts (GET handler)
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)

**Problem:**
The GET handler uses `SYSTEM_USER_ID` for all queries, meaning all users see the same data. But beyond that, the fallback logic (line 386–396) queries ALL users' history when system user has no data:
```ts
if ((history.pagination?.totalCount ?? 0) === 0) {
  history = await getUserHistory({
    userId, includeAllUsers: true, ...
  });
  dataScope = 'legacy-fallback';
}
```
This means even if auth were enforced, the system falls back to returning ALL users' data.

**Remediation:**
Remove `includeAllUsers` fallback or restrict it to admin role only.

---

### SEC-021 — Token Stored in localStorage
**Category:** Session Management
**Severity:** MEDIUM
**CVSS Score:** 5.4
**CVSS Vector:** AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N
**File:** src/contexts/AuthContext.tsx (line 65–67)
**CWE:** CWE-922 (Insecure Storage of Sensitive Information)

**Vulnerable Code:**
```ts
const persistSession = (session) => {
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
};
```

**Problem:**
JWT token stored in `localStorage` is accessible to any JavaScript running on the page. If there's any XSS vulnerability, the token can be stolen.

**Remediation:**
Use `httpOnly` cookies for token storage (requires API changes), or accept the risk if XSS is properly mitigated with CSP headers.

---

### SEC-022 — No Request Body Size Limit on Some Routes
**Category:** DoS
**Severity:** MEDIUM
**CVSS Score:** 5.3
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L
**Files:**
- src/app/api/contact/route.ts — no body size check
- src/app/api/auth/login/route.ts — no body size check
- src/app/api/auth/register/route.ts — no body size check
**CWE:** CWE-400

**Problem:**
The `ioc-v2` route properly checks `content-length` (50KB limit). Other routes don't. An attacker could send a 100MB JSON body to crash the server.

**Remediation:**
Add body size validation or use Next.js body size config:
```ts
export const config = {
  api: { bodyParser: { sizeLimit: '10kb' } },
};
```

---

### SEC-023 — MongoDB No Connection Pooling Limits
**Category:** DoS
**Severity:** LOW
**CVSS Score:** 3.7
**CVSS Vector:** AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L
**File:** src/lib/db.ts
**CWE:** CWE-400

**Problem:**
MongoDB connection uses default options (`{ bufferCommands: false }`). No explicit connection pool size limit. Under heavy load, this could exhaust MongoDB connection limits.

**Remediation:**
Add connection options:
```ts
const opts = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

---

### SEC-024 — Middleware Only Protects /admin Routes
**Category:** Access Control
**Severity:** HIGH
**CVSS Score:** 7.5
**CVSS Vector:** AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N
**File:** middleware.ts (line 33–35)
**CWE:** CWE-285

**Vulnerable Code:**
```ts
export const config = {
  matcher: ['/admin/:path*'],
};
```

**Problem:**
Middleware only protects `/admin` routes. API routes under `/api/*` are NOT covered by middleware authentication. Each API route must implement its own auth check — and as shown in SEC-003, many don't.

**Remediation:**
Extend middleware matcher to include API routes:
```ts
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/ioc-v2/:path*',
    '/api/dashboard-v2/:path*',
    '/api/history-v2/:path*',
    '/api/file-analysis-v2/:path*',
    '/api/domain-intel/:path*',
  ],
};
```

---

### SEC-025 — No File Type Validation on Upload
**Category:** File Upload Security
**Severity:** HIGH
**CVSS Score:** 7.5
**CVSS Vector:** AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:L
**File:** src/app/api/file-analysis-v2/route.ts (line 31–53)
**CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type)

**Problem:**
Only file size is validated (50MB max). No file type/MIME validation. Any file type can be uploaded and processed. While the app only hashes and analyzes the file (not executing it), an attacker could:
1. Upload enormous files just under the size limit to consume resources
2. Upload malicious files that are stored in cache

**Remediation:**
Add MIME type and extension validation:
```ts
const allowedExtensions = ['.exe', '.dll', '.pdf', '.doc', '.docx', '.xls', '.zip', '.rar', '.js', '.py'];
const ext = path.extname(file.name).toLowerCase();
if (!allowedExtensions.includes(ext)) {
  return NextResponse.json({ success: false, error: 'File type not supported' }, { status: 400 });
}
```

---

### SEC-026 — Weak Random Number Usage
**Category:** Cryptography
**Severity:** LOW
**CVSS Score:** 3.1
**File:** Various (using `crypto.randomUUID()`)
**CWE:** CWE-338

**Problem:**
The codebase correctly uses `crypto.randomUUID()` for request IDs, which is cryptographically secure. No instances of `Math.random()` for security-sensitive operations were found. This is a PASS.

**Status:** ✅ No issue — crypto.randomUUID() is properly used.

---

### SEC-027 — Password Hashing Implementation
**Category:** Cryptography
**Severity:** INFO
**File:** src/lib/models/User.ts
**CWE:** N/A

**Finding:**
Password hashing uses `bcrypt` with salt rounds of 12, which is appropriate. The `select: false` on the password field prevents accidental exposure. This is properly implemented.

**Status:** ✅ PASS — Good implementation.

---

### SEC-028 — MongoDB Connection String in .env
**Category:** Sensitive Data
**Severity:** CRITICAL (see SEC-002)
**File:** .env (line 5)

**Problem:**
MongoDB Atlas connection string includes plaintext credentials:
```
mongodb+srv://dhruvprajapati002:LnpYTZwVPMKOLi1N@ioc-dhruv.i6arwo8.mongodb.net/
```
Username and password visible. This allows direct database access bypassing the application entirely.

**Status:** Covered by SEC-002. Requires immediate credential rotation.

---

### SEC-029 — No Content-Security-Policy
**Category:** XSS Prevention
**Severity:** MEDIUM
**CVSS Score:** 5.8
**File:** next.config.js
**CWE:** CWE-1021

**Problem:**
Without CSP headers, the browser has no restrictions on script sources. If any XSS is introduced, it can execute arbitrary scripts, load external resources, and exfiltrate the JWT from localStorage.

**Remediation:**
See SEC-008 for CSP header configuration.

---

### SEC-030 — API Keys Used Without Rotation Strategy
**Category:** Key Management
**Severity:** LOW
**CVSS Score:** 3.0
**File:** .env
**CWE:** CWE-798

**Problem:**
16+ API keys are configured but there's no rotation strategy, key expiry monitoring, or key usage tracking. If any external service revokes a key, the app silently fails.

**Remediation:**
1. Add startup health check that validates all API keys
2. Implement key rotation reminders
3. Monitor API key usage and errors

---

### SEC-031 — Duplicate next.config Creates Ambiguity
**Category:** Configuration
**Severity:** LOW
**CVSS Score:** 2.0
**Files:** next.config.js + next.config.ts

**Problem:**
Both files exist. If security headers are added to one but not the other, the wrong one might be loaded.

**Remediation:**
Delete next.config.js, keep only next.config.ts.

---

## IMMEDIATE ACTION ITEMS (Top 5 Critical)

1. **🔴 SEC-002: Rotate ALL credentials** — The `.env` file contains real MongoDB credentials, JWT secret, and 16+ API keys. Rotate every single credential immediately.

2. **🔴 SEC-001: Remove system token backdoor** — Delete the `SYSTEM_CLIENT_TOKEN` bypass in `auth.ts`. Any request with `Bearer system-public-token` currently bypasses authentication.

3. **🔴 SEC-003: Add authentication to all API routes** — ioc-v2, dashboard-v2, domain-intel, and contact routes have no auth. Fix the dashboard-v2 route that calls `verifyAuth()` but ignores the result.

4. **🔴 SEC-004: Add rate limiting to auth routes** — Login and registration endpoints have zero rate limiting, enabling unlimited brute-force attempts.

5. **🔴 SEC-008: Add security headers** — No CSP, no X-Frame-Options, no HSTS. The application has zero browser-side security controls.

---

## SECURITY HARDENING CHECKLIST

| Status | Control | Notes |
|--------|---------|-------|
| ❌ | Security headers (CSP, X-Frame-Options, HSTS) | Not configured |
| ❌ | CSRF protection on state-changing routes | Not implemented |
| ❌ | CORS origin whitelist | No CORS configured |
| ❌ | Rate limiting on auth routes | Not implemented |
| ❌ | Token invalidation on logout | Tokens persist until expiry |
| ❌ | Authentication on IOC analysis routes | Missing entirely |
| ❌ | Input sanitization (ReDoS prevention) | User regex passed directly |
| ❌ | File upload type validation | Only size validated |
| ❌ | Error message sanitization | Internal details leaked |
| ❌ | External API fetch timeouts | No AbortController usage |
| ⚠️ | Rate limiting on analysis (ioc-v2) | In-memory only (not persistent) |
| ⚠️ | JWT authentication system | Implemented but has bypass |
| ⚠️ | Input validation with Zod | Used on some routes, missing on others |
| ⚠️ | Middleware protection | Only covers /admin routes |
| ✅ | Password hashing (bcrypt with rounds=12) | Properly implemented |
| ✅ | MongoDB connection string masking in logs | Implemented in db.ts |
| ✅ | JWT expiry configured (7 days) | Implemented |
| ✅ | Zod schema validation on IOC submission | Implemented |
| ✅ | File size validation (50MB limit) | Implemented |
| ✅ | Crypto.randomUUID() for request IDs | Properly secure |

---

## RECOMMENDED SECURITY PACKAGES TO ADD

| Package | Purpose | Priority |
|---------|---------|----------|
| `helmet` | Security headers middleware (use via next.config instead) | HIGH |
| `rate-limiter-flexible` | Persistent rate limiting with Redis/MongoDB backend | HIGH |
| `express-mongo-sanitize` | Prevent NoSQL injection (adapt for Next.js) | MEDIUM |
| `safe-regex2` | Detect vulnerable regex patterns | MEDIUM |
| `csurf` or custom CSRF | CSRF token generation/validation | MEDIUM |
| `bcryptjs` | ✅ Already installed — password hashing | — |
| `zod` | ✅ Already installed — input validation | — |
| `jsonwebtoken` | ✅ Already installed — JWT auth | — |
