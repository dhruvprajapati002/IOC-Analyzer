# API Key Management with Round-Robin Load Balancing

## 📖 Overview

Your IOC Analysis Platform now supports **multiple API keys** for three services:
- **VirusTotal** (already implemented)
- **IPQualityScore (IPQS)** 
- **GreyNoise**

The system automatically:
- ✅ Rotates through keys using **round-robin**
- ✅ Skips failed keys temporarily (30-min blacklist)
- ✅ Balances load across all available keys
- ✅ Maximizes API quota utilization

---

## 🔑 How .env Files Work

### 1. **Environment File Priority**

```
.env.local (highest priority, not committed to git)
   ↓
.env (committed to git, should not contain sensitive keys)
```

**Best Practice:**
- Store **production keys** in `.env.local` (gitignored)
- Keep `.env` as a template with dummy values

---

## 📝 Adding Multiple API Keys

### **Method 1: Comma-Separated (Recommended)**

Add keys in a single line, separated by commas:

```bash
# .env.local

# VirusTotal - 4 keys
VT_API_KEYS=key1111111111111111111111111111111,key2222222222222222222222222222222,key3333333333333333333333333333333,key4444444444444444444444444444444

# IPQualityScore - 3 keys
IPQS_API_KEYS=ipqs_key1111111111111111,ipqs_key2222222222222222,ipqs_key3333333333333333

# GreyNoise - 2 keys
GREYNOISE_API_KEYS=greynoise_key1111111111,greynoise_key2222222222
```

**✅ This is the cleanest method**

---

### **Method 2: Numbered Keys (Backward Compatible)**

Use numbered suffixes:

```bash
# .env.local

# VirusTotal
VT_API_KEY=primary_vt_key
VT_API_KEY_1=second_vt_key
VT_API_KEY_2=third_vt_key
VT_API_KEY_3=fourth_vt_key

# IPQS
IPQS_API_KEY=primary_ipqs_key
IPQS_API_KEY_1=second_ipqs_key
IPQS_API_KEY_2=third_ipqs_key

# GreyNoise
GREYNOISE_API_KEY=primary_greynoise_key
GREYNOISE_API_KEY_1=second_greynoise_key
```

**Note:** You can mix both methods - the system will combine and deduplicate them.

---

## 🎯 Current Configuration

### Your `.env` File (Template)
```bash
# VirusTotal - Multiple keys for load balancing
VT_API_KEYS=key1,key2,key3,key4

# Legacy format (still works)
VT_API_KEY=bc230055c22e417929e3130c7100a6ffc64a3be76f557a834e5988ce2cc889e2

# IPQualityScore
IPQS_API_KEY=Cp2XzEbKR9MTeOa3ANQeyh8nJuxB7lVy
IPQS_ENABLED=true

# GreyNoise
GREYNOISE_API_KEY=ijoegaqLQJpog15IS0gnUXwgTv2uC5DVqkcraNfyLFgLJtsy3fXK0yIL8VM6hY2L
GREYNOISE_ENABLED=true
```

### Your `.env.local` File (Production Keys)
```bash
# Add your actual production keys here

# VirusTotal (4 keys)
VT_API_KEYS=eb9705b0ecaade41aa94211f066c821f9eec2caaeffad51a7f9b5f655969a37b,9f875066cbe10fc4b9526561f9d711e124dc24fdd2441d4fee128b7568227a78,23441dc59541d38c14b10458d14e6fc544b8b1f3adb635d2fd1135d0f84d4ff5,3f229e68c38cc3bd9c6d4a3cfb703e902e1b093f6fadfca9500f1d64bb5521fc

# IPQS (add more keys here)
IPQS_API_KEYS=Cp2XzEbKR9MTeOa3ANQeyh8nJuxB7lVy,your_second_ipqs_key,your_third_ipqs_key
IPQS_ENABLED=true

# GreyNoise (add more keys here)
GREYNOISE_API_KEYS=ijoegaqLQJpog15IS0gnUXwgTv2uC5DVqkcraNfyLFgLJtsy3fXK0yIL8VM6hY2L,your_second_greynoise_key
GREYNOISE_ENABLED=true
```

---

## 🔄 How Round-Robin Works

### Example with 3 Keys:

```
Request 1 → Key A
Request 2 → Key B
Request 3 → Key C
Request 4 → Key A  ← back to first
Request 5 → Key B
...
```

