# VPN & MongoDB Connection Issue - Solution

## 🔍 Problem

**When VPN is ON:**
- ✅ VirusTotal API works (needs VPN for access)
- ❌ MongoDB connection fails (VPN blocks local connections)

**When VPN is OFF:**
- ✅ MongoDB works (local connection)
- ❌ VirusTotal API doesn't work (blocked without VPN)

---

## ✅ Solution: Configure VPN Split Tunneling

### Option 1: VPN Split Tunneling (Recommended)

Configure your VPN to **only route VirusTotal traffic through VPN**, allow local traffic directly:

**Steps:**
1. Open VPN client settings
2. Find "Split Tunneling" or "Exclude Local Network"
3. Add exclusions:
   ```
   127.0.0.1         (localhost)
   localhost         (MongoDB)
   192.168.0.0/16    (local network)
   10.0.0.0/8        (local network)
   ```

4. Add VPN-only routes:
   ```
   virustotal.com
   www.virustotal.com
   *.virustotal.com
   ```

**Result:** 
- Local MongoDB: ✅ Works (direct connection)
- VirusTotal: ✅ Works (through VPN)

---

### Option 2: Use MongoDB Cloud (Atlas)

If split tunneling doesn't work:

1. **Create MongoDB Atlas cluster** (free tier):
   ```
   https://www.mongodb.com/cloud/atlas/register
   ```

2. **Update connection string**:
   ```env
   # .env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ioc-analyzer
   ```

3. **Whitelist VPN IP**:
   - In Atlas: Network Access → Add IP Address
   - Add your VPN IP or allow all: `0.0.0.0/0`

**Result:** MongoDB accessible from anywhere (VPN ON or OFF)

---

### Option 3: Docker MongoDB with Host Network

Run MongoDB in Docker with host network mode:

```bash
docker run -d \
  --name mongodb \
  --network host \
  -v mongodb_data:/data/db \
  mongo:latest
```

Or in `docker-compose.yml`:
```yaml
services:
  mongodb:
    image: mongo:latest
    network_mode: host
    volumes:
      - mongodb_data:/data/db
```

**Why this works:**
- `network_mode: host` makes MongoDB accessible even with VPN

---

### Option 4: Conditional Environment Variables

Use different configs based on VPN status:

**Create `.env.vpn`:**
```env
# When VPN is ON
MONGODB_URI=mongodb://host.docker.internal:27017/ioc-analyzer
VIRUSTOTAL_API_KEY=your-vt-key
SKIP_VIRUSTOTAL=false
```

**Create `.env.local`:**
```env
# When VPN is OFF
MONGODB_URI=mongodb://localhost:27017/ioc-analyzer
SKIP_VIRUSTOTAL=true
```

**Use with:**
```bash
# VPN ON
cp .env.vpn .env && npm run dev

# VPN OFF
cp .env.local .env && npm run dev
```

---

### Option 5: Test-Specific Config (For Testing Only)

Update test configuration to skip VirusTotal when testing:

**In `tests/setup.ts`:**
```typescript
process.env.SKIP_VIRUSTOTAL = 'true';  // Skip VT API calls in tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/ioc-test';
```

**In your orchestrator:**
```typescript
async analyze(ioc: string) {
  // Skip VirusTotal if disabled
  if (process.env.SKIP_VIRUSTOTAL === 'true') {
    return this.analyzeWithoutVT(ioc);
  }
  // Normal analysis
}
```

---

## 🎯 Quick Fix for Testing

**Recommended for now:**

1. **Turn VPN OFF** when running tests
2. Tests will use MongoDB locally
3. Tests use **mocked** VirusTotal (not real API)
4. Everything works without VPN

**Why this works:**
- Tests use mock services (see [tests/mocks/services.mock.ts](../../tests/mocks/services.mock.ts))
- No real VirusTotal API calls
- MongoDB connects locally

---

## 📝 Check Current Issue

```bash
# Check MongoDB connection
mongo --eval "db.adminCommand('ping')"

# Check if VPN is blocking it
ping localhost
telnet localhost 27017
```

**If MongoDB doesn't respond:**
- VPN is blocking localhost
- Use Option 1 (Split Tunneling)

---

## ✅ Final Recommendation

**For Development:**
1. ✅ Use VPN Split Tunneling (Option 1)
2. ✅ Or use MongoDB Atlas (Option 2)

**For Testing:**
1. ✅ Turn VPN OFF (tests use mocks)
2. ✅ Or set `SKIP_VIRUSTOTAL=true`

**For Production:**
1. ✅ Use MongoDB Atlas or hosted MongoDB
2. ✅ VirusTotal works from server (no VPN needed)

---

Your tests will now work correctly once JWT_SECRET issue is fixed!
