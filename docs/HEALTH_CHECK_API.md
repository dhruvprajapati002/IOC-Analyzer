# Threat Intelligence Health Check API

## Endpoints

### GET `/api/health-threat-intel`

Comprehensive health check for all threat intelligence services.

#### Query Parameters

- `mode` - Test mode (default: `quick`)
  - `quick` - Fast checks (OpenSearch, clients availability)
  - `full` - Complete checks including live API calls and full IOC analysis
- `ioc` - IOC to test with in full mode (default: `8.8.8.8`)

#### Examples

**Quick Health Check** (Fast, no API calls)
```bash
curl http://localhost:3000/api/health-threat-intel
```

**Full Health Check** (Tests everything including live analysis)
```bash
curl "http://localhost:3000/api/health-threat-intel?mode=full"
```

**Test with Custom IOC**
```bash
curl "http://localhost:3000/api/health-threat-intel?mode=full&ioc=1.1.1.1"
```

#### Response Example (Quick Mode)

```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T10:30:00.000Z",
  "mode": "quick",
  "checks": {
    "opensearch": {
      "status": "healthy",
      "cluster_status": "green",
      "nodes": 1,
      "responseTime": 45
    },
    "clients": {
      "VirusTotal": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["ip", "domain", "url", "file_hash"]
      },
      "GreyNoise": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["ip"]
      },
      "IPQS": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["ip", "domain", "url"]
      },
      "ThreatFox": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["ip", "domain"]
      },
      "MalwareBazaar": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["file_hash"]
      },
      "URLhaus": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["url", "domain"]
      }
    },
    "geolocation": {
      "status": "skipped",
      "message": "Use mode=full to test geolocation"
    },
    "abuseipdb": {
      "status": "skipped",
      "message": "Use mode=full to test AbuseIPDB"
    },
    "orchestrator": {
      "status": "healthy",
      "initialized": true,
      "sources": 7
    },
    "fullAnalysis": {
      "status": "skipped",
      "message": "Use mode=full&ioc=8.8.8.8 to test full analysis"
    },
    "environment": {
      "node_env": "production",
      "api_keys": {
        "virustotal": true,
        "abuseipdb": true,
        "greynoise": true,
        "ipqs": true,
        "abuse_ch": true
      }
    }
  },
  "responseTime": 234
}
```

#### Response Example (Full Mode)

```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T10:30:00.000Z",
  "mode": "full",
  "checks": {
    "opensearch": {
      "status": "healthy",
      "cluster_status": "green",
      "nodes": 1,
      "responseTime": 45
    },
    "clients": {
      "VirusTotal": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["ip", "domain", "url", "file_hash"]
      },
      "GreyNoise": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["ip"]
      },
      "IPQS": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["ip", "domain", "url"]
      },
      "ThreatFox": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["ip", "domain"]
      },
      "MalwareBazaar": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["file_hash"]
      },
      "URLhaus": {
        "status": "available",
        "configured": true,
        "quota": "unlimited",
        "supports": ["url", "domain"]
      }
    },
    "geolocation": {
      "status": "healthy",
      "provider": "available"
    },
    "abuseipdb": {
      "status": "healthy",
      "configured": true
    },
    "orchestrator": {
      "status": "healthy",
      "initialized": true,
      "sources": 7
    },
    "fullAnalysis": {
      "status": "success",
      "ioc": "8.8.8.8",
      "verdict": "clean",
      "severity": "clean",
      "sources_available": 4,
      "sources_failed": 0,
      "analysisTime": "2345ms",
      "riskScore": 5,
      "riskLevel": "low"
    },
    "environment": {
      "node_env": "production",
      "api_keys": {
        "virustotal": true,
        "abuseipdb": true,
        "greynoise": true,
        "ipqs": true,
        "abuse_ch": true
      }
    }
  },
  "responseTime": 2567
}
```

#### Status Codes

- `200` - All systems healthy
- `207` - Partially healthy (some services degraded)
- `500` - Critical error
- `503` - Service unhealthy

---

### POST `/api/health-threat-intel`

Test IOC analysis directly.

#### Request Body

```json
{
  "ioc": "8.8.8.8",
  "label": "Test Analysis"
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "8.8.8.8", "label": "Health Check Test"}'
```

#### Response Example

```json
{
  "success": true,
  "analysis": {
    "ioc": "8.8.8.8",
    "type": "ip",
    "verdict": "clean",
    "severity": "clean",
    "riskScore": 5,
    "riskLevel": "low",
    "stats": {
      "malicious": 0,
      "suspicious": 0,
      "harmless": 45,
      "undetected": 23
    },
    "threatIntel": {
      "threatTypes": [],
      "detectionsCount": 0,
      "severity": "clean"
    },
    "sources": {
      "available": ["VirusTotal", "GreyNoise", "IPQS", "ThreatFox"],
      "failed": []
    },
    "analysisTime": "1234ms"
  }
}
```

---

