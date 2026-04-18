# 🧪 Testing the Centralized Threat Intelligence System

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

Wait for the server to start on `http://localhost:9000`

### 2. Run the Health Check

**Option A: PowerShell (Recommended for Windows)**
```powershell
.\scripts\test-threat-intel.ps1
```

**Option B: Batch Script**
```cmd
.\scripts\test-threat-intel.bat
```

**Option C: Direct API Calls**
```bash
# Quick health check
curl http://localhost:9000/api/health-threat-intel

# Full health check
curl "http://localhost:9000/api/health-threat-intel?mode=full"

# Test specific IOC
curl -X POST http://localhost:9000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "8.8.8.8", "label": "Test"}'
```

## What Gets Tested

### ✅ Quick Health Check (`mode=quick`)
- All 7 threat intelligence clients availability
- API keys configuration
- Orchestrator initialization
- Environment setup

**Expected Time**: 200-500ms

### ✅ Full Health Check (`mode=full`)
- Everything in quick mode, PLUS:
- Live geolocation lookup
- Live AbuseIPDB check
- Complete IOC analysis with real API calls
- Multi-source data aggregation

**Expected Time**: 2-5 seconds

### ✅ POST Test Analysis
- Direct IOC analysis
- Risk scoring
- Threat intelligence extraction
- Multi-source querying

**Expected Time**: 1-3 seconds per IOC

## Expected Results

### Healthy System Response
```json
{
  "status": "healthy",
  "checks": {
    "clients": {
      "VirusTotal": { "status": "available" },
      "GreyNoise": { "status": "available" },
      "IPQS": { "status": "available" },
      "ThreatFox": { "status": "available" },
      "MalwareBazaar": { "status": "available" },
      "URLhaus": { "status": "available" }
    },
    "orchestrator": { "status": "healthy" }
  }
}
```

### Test IOC Results

| IOC | Type | Expected Verdict | Expected Risk |
|-----|------|-----------------|---------------|
| 8.8.8.8 | IP | clean | low (0-15) |
| 1.1.1.1 | IP | clean | low (0-15) |
| google.com | domain | clean | low |
| https://www.google.com | url | clean | low |
| 44d88612fea8a8f36de82e1278abb02f | file_hash | malicious | high (80+) |

## Testing Different IOC Types

### Test Clean IP (Google DNS)
```bash
curl -X POST http://localhost:9000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "8.8.8.8", "label": "Test"}'
```

**Expected**: 
- verdict: "clean"
- riskScore: 5-10
- riskLevel: "low"

### Test Malicious IP
```bash
curl -X POST http://localhost:9000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "45.142.212.61", "label": "Test"}'
```

**Expected**:
- verdict: "malicious" or "suspicious"
- riskScore: 60+
- riskLevel: "high" or "critical"

### Test Domain
```bash
curl -X POST http://localhost:9000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "google.com", "label": "Test"}'
```

**Expected**:
- type: "domain"
- verdict: "clean"
- severity: "clean"

### Test URL
```bash
curl -X POST http://localhost:9000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "https://www.google.com", "label": "Test"}'
```

**Expected**:
- type: "url"
- verdict: "clean"

### Test Hash (Malware)
```bash
curl -X POST http://localhost:9000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "44d88612fea8a8f36de82e1278abb02f", "label": "Test"}'
```

**Expected**:
- type: "file_hash"
- verdict: "malicious"
- severity: "high" or "critical"

## Troubleshooting

### Issue: "Client unavailable"
**Solution**: Check `.env` file for API keys:
```env
VIRUSTOTAL_API_KEY=your_key_here
ABUSEIPDB_API_KEY=your_key_here
GREYNOISE_API_KEY=your_key_here
IPQS_API_KEY=your_key_here
ABUSE_CH_API_KEY=your_key_here
```

### Issue: "Rate limit exceeded"
**Solution**: Wait 60 seconds or use different API keys

### Issue: "Connection refused"
**Solution**: Ensure dev server is running:
```bash
npm run dev
```

## Manual Browser Testing

Visit these URLs in your browser:

1. **Quick Health Check**:
   ```
   http://localhost:9000/api/health-threat-intel
   ```

2. **Full Health Check**:
   ```
   http://localhost:9000/api/health-threat-intel?mode=full
   ```

3. **Custom IOC Test**:
   ```
   http://localhost:9000/api/health-threat-intel?mode=full&ioc=1.1.1.1
   ```

## Automated Testing

### Continuous Monitoring (Every 5 minutes)
```bash
# Linux/Mac
watch -n 300 'curl -s http://localhost:9000/api/health-threat-intel | jq .status'

# Windows (PowerShell)
while ($true) {
  $status = (Invoke-RestMethod http://localhost:9000/api/health-threat-intel).status
  Write-Host "$(Get-Date) - Status: $status"
  Start-Sleep -Seconds 300
}
```

### Integration with CI/CD
```yaml
# GitHub Actions example
- name: Health Check
  run: |
    response=$(curl -s http://localhost:9000/api/health-threat-intel)
    status=$(echo $response | jq -r '.status')
    if [ "$status" != "healthy" ]; then
      echo "Health check failed"
      exit 1
    fi
```

## Performance Benchmarks

Expected response times on a typical system:

| Test Type | Min | Avg | Max |
|-----------|-----|-----|-----|
| Quick Health | 200ms | 400ms | 1s |
| Full Health | 2s | 4s | 10s |
| IP Analysis | 1s | 2.5s | 8s |
| Hash Analysis | 1.5s | 3s | 10s |
| Domain Analysis | 1s | 2s | 8s |
| URL Analysis | 1.5s | 3s | 10s |

## Next Steps

Once all tests pass:

1. ✅ Delete old duplicate code in `/app/api/ioc-v2/helpers/`
2. ✅ Test the main API endpoint `/api/ioc-v2` with authentication
3. ✅ Run the frontend and test the UI
4. ✅ Monitor logs for any errors
5. ✅ Test with real-world IOCs

## Support

For detailed API documentation, see:
- [HEALTH_CHECK_API.md](./docs/HEALTH_CHECK_API.md)
- [THREAT_INTEL_ARCHITECTURE.md](./docs/THREAT_INTEL_ARCHITECTURE.md)

For issues, check the console logs for detailed error messages.