### With Failures:

```
Request 1 → Key A (success) ✅
Request 2 → Key B (failed 3x) ❌ → Blacklisted for 30 min
Request 3 → Key C (success) ✅
Request 4 → Key A (success) ✅  ← Key B skipped
Request 5 → Key C (success) ✅
...
[After 30 min]
Request 50 → Key B (recovered) ✅  ← Back in rotation
```

---

## 📊 Monitoring Key Usage

### View Statistics in Logs

The system logs rotation information:

```bash
[ApiKeyManager] Initialized:
  VirusTotal: 4 keys
  IPQS: 3 keys
  GreyNoise: 2 keys

[ApiKeyManager] virustotal: Using key virustotal-1 (2/4)
[ApiKeyManager] ipqs: Using key ipqs-0 (1/3)
[ApiKeyManager] greynoise: Using key greynoise-1 (2/2)

[ApiKeyManager] ⚠️ Blacklisted ipqs key ipqs-1 (3 failures). Will retry in 30 min
[ApiKeyManager] ✅ Restored virustotal key virustotal-2 (blacklist expired)
```

---

## 🛠️ Getting More API Keys

### VirusTotal
1. Go to: https://www.virustotal.com/gui/my-apikey
2. Create multiple accounts or request additional keys
3. Free tier: 4 requests/min per key
4. With 4 keys: **16 requests/min**

### IPQualityScore
1. Go to: https://www.ipqualityscore.com/
2. Sign up for multiple accounts
3. Free tier: 5,000 requests/month per key
4. With 3 keys: **15,000 requests/month**

### GreyNoise
1. Go to: https://www.greynoise.io/
2. Sign up (Community API is free)
3. Free tier: 50 requests/day per key
4. With 2 keys: **100 requests/day**

---

## ⚙️ Configuration Examples

### Minimal Setup (1 key each)
```bash
VT_API_KEY=your_vt_key
IPQS_API_KEY=your_ipqs_key
GREYNOISE_API_KEY=your_greynoise_key
```

### Recommended Setup (3-5 keys each)
```bash
VT_API_KEYS=key1,key2,key3,key4,key5
IPQS_API_KEYS=key1,key2,key3
GREYNOISE_API_KEYS=key1,key2,key3
```

### High-Load Setup (10+ keys)
```bash
VT_API_KEYS=k1,k2,k3,k4,k5,k6,k7,k8,k9,k10
IPQS_API_KEYS=k1,k2,k3,k4,k5,k6,k7,k8
GREYNOISE_API_KEYS=k1,k2,k3,k4,k5,k6
```

---

## 🚀 Testing Your Setup

### 1. Restart the server
```bash
npm run dev
```

### 2. Check logs on startup
You should see:
```
[ApiKeyManager] Initialized:
  VirusTotal: X keys
  IPQS: Y keys
  GreyNoise: Z keys
```

### 3. Make test requests
```bash
curl -X POST http://localhost:9000/api/ioc-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"iocs": ["8.8.8.8", "1.1.1.1", "208.67.222.222"]}'
```

### 4. Watch logs for rotation
```
[ApiKeyManager] virustotal: Using key virustotal-0 (1/4)
[ApiKeyManager] virustotal: Using key virustotal-1 (2/4)
[ApiKeyManager] virustotal: Using key virustotal-2 (3/4)
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - already in `.gitignore`
2. **Rotate keys monthly** - generate new keys periodically
3. **Monitor for leaks** - use GitHub secret scanning
4. **Limit key permissions** - use read-only keys when possible
5. **Track key usage** - monitor which keys are being used

---

## 🐛 Troubleshooting

### "No keys configured for [service]"
- Check your `.env.local` file has `[SERVICE]_API_KEYS` or `[SERVICE]_API_KEY`
- Restart the server after adding keys

### "All keys blacklisted for [service]"
- All your keys failed 3+ times
- Wait 30 minutes for auto-recovery
- Check if keys are valid

### Keys not rotating
- Verify you have multiple keys configured
- Check logs for `[ApiKeyManager]` messages
- Make sure keys are properly comma-separated

---

## 📞 Support

For issues or questions:
- Check logs: `npm run dev`
- View key stats in health endpoint: `/api/health`
- Consult: `src/lib/threat-intel/utils/api-key-manager.ts`

---

**Last Updated:** January 27, 2026
