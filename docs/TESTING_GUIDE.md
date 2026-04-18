# IOC Analysis Platform - Testing Guide

## 📋 Testing Strategy Overview

This platform implements a **4-layer testing approach**:

```
┌─────────────────────────────────────┐
│  4. E2E Tests (User Interface)      │  ← Full user flows
├─────────────────────────────────────┤
│  3. API Tests (Backend Endpoints)   │  ← HTTP/REST APIs
├─────────────────────────────────────┤
│  2. Integration Tests (Services)    │  ← Service orchestration
├─────────────────────────────────────┤
│  1. Unit Tests (Core Logic)         │  ← Verdict calculation
└─────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests (core logic)
npm run test:unit

# Integration tests (mocked services)
npm run test:integration

# API tests (backend endpoints)
npm run test:api

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 1️⃣ UNIT TESTS - Core Engine Logic

**Location:** `tests/unit/`

**Purpose:** Test verdict calculation, scoring, and confidence WITHOUT external APIs.

### What We Test
- ✅ IP classification (private vs public)
- ✅ Hash validation (MD5, SHA1, SHA256)
- ✅ Risk score calculation
- ✅ Verdict determination
- ✅ Confidence levels
- ✅ IOC type detection

### Example Test
```typescript
test('should classify private IPs as unknown', () => {
  const result = classifyIPType('192.168.1.1');
  expect(result.isPrivate).toBe(true);
  expect(result.shouldSkipExternalLookup).toBe(true);
});
```

### Golden Test Fixtures
Located in `tests/fixtures/golden-iocs.ts`:
- **Clean IPs:** `8.8.8.8`, `1.1.1.1` (Google/Cloudflare DNS)
- **Malicious IPs:** `185.234.219.14` (known C2 server)
- **EICAR Test File:** `44d88612fea8a8f36de82e1278abb02f`

### Why This Matters
✅ These tests run **fast** (no network calls)  
✅ They work even when services are down  
✅ They catch logic bugs early

---

## 2️⃣ INTEGRATION TESTS - Service Integration

**Location:** `tests/integration/`

**Purpose:** Test how services work together WITHOUT hitting real APIs.

### Mocked Services
All external APIs are mocked in `tests/mocks/services.mock.ts`:
- VirusTotal
- MalwareBazaar
- ThreatFox
- GreyNoise
- AbuseIPDB

### What We Test
- ✅ Multi-service orchestration
- ✅ Partial service failures
- ✅ Cache behavior
- ✅ Error handling
- ✅ Rate limiting
- ✅ Verdict consistency

### Example Test
```typescript
test('should handle partial service failures', async () => {
  const mockVT = MockServices.virusTotal('error');
  const mockThreatFox = MockServices.threatFox('found');
  
  // Even if VT fails, other services should provide data
  const results = await Promise.allSettled([
    mockVT.analyze(),
    mockThreatFox.queryIOC(),
  ]);
  
  expect(fulfilled.length).toBe(1); // ThreatFox succeeds
  expect(rejected.length).toBe(1);  // VT fails
});
```

### Mock Factory Usage
```typescript
// Create clean IP mock
const mockVT = MockServices.virusTotal('clean');
const result = await mockVT.analyze();

// Create malicious IP mock
const mockVT = MockServices.virusTotal('malicious');
```

---

## 3️⃣ API TESTS - Backend Endpoints

**Location:** `tests/api/`

**Purpose:** Test HTTP endpoints WITHOUT hitting UI.

### Endpoints Tested
- `POST /api/ioc-v2` - IOC analysis
- `GET /api/history-v2/[ioc]` - IOC details
- `GET /api/health` - Health check

### What We Test
- ✅ HTTP status codes
- ✅ Response JSON schema
- ✅ Authentication
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ Security (SQL injection, XSS)

### Example Test
```typescript
test('should enforce rate limiting', async () => {
  // Make 150 requests (exceeds 100/hour limit)
  const requests = Array(150).fill(null).map(() =>
    fetch('/api/ioc-v2', { ... })
  );
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429);
  
  expect(rateLimited.length).toBeGreaterThan(0);
});
```

---

## 4️⃣ E2E TESTS - User Interface

**Location:** `tests/e2e/` (to be implemented)

**Tool:** Playwright

### What We Will Test
- ✅ Login flow
- ✅ File upload
- ✅ IP analysis
- ✅ Verdict display
- ✅ History view
- ✅ Error states

### Planned Test
```typescript
test('user can analyze IP and see verdict', async ({ page }) => {
  await page.goto('/analyze');
  await page.fill('input[name="ioc"]', '8.8.8.8');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.verdict')).toContainText('harmless');
});
```

---

## 🛡️ SECURITY TESTING

### Abuse Scenarios
```typescript
test('should block spam requests', async () => {
  // Send same IOC 100 times
  for (let i = 0; i < 100; i++) {
    await analyzeIOC('8.8.8.8');
  }
  
  // Should use cache, not hit API 100 times
  expect(apiCallCount).toBe(1);
});
```

### Edge Cases
- Private IPs (`192.168.1.1`)
- IPv6 addresses
- Empty files
- Large files (>100MB)
- Invalid hashes
- SQL injection attempts
- XSS attempts

---

## 📊 DATA QUALITY TESTING

### Truth Sets
Located in `tests/fixtures/golden-iocs.ts`:

| Category | Example | Expected Verdict |
|----------|---------|------------------|
| Clean | `8.8.8.8` | `harmless` |
| Malware | `44d88612fea8a8f36de82e1278abb02f` | `malicious` |
| Unknown | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1` | `unknown` |

