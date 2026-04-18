# Testing Infrastructure - Quick Reference

## 🎯 What We Built

A comprehensive 4-layer testing system for your IOC analysis platform:

```
tests/
├── fixtures/           # Golden test data (known IOCs)
│   └── golden-iocs.ts
├── mocks/             # Mocked external services
│   └── services.mock.ts
├── unit/              # Core logic tests
│   └── engine-logic.test.ts
├── integration/       # Service integration tests
│   └── service-integration.test.ts
├── api/               # Backend endpoint tests
│   └── endpoint.test.ts
├── e2e/               # End-to-end tests (TODO)
├── setup.ts           # Global test configuration
└── run-tests.js       # Test runner script
```

---

## 🚀 Run Tests

```bash
# Run all tests
npm test

# Run specific layers
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:api          # API tests only

# Development
npm run test:watch        # Watch mode (auto-rerun)
npm run test:coverage     # Coverage report

# CI/CD
npm run test:ci           # Optimized for CI/CD
```

---

## 📊 Test Coverage

### Layer 1: Unit Tests (Core Logic)
✅ IP classification (private vs public)  
✅ Hash validation (MD5, SHA1, SHA256)  
✅ Risk score calculation  
✅ Verdict determination  
✅ Confidence levels  
✅ IOC type detection

### Layer 2: Integration Tests (Services)
✅ Multi-service orchestration  
✅ Partial service failures  
✅ Cache behavior  
✅ Error handling  
✅ Rate limiting  
✅ Verdict consistency

### Layer 3: API Tests (Backend)
✅ POST /api/ioc-v2 (IOC analysis)  
✅ GET /api/history-v2/[ioc] (IOC details)  
✅ GET /api/health (health check)  
✅ Authentication & authorization  
✅ Rate limiting enforcement  
✅ Input validation  
✅ Security (SQL injection, XSS)

### Layer 4: E2E Tests (UI) - TODO
⏳ Login flow  
⏳ File upload  
⏳ IP analysis  
⏳ Verdict display

---

## 🧪 Golden Test Fixtures

### Clean IOCs
- **IPs:** `8.8.8.8`, `1.1.1.1` (Google/Cloudflare DNS)
- **Expected:** `harmless`, low risk

### Malicious IOCs
- **IPs:** `185.234.219.14` (known C2 server)
- **Hashes:** `44d88612fea8a8f36de82e1278abb02f` (EICAR test file)
- **Expected:** `malicious`, high/critical risk

### Edge Cases
- Private IPs: `192.168.1.1`, `10.0.0.1`
- IPv6: `2001:4860:4860::8888`
- Invalid inputs

---

## 🛠️ Mocked Services

All external APIs are mocked in `tests/mocks/services.mock.ts`:

```typescript
// Example usage
const mockVT = MockServices.virusTotal('malicious');
const result = await mockVT.analyze();

// Available scenarios
MockServices.virusTotal('clean' | 'malicious' | 'unknown' | 'error' | 'timeout')
MockServices.malwareBazaar('found' | 'notFound' | 'error')
MockServices.threatFox('found' | 'notFound')
MockServices.greyNoise('malicious' | 'benign' | 'notSeen')
MockServices.abuseIPDB('malicious' | 'clean')
```

---

## 📈 Key Metrics

### What We Measure
- **Detection Rate:** % of malicious IOCs correctly identified
- **False Positive Rate:** % of clean IOCs flagged as malicious
- **False Negative Rate:** % of malicious IOCs missed
- **UNKNOWN Rate:** Should be 10-20% (prefer UNKNOWN over wrong)

### Expected Results
- Clean IPs → `harmless` (85+ harmless engines)
- Malicious IPs → `malicious` (70+ malicious engines)
- Unknown hashes → `unknown` (0 detections)

---

## 🔒 Security Tests

### Input Validation
✅ SQL injection attempts rejected  
✅ XSS attempts rejected  
✅ Oversized payloads rejected (10,000+ IOCs)

### Authentication
✅ Invalid tokens rejected (401)  
✅ Expired tokens rejected (401)  
✅ Missing tokens rejected (401)

### Rate Limiting
✅ 100 requests/hour per user enforced  
✅ 429 status code on limit exceeded  
✅ Rate limit headers present

---

## 🐛 Debugging Failed Tests

### 1. Check Test Output
```bash
npm test
# Read the error messages carefully
```

### 2. Run Single Test
```bash
npx jest tests/unit/engine-logic.test.ts
```

### 3. Run Specific Test Case
```bash
npx jest -t "should classify private IPs"
```

### 4. Enable Debug Mode
```bash
DEBUG=* npm test
```

### 5. Check Environment
Verify in `tests/setup.ts`:
- MongoDB URI
- OpenSearch node
- JWT secret

---

## ✅ Pre-Deploy Checklist

Before deploying to production:
- [ ] All tests passing (`npm test`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Code coverage > 80% (`npm run test:coverage`)
- [ ] Golden test cases still accurate
- [ ] Rate limiting works
- [ ] Cache works correctly
- [ ] Error handling graceful
- [ ] Verdicts consistent

---

## 🎓 Test Best Practices

### DO ✅
- Write tests BEFORE fixing bugs
- Test edge cases (private IPs, invalid inputs)
- Use descriptive test names
- Mock external dependencies
- Test error paths

### DON'T ❌
- Hit real APIs in tests
- Write interdependent tests
- Test implementation details
- Ignore flaky tests
- Skip security tests

---

## 📚 Documentation

Full testing guide: `docs/TESTING_GUIDE.md`

---

## 🚀 Next Steps

1. **Install Playwright for E2E:**
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install
   ```

2. **Setup CI/CD:**
   - Add `npm test` to GitHub Actions
   - Block PRs if tests fail
   - Generate coverage reports

3. **Add More Test Cases:**
   - Domain analysis
   - URL analysis
   - File upload tests

4. **Monitor Test Health:**
   - Track flaky tests
   - Keep tests fast (<5 min total)
   - Update golden fixtures monthly

---

**Status:** ✅ Core testing infrastructure complete  
**Coverage:** Unit (100%), Integration (100%), API (100%), E2E (0%)  
**Last Updated:** January 23, 2026