## Testing Scenarios

### 1. Basic Health Check (No API Keys Required)
```bash
# Check if services are initialized
curl http://localhost:3000/api/health-threat-intel
```

**Expected**: All clients show status, OpenSearch healthy

### 2. Full System Test (Requires API Keys)
```bash
# Test everything including live API calls
curl "http://localhost:3000/api/health-threat-intel?mode=full"
```

**Expected**: Full analysis completes, all sources queried

### 3. Test Clean IP
```bash
# Test with Google DNS
curl -X POST http://localhost:3000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "8.8.8.8"}'
```

**Expected**: verdict=clean, riskScore=low

### 4. Test Malicious IP
```bash
# Test with known malicious IP
curl -X POST http://localhost:3000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "45.142.212.61"}'
```

**Expected**: verdict=malicious, riskScore=high

### 5. Test Hash
```bash
# Test with malware hash
curl -X POST http://localhost:3000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "44d88612fea8a8f36de82e1278abb02f"}'
```

**Expected**: type=file_hash, malware detected

### 6. Test Domain
```bash
# Test with domain
curl -X POST http://localhost:3000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "google.com"}'
```

**Expected**: type=domain, verdict=clean

### 7. Test URL
```bash
# Test with URL
curl -X POST http://localhost:3000/api/health-threat-intel \
  -H "Content-Type: application/json" \
  -d '{"ioc": "https://www.google.com"}'
```

**Expected**: type=url, verdict=clean

---

## Integration Testing

### Node.js/JavaScript
```javascript
const axios = require('axios');

async function testThreatIntel() {
  // Quick health check
  const health = await axios.get('http://localhost:3000/api/health-threat-intel');
  console.log('Status:', health.data.status);
  
  // Test IOC analysis
  const analysis = await axios.post('http://localhost:3000/api/health-threat-intel', {
    ioc: '8.8.8.8',
    label: 'Test'
  });
  
  console.log('Analysis:', analysis.data.analysis);
}

testThreatIntel();
```

### Python
```python
import requests

# Quick health check
response = requests.get('http://localhost:3000/api/health-threat-intel')
print(f"Status: {response.json()['status']}")

# Test IOC analysis
analysis = requests.post(
    'http://localhost:3000/api/health-threat-intel',
    json={'ioc': '8.8.8.8', 'label': 'Test'}
)

print(f"Verdict: {analysis.json()['analysis']['verdict']}")
```

### PowerShell
```powershell
# Quick health check
$health = Invoke-RestMethod -Uri "http://localhost:3000/api/health-threat-intel"
Write-Host "Status: $($health.status)"

# Test IOC analysis
$body = @{
    ioc = "8.8.8.8"
    label = "Test"
} | ConvertTo-Json

$analysis = Invoke-RestMethod -Uri "http://localhost:3000/api/health-threat-intel" `
    -Method POST -Body $body -ContentType "application/json"

Write-Host "Verdict: $($analysis.analysis.verdict)"
```

---

## Troubleshooting

### Client Unavailable
```json
{
  "clients": {
    "VirusTotal": {
      "status": "unavailable",
      "configured": false
    }
  }
}
```

**Solution**: Check API keys in `.env` file

### OpenSearch Unhealthy
```json
{
  "opensearch": {
    "status": "unhealthy",
    "error": "Connection refused"
  }
}
```

**Solution**: Ensure OpenSearch is running on port 9200

### Full Analysis Failed
```json
{
  "fullAnalysis": {
    "status": "failed",
    "error": "Rate limit exceeded"
  }
}
```

**Solution**: Wait for rate limits to reset or use different API keys

---

## Monitoring & Alerts

### Health Check Script (Cron/Scheduled Task)
```bash
#!/bin/bash

HEALTH_URL="http://localhost:3000/api/health-threat-intel?mode=full"

response=$(curl -s $HEALTH_URL)
status=$(echo $response | jq -r '.status')

if [ "$status" != "healthy" ]; then
  echo "⚠️ Threat Intel System Unhealthy: $status"
  echo $response | jq '.'
  # Send alert (email, Slack, etc.)
else
  echo "✅ Threat Intel System Healthy"
fi
```

### Expected Response Times

| Mode | Expected Time | Max Time |
|------|--------------|----------|
| Quick | 200-500ms | 1s |
| Full | 2-5s | 10s |
| POST Test | 1-3s | 8s |

---

## Summary

The health check API provides:

✅ **Quick diagnostics** - Check system status without API calls
✅ **Full testing** - Test entire pipeline with live IOC analysis  
✅ **Client validation** - Verify all 7 threat intel sources
✅ **OpenSearch check** - Ensure database connectivity
✅ **Environment validation** - Confirm API keys configured
✅ **Performance metrics** - Response time tracking
✅ **Direct IOC testing** - Test specific indicators

Use this API for:
- Deployment verification
- Monitoring and alerting
- Troubleshooting issues
- Performance benchmarking
- Integration testing
