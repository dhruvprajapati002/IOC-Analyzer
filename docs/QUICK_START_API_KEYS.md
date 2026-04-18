# Quick Start: Adding New API Keys

## 🎯 Simple 3-Step Guide

### Step 1: Get Your New Keys
- **VirusTotal:** https://www.virustotal.com/gui/my-apikey
- **IPQS:** https://www.ipqualityscore.com/create-account
- **GreyNoise:** https://www.greynoise.io/viz/account/api-key

### Step 2: Add to `.env.local`

Open your `.env.local` file and add keys in **comma-separated format**:

```bash
# Add multiple VirusTotal keys (comma-separated, NO SPACES)
VT_API_KEYS=key1,key2,key3,key4,key5

# Add multiple IPQS keys
IPQS_API_KEYS=key1,key2,key3

# Add multiple GreyNoise keys
GREYNOISE_API_KEYS=key1,key2,key3
```

**Example with real keys:**
```bash
VT_API_KEYS=a1b2c3d4e5f6,f6e5d4c3b2a1,1234567890ab
IPQS_API_KEYS=Cp2XzEbKR9MTeOa3ANQeyh8nJuxB7lVy,AnotherIPQSKey123456
GREYNOISE_API_KEYS=ijoegaqLQJpog15IS0gnUXw,SecondGreyNoiseKey987
```

### Step 3: Restart Server

```bash
npm run dev
```

You'll see in the console:
```
[ApiKeyManager] Initialized:
  VirusTotal: 5 keys
  IPQS: 2 keys
  GreyNoise: 2 keys
```

## ✅ That's It!

The system will now:
- ✅ Automatically rotate through your keys
- ✅ Skip failed keys for 30 minutes
- ✅ Maximize your API quotas
- ✅ Balance load across all keys

## 📊 Benefits

| Service | Free Limit | With 3 Keys | With 5 Keys |
|---------|-----------|------------|------------|
| **VirusTotal** | 4 req/min | **12 req/min** | **20 req/min** |
| **IPQS** | 5K req/month | **15K req/month** | **25K req/month** |
| **GreyNoise** | 50 req/day | **150 req/day** | **250 req/day** |

## 🔍 Verify It's Working

Watch your logs for rotation messages:
```bash
[ApiKeyManager] virustotal: Using key virustotal-0 (1/5)
[ApiKeyManager] virustotal: Using key virustotal-1 (2/5)
[ApiKeyManager] virustotal: Using key virustotal-2 (3/5)
...
```

## 💡 Pro Tips

1. **Always use comma-separated format** - it's cleaner
2. **No spaces around commas** - `key1,key2` not `key1, key2`
3. **Keep `.env.local` private** - never commit it
4. **Test each key first** - verify keys work before adding
5. **Monitor logs** - watch for blacklist warnings

## 🆘 Common Mistakes

❌ **Wrong:** `VT_API_KEYS=key1, key2, key3` (spaces)  
✅ **Right:** `VT_API_KEYS=key1,key2,key3`

❌ **Wrong:** Using quotes `VT_API_KEYS="key1,key2"`  
✅ **Right:** `VT_API_KEYS=key1,key2`

❌ **Wrong:** Forgot to restart server  
✅ **Right:** Always `npm run dev` after changes

---

**Full Documentation:** [API_KEY_MANAGEMENT.md](./API_KEY_MANAGEMENT.md)