### Metrics to Track
- **False Positive Rate:** Clean IOCs flagged as malicious
- **False Negative Rate:** Malicious IOCs flagged as clean
- **UNKNOWN Rate:** Should be 10-20% (better than guessing)

---

## 🔧 TEST CONFIGURATION

### Jest Config (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### Environment Variables
Set in `tests/setup.ts`:
```typescript
process.env.MONGODB_URI = 'mongodb://localhost:27017/ioc-test';
process.env.OPENSEARCH_NODE = 'http://localhost:9200';
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
```

---

## 📈 COVERAGE TARGETS

| Layer | Target | Current |
|-------|--------|---------|
| Unit Tests | 90% | TBD |
| Integration | 80% | TBD |
| API Tests | 85% | TBD |
| E2E Tests | 70% | TBD |

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 🚫 WHAT NOT TO TEST

❌ **Don't test external services directly**
- No real VirusTotal API calls in tests
- No real database writes (use mocks)

❌ **Don't test third-party libraries**
- We trust `axios`, `bcryptjs`, etc. work

❌ **Don't test obvious things**
- `1 + 1 = 2` type tests

---

## ✅ QUALITY CHECKLIST

Before deploying:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] API tests pass
- [ ] No new security vulnerabilities
- [ ] Code coverage > 80%
- [ ] Golden test cases still accurate
- [ ] Rate limiting works
- [ ] Cache works correctly
- [ ] Error handling graceful
- [ ] Verdicts consistent

---

## 🐛 DEBUGGING TESTS

### Enable Verbose Logging
```bash
DEBUG=* npm test
```

### Run Single Test File
```bash
npx jest tests/unit/engine-logic.test.ts
```

### Run Single Test Case
```bash
npx jest -t "should classify private IPs"
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

---

## 📚 TEST DATA SOURCES

### Golden IOCs
- **Clean IPs:** Google DNS, Cloudflare DNS
- **Malicious IPs:** Abuse.ch feeds, ThreatFox
- **Test Files:** EICAR, GTI malware samples

### Mock Responses
All mock data is based on real API responses from:
- VirusTotal API v3
- MalwareBazaar API
- ThreatFox API
- GreyNoise API
- AbuseIPDB API

---

## 🎯 NEXT STEPS

1. **Install test dependencies:**
   ```bash
   npm install --save-dev jest ts-jest @types/jest @jest/globals
   ```

2. **Run initial tests:**
   ```bash
   npm run test:unit
   ```

3. **Add E2E tests:**
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install
   ```

4. **Setup CI/CD:**
   - Add `npm test` to GitHub Actions
   - Block PRs if tests fail
   - Generate coverage reports

---

## 📞 SUPPORT

For test failures or questions:
1. Check test logs for detailed errors
2. Review mock data in `tests/mocks/`
3. Verify environment variables in `tests/setup.ts`
4. Check golden fixtures in `tests/fixtures/`

---

## 🏆 TEST BEST PRACTICES

✅ **DO:**
- Write tests before fixing bugs
- Test edge cases
- Use descriptive test names
- Mock external dependencies
- Test error paths

❌ **DON'T:**
- Hit real APIs in tests
- Write tests that depend on each other
- Test implementation details
- Ignore flaky tests
- Skip security tests

---

**Last Updated:** January 23, 2026  
**Test Coverage:** In Progress  
**CI/CD:** Not yet configured
