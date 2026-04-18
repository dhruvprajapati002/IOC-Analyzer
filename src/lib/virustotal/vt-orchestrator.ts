/**
 * VirusTotal Orchestrator with Threat Detection Enhancement + Graph Builder
 * Added: Threat type extraction (Trojan, Malware, Virus, etc.) + Comprehensive Graph Relationships
 */

import { apiFetch } from "../apiFetch";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type IndicatorType = "hash" | "url" | "ip" | "domain";
export type KeyStatus = "ok" | "cooldown" | "invalid";

export interface ApiKey {
  id: string;
  key: string;
  status: KeyStatus;
  remaining?: number;
  resetAt?: Date;
  lastError?: string;
}

export interface RateLimitInfo {
  remaining?: number;
  resetAt?: Date;
  retryAfter?: number;
}

// 🔥 ENHANCED: Added threat detection fields
export interface LookupResult {
  status: "served_from_cache" | "served_live" | "queued_rate_limited" | "failed";
  indicator: string;
  summary?: {
    malicious: number;
    suspicious: number;
    clean: number;
    undetected: number;
    totalScans: number;
    threatTypes?: string[];
    detections?: Array<{
      engine: string;
      category: string;
      result: string;
    }>;
    familyLabels?: string[];
  };
  vtLink?: string;
  keyId?: string;
  rateLimitInfo?: RateLimitInfo;
  eta?: Date;
  error?: string;
  raw?: any;
}

export interface LookupOptions {
  type?: IndicatorType;
  forceRefresh?: boolean;
}

interface CacheEntry {
  data: any;
  expiresAt: Date;
  indicator: string;
}

interface QueuedRequest {
  indicator: string;
  type: IndicatorType;
  resolve: (result: LookupResult) => void;
  reject: (error: Error) => void;
  queuedAt: Date;
}

// 🔥 NEW: Graph-specific types
export interface GraphNode {
  id: string;
  label: string;
  count: number;
  items: string[];
}

export interface GraphRelationship {
  id: string;
  label: string;
  data: any[];
}

export interface GraphData {
  nodes: GraphNode[];
  totalRelationships: number;
  relationships: GraphRelationship[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizeIndicator(indicator: string, type?: IndicatorType): { normalized: string; detectedType: IndicatorType } {
  const trimmed = indicator.trim();
  let detectedType: IndicatorType;

  if (type) {
    detectedType = type;
  } else {
    if (/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$|^[a-fA-F0-9]{128}$/.test(trimmed)) {
      detectedType = "hash";
    } else if (/^https?:\/\//.test(trimmed)) {
      detectedType = "url";
    } else if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(trimmed)) {
      detectedType = "ip";
    } else {
      detectedType = "domain";
    }
  }

  switch (detectedType) {
    case "hash":
      return { normalized: trimmed.toLowerCase(), detectedType };
    case "domain":
      return { normalized: trimmed.toLowerCase(), detectedType };
    case "ip":
      return { normalized: trimmed, detectedType };
    case "url":
      try {
        const url = new URL(trimmed);
        url.hostname = url.hostname.toLowerCase();
        return { normalized: url.toString(), detectedType };
      } catch {
        return { normalized: trimmed.toLowerCase(), detectedType };
      }
    default:
      return { normalized: trimmed.toLowerCase(), detectedType };
  }
}

function calculateBackoff(attempt: number, maxDelayMs = 30000): number {
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), maxDelayMs);
  const jitter = Math.random() * 0.1 * baseDelay;
  return Math.floor(baseDelay + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function maskApiKey(key: string): string {
  return key.length > 8 ? `${key.substring(0, 8)}...` : key;
}

// ============================================================================
// VIRUSTOTAL CLIENT IMPLEMENTATION
// ============================================================================

export class VirusTotalClient {
  private readonly keys: ApiKey[];
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlightRequests = new Map<string, Promise<LookupResult>>();
  private readonly requestQueue: QueuedRequest[] = [];
  private readonly ttlMs: number;
  private queueProcessorRunning = false;
  private currentKeyIndex = 0;

  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    queuedRequests: 0,
    failedRequests: 0,
    keyRotations: 0,
  };

  constructor(apiKeys: string[], options: { ttlMs?: number } = {}) {
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error("At least one VirusTotal API key is required");
    }

    this.keys = apiKeys.map(key => ({
      id: maskApiKey(key),
      key,
      status: "ok" as KeyStatus,
    }));

    this.ttlMs = options.ttlMs || 45 * 60 * 1000;
    console.log(`[VT-Orchestrator] Initialized with ${this.keys.length} API keys`);
  }

  // ============================================================================
  // CORE LOOKUP METHODS
  // ============================================================================

  async lookupIndicator(indicator: string, options: LookupOptions = {}): Promise<LookupResult> {
    const { normalized, detectedType } = normalizeIndicator(indicator, options.type);
    const cacheKey = `${detectedType}:${normalized}`;

    this.stats.totalRequests++;
    console.log(`[VT-Orchestrator] 🔎 Lookup: ${detectedType}:${normalized.substring(0, 30)}`);

    if (!options.forceRefresh) {
      const cached = this._getCached(cacheKey);
      if (cached) {
        // Check if cached data has full result structure or just summary
        if (cached.data && typeof cached.data === 'object') {
          // New format: full result cached
          if ('summary' in cached.data && 'raw' in cached.data) {
            this.stats.cacheHits++;
            return {
              status: "served_from_cache",
              indicator: normalized,
              summary: cached.data.summary,
              vtLink: this._generateVTLink(normalized, detectedType),
              raw: cached.data.raw
            };
          }

          // Old format: just summary cached
          const summary = 'malicious' in cached.data
            ? cached.data
            : this._parseVTResponse(cached);

          if (summary && summary.totalScans > 0) {
            this.stats.cacheHits++;
            return {
              status: "served_from_cache",
              indicator: normalized,
              summary,
              vtLink: this._generateVTLink(normalized, detectedType),
            };
          }
        }
        this.cache.delete(cacheKey);
      }
    }

    this.stats.cacheMisses++;

    const existingRequest = this.inFlightRequests.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    const requestPromise = this._executeRequest(normalized, detectedType);
    this.inFlightRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache the full result (summary + raw data) for complete data retrieval
      if (result.status === "served_live" && result.summary && result.summary.totalScans > 0) {
        this._setCached(cacheKey, {
          summary: result.summary,
          raw: result.raw
        });
      }

      return result;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  private async _executeRequest(indicator: string, type: IndicatorType): Promise<LookupResult> {
    const maxAttempts = 3;
    let lastError: string = "";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const key = this._pickAvailableKey();
        if (!key) return this._queueRequest(indicator, type);

        return await this._makeVTRequest(indicator, type, key);
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (attempt < maxAttempts - 1) {
          await sleep(calculateBackoff(attempt));
        }
      }
    }

    this.stats.failedRequests++;
    return { status: "failed", indicator, error: lastError };
  }

  private async _makeVTRequest(indicator: string, type: IndicatorType, key: ApiKey): Promise<LookupResult> {
    const endpoint = this._getEndpoint(indicator, type);
    const url = `https://www.virustotal.com/api/v3${endpoint}`;

    console.log(`[VT-Orchestrator] 🔍 Request: ${type}:${indicator.substring(0, 20)} with key ${key.id}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await apiFetch(url, {
        method: 'GET',
        headers: {
          'x-apikey': key.key,
          'User-Agent': 'IOC-Analyzer-Pro/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this._updateKeyStateFromHeaders(key, response);

      let data: any = null;

      if (response.status === 200 || response.status === 404) {
        data = await response.json();
      }

      if (response.status === 200) {
        const summary = this._parseVTResponse(data);

        // For file hashes, fetch MITRE ATT&CK data separately
        if (type === 'hash' && data?.data?.attributes) {
          try {
            console.log('[VT-Orchestrator] 🔍 Fetching MITRE ATT&CK data for file...');
            const mitreData = await this.fetchMitreAttack(indicator);
            if (mitreData) {
              // Inject MITRE data into the raw response
              if (!data.data.attributes.mitre_attack_techniques) {
                data.data.attributes.mitre_attack_techniques = mitreData;
                console.log('[VT-Orchestrator] ✅ MITRE ATT&CK data added to response');
              }
            } else {
              console.log('[VT-Orchestrator] ℹ️ No MITRE ATT&CK data available for this file');
            }
          } catch (mitreError: any) {
            console.error('[VT-Orchestrator] ⚠️ Failed to fetch MITRE data:', mitreError.message);
            // Don't fail the whole request if MITRE fetch fails
          }
        }

        return {
          status: "served_live",
          indicator,
          summary,
          vtLink: this._generateVTLink(indicator, type),
          keyId: key.id,
          rateLimitInfo: this._extractRateLimitInfo(response),
          raw: data
        };
      }

      if (response.status === 429) {
        this._handleRateLimit(key, response);
        return this._queueRequest(indicator, type);
      }

      if (response.status === 401 || response.status === 403) {
        this._markKeyInvalid(key, `HTTP ${response.status}`);
        throw new Error(`Key invalid: ${response.status}`);
      }

      if (response.status === 404) {
        return {
          status: "served_live",
          indicator,
          summary: {
            malicious: 0,
            suspicious: 0,
            clean: 0,
            undetected: 0,
            totalScans: 0,
            threatTypes: [],
            detections: [],
            familyLabels: []
          },
          vtLink: this._generateVTLink(indicator, type),
          keyId: key.id,
        };
      }

      throw new Error(`HTTP ${response.status}`);

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ============================================================================
  // KEY MANAGEMENT
  // ============================================================================

  private _pickAvailableKey(): ApiKey | null {
    const now = new Date();

    const available = this.keys.filter(k =>
      k.status !== "invalid" &&
      !(k.status === "cooldown" && k.resetAt && now < k.resetAt)
    );

    if (available.length === 0) {
      console.warn('[VT-Orchestrator] ⚠️ No available API keys (all rate-limited or invalid)');
      return null;
    }

    let selectedKey: ApiKey | null = null;
    const startIndex = this.currentKeyIndex % this.keys.length;

    for (let i = 0; i < this.keys.length; i++) {
      const keyIndex = (startIndex + i) % this.keys.length;
      const key = this.keys[keyIndex];

      if (key.status !== "invalid" &&
        !(key.status === "cooldown" && key.resetAt && now < key.resetAt)) {
        selectedKey = key;
        this.currentKeyIndex = (keyIndex + 1) % this.keys.length;
        this.stats.keyRotations++;

        console.log(`[VT-Orchestrator] 🔄 Using API key ${key.id} (${keyIndex + 1}/${this.keys.length})`);
        break;
      }
    }

    return selectedKey;
  }

  private _updateKeyStateFromHeaders(key: ApiKey, response: Response): void {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining) key.remaining = parseInt(remaining, 10);
    if (reset) key.resetAt = new Date(parseInt(reset, 10) * 1000);

    if (key.status === "cooldown" && key.remaining && key.remaining > 0) {
      key.status = "ok";
    }
  }

  private _handleRateLimit(key: ApiKey, response: Response): void {
    const retryAfter = response.headers.get('Retry-After');
    const reset = response.headers.get('X-RateLimit-Reset');

    let resetAt = new Date(Date.now() + 60000);
    if (retryAfter) resetAt = new Date(Date.now() + parseInt(retryAfter) * 1000);
    else if (reset) resetAt = new Date(parseInt(reset) * 1000);

    key.status = "cooldown";
    key.resetAt = resetAt;
    key.remaining = 0;
  }

  private _markKeyInvalid(key: ApiKey, reason: string): void {
    key.status = "invalid";
    key.lastError = reason;
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  private _queueRequest(indicator: string, type: IndicatorType): Promise<LookupResult> {
    return new Promise((resolve) => {
      this.requestQueue.push({ indicator, type, resolve, reject: () => { }, queuedAt: new Date() });
      this.stats.queuedRequests++;

      if (!this.queueProcessorRunning) {
        this._startQueueProcessor();
      }

      resolve({
        status: "queued_rate_limited",
        indicator,
        eta: this._getEarliestResetTime(),
      });
    });
  }

  private _getEarliestResetTime(): Date | undefined {
    const resets = this.keys
      .filter(k => k.resetAt && k.resetAt > new Date())
      .map(k => k.resetAt!)
      .sort((a, b) => a.getTime() - b.getTime());

    return resets[0];
  }

  private async _startQueueProcessor(): Promise<void> {
    if (this.queueProcessorRunning) return;
    this.queueProcessorRunning = true;

    while (this.requestQueue.length > 0) {
      const earliest = this._getEarliestResetTime();
      if (earliest && earliest > new Date()) {
        await sleep(Math.min(earliest.getTime() - Date.now(), 60000));
        continue;
      }

      const req = this.requestQueue.shift();
      if (req) {
        try {
          const result = await this._executeRequest(req.indicator, req.type);
          req.resolve(result);
        } catch (err) {
          req.reject(err as Error);
        }
      }
      await sleep(100);
    }

    this.queueProcessorRunning = false;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private _getCached(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry || new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry;
  }

  private _setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiresAt: new Date(Date.now() + this.ttlMs),
      indicator: key,
    });
  }

  private _cleanupCache(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) this.cache.delete(key);
    }
  }

  // ============================================================================
  // RESPONSE PARSING & THREAT DETECTION
  // ============================================================================

  private _parseVTResponse(data: any): LookupResult['summary'] {
    console.log('[VT-Orchestrator] 🔧 Parsing VT response...');

    if (data && 'malicious' in data && 'totalScans' in data) {
      return data;
    }

    const stats = data?.data?.attributes?.last_analysis_stats ||
      data?.attributes?.last_analysis_stats ||
      data?.last_analysis_stats;

    if (!stats) {
      console.warn('[VT-Orchestrator] ⚠️ No stats found');
      return {
        malicious: 0,
        suspicious: 0,
        clean: 0,
        undetected: 0,
        totalScans: 0,
        threatTypes: [],
        detections: [],
        familyLabels: []
      };
    }

    const malicious = parseInt(String(stats.malicious || 0), 10);
    const suspicious = parseInt(String(stats.suspicious || 0), 10);
    const clean = parseInt(String(stats.harmless || 0), 10);
    const undetected = parseInt(String(stats.undetected || 0), 10);
    const totalScans = malicious + suspicious + clean + undetected;

    const threatTypesSet = new Set<string>();
    const detections: Array<{ engine: string; category: string; result: string }> = [];

    const results = data?.data?.attributes?.last_analysis_results ||
      data?.attributes?.last_analysis_results || {};

    for (const [engineName, engineResult] of Object.entries(results)) {
      const result = engineResult as any;

      if (result.category === 'malicious' || result.category === 'suspicious') {
        detections.push({
          engine: engineName,
          category: result.category,
          result: result.result
        });

        if (result.result) {
          const threatType = this._extractThreatType(result.result);
          if (threatType) threatTypesSet.add(threatType);
        }
      }
    }

    const familyLabels = this._extractFamilyLabels(data);

    const tags = data?.data?.attributes?.tags || data?.attributes?.tags || [];
    tags.forEach((tag: string) => {
      const threatType = this._extractThreatType(tag);
      if (threatType) threatTypesSet.add(threatType);
    });

    const threatTypes = Array.from(threatTypesSet);

    console.log(`[VT-Orchestrator] 📊 Stats: M=${malicious}, S=${suspicious}, C=${clean}, U=${undetected}`);
    console.log(`[VT-Orchestrator] 🦠 Threats: ${threatTypes.join(', ') || 'None'}`);
    console.log(`[VT-Orchestrator] 🏷️ Family Labels: ${familyLabels.join(', ') || 'None'}`);

    if (malicious > 0 && threatTypes.length === 0) {
      threatTypes.push('Malware');
    }

    return {
      malicious,
      suspicious,
      clean,
      undetected,
      totalScans,
      threatTypes,
      detections,
      familyLabels
    };
  }

  private _extractFamilyLabels(data: any): string[] {
    const tags = data?.data?.attributes?.tags ||
      data?.attributes?.tags ||
      [];

    if (!Array.isArray(tags) || tags.length === 0) {
      return [];
    }

    const familyLabels = tags.filter((tag: string) => {
      const lower = tag.toLowerCase();

      if (lower.includes('peexe') ||
        lower.includes('pedll') ||
        lower.includes('pe32') ||
        lower.includes('pe64') ||
        lower.includes('overlay') ||
        lower.includes('runtime') ||
        lower.includes('signed') ||
        lower.includes('invalid-signature') ||
        lower.includes('detect') ||
        lower.includes('contains') ||
        lower.includes('packer') ||
        lower === 'exe' ||
        lower === 'dll' ||
        lower === 'zip' ||
        lower === 'rar' ||
        lower === 'pdf') {
        return false;
      }

      return tag.length > 2;
    });

    return familyLabels.slice(0, 10);
  }

  private _extractThreatType(resultString: string): string | null {
    const lower = resultString.toLowerCase();

    if (lower.includes('ransomware') || lower.includes('ransom')) return 'Ransomware';
    if (lower.includes('trojan')) return 'Trojan';
    if (lower.includes('backdoor')) return 'Backdoor';
    if (lower.includes('rootkit')) return 'Rootkit';
    if (lower.includes('spyware') || lower.includes('stealer') || lower.includes('infostealer')) return 'Spyware';
    if (lower.includes('adware')) return 'Adware';
    if (lower.includes('bot') || lower.includes('botnet')) return 'Botnet';
    if (lower.includes('phish')) return 'Phishing';
    if (lower.includes('worm')) return 'Worm';
    if (lower.includes('virus')) return 'Virus';
    if (lower.includes('exploit')) return 'Exploit';
    if (lower.includes('ddos') || lower.includes('dos')) return 'DDoS';
    if (lower.includes('miner') || lower.includes('coinminer') || lower.includes('cryptominer')) return 'Cryptominer';
    if (lower.includes('rat') || lower.includes('remote access')) return 'RAT';
    if (lower.includes('loader') || lower.includes('downloader')) return 'Loader';
    if (lower.includes('keylog')) return 'Keylogger';
    if (lower.includes('malware') || lower.includes('malicious')) return 'Malware';

    return null;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private _getEndpoint(indicator: string, type: IndicatorType): string {
    switch (type) {
      case "hash": return `/files/${indicator}`;
      case "url": return `/urls/${Buffer.from(indicator).toString('base64').replace(/=/g, '')}`;
      case "ip": return `/ip_addresses/${indicator}`;
      case "domain": return `/domains/${indicator}`;
      default: throw new Error(`Unsupported type: ${type}`);
    }
  }

  private _generateVTLink(indicator: string, type: IndicatorType): string {
    switch (type) {
      case "hash": return `https://www.virustotal.com/gui/file/${indicator}`;
      case "url": return `https://www.virustotal.com/gui/url/${Buffer.from(indicator).toString('base64url')}`;
      case "ip": return `https://www.virustotal.com/gui/ip-address/${indicator}`;
      case "domain": return `https://www.virustotal.com/gui/domain/${indicator}`;
      default: return `https://www.virustotal.com/gui/search/${encodeURIComponent(indicator)}`;
    }
  }

  private _extractRateLimitInfo(response: Response): RateLimitInfo {
    return {
      remaining: response.headers.get('X-RateLimit-Remaining') ?
        parseInt(response.headers.get('X-RateLimit-Remaining')!, 10) : undefined,
      resetAt: response.headers.get('X-RateLimit-Reset') ?
        new Date(parseInt(response.headers.get('X-RateLimit-Reset')!, 10) * 1000) : undefined,
    };
  }

  // ============================================================================
  // 🔥 GRAPH BUILDER METHODS - ADD HERE
  // ============================================================================

  /**
   * Remove duplicate items and filter invalid entries
   */
  private _deduplicateItems(items: string[]): string[] {
    return Array.from(new Set(
      items.filter(item =>
        item &&
        item !== 'unknown' &&
        item.length > 0 &&
        item.length < 256
      )
    ));
  }

  /**
   * Extract item identifiers from VT relationship response
   */
  private _extractItemsFromRelationship(data: any[], relationType: string): string[] {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((item: any) => {
      if (relationType === 'resolutions') {
        return item.attributes?.ip_address || item.attributes?.host_name || 'unknown';
      }

      if (relationType === 'network_location' || relationType === 'last_serving_ip_address') {
        return item.id || 'unknown';
      }

      return item.id ||
        item.attributes?.name ||
        item.attributes?.url ||
        item.attributes?.value ||
        'unknown';
    }).filter(item => item !== 'unknown');
  }

  /**
   * 🔥 NEW: Fetch ALL relationships for a file hash in parallel
   */
  /**
  * 🔥 FIXED: Only FREE API relationships (removed premium endpoints)
  */
  async fetchAllFileRelationships(fileHash: string): Promise<GraphData> {
    const relationships = [
      { id: 'execution_parents', label: 'Execution Parents' },
      { id: 'contacted_ips', label: 'Contacted IPs' },
      { id: 'contacted_domains', label: 'Contacted Domains' },
      { id: 'contacted_urls', label: 'Contacted URLs' },
      { id: 'dropped_files', label: 'Dropped Files' },
    ];

    console.log(`[VT-Orchestrator] 🌐 Fetching ${relationships.length} FREE relationship types for ${fileHash.substring(0, 12)}...`);

    const results = await Promise.allSettled(
      relationships.map(async (rel) => {
        try {
          const data = await this.fetchFileRelationships(fileHash, rel.id);
          return { ...rel, data };
        } catch (error) {
          // ✅ Log the actual error message
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[VT-Orchestrator] ❌ ${rel.id} error: ${errorMsg}`);
          throw error; // ✅ Re-throw so Promise.allSettled catches it
        }
      })
    );

    const nodes: GraphNode[] = [];
    const relationshipsData: GraphRelationship[] = [];
    let totalItems = 0;
    let successCount = 0;
    let failCount = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data.length > 0) {
        successCount++;
        const { id, label, data } = result.value;

        const items = this._deduplicateItems(
          this._extractItemsFromRelationship(data, id)
        );

        if (items.length > 0) {
          nodes.push({
            id,
            label,
            count: items.length,
            items: items.slice(0, 40)
          });

          relationshipsData.push({ id, label, data });
          totalItems += items.length;
        }
      } else if (result.status === 'rejected') {
        failCount++;
        // ✅ Error already logged in the catch block above
      }
    });

    // ✅ Log summary
    console.log(`[VT-Orchestrator] ✅ Graph built: ${nodes.length} relationship types, ${totalItems} total items`);
    console.log(`[VT-Orchestrator] 📊 Success: ${successCount}/${relationships.length}, Failed: ${failCount}`);

    return {
      nodes,
      totalRelationships: totalItems,
      relationships: relationshipsData
    };
  }


  /**
   * 🔥 NEW: Fetch ALL relationships for a domain in parallel
   */
  async fetchAllDomainRelationships(domain: string): Promise<GraphData> {
    const encodedDomain = encodeURIComponent(domain);

    const relationships = [
      { id: 'communicating_files', label: 'Communicating Files', endpoint: `/domains/${encodedDomain}/communicating_files?limit=40` },
      { id: 'downloaded_files', label: 'Downloaded Files', endpoint: `/domains/${encodedDomain}/downloaded_files?limit=40` },
      { id: 'referrer_files', label: 'Referrer Files', endpoint: `/domains/${encodedDomain}/referrer_files?limit=40` },
      { id: 'resolutions', label: 'DNS Resolutions', endpoint: `/domains/${encodedDomain}/resolutions?limit=40` },
      { id: 'subdomains', label: 'Subdomains', endpoint: `/domains/${encodedDomain}/subdomains?limit=40` },
      { id: 'urls', label: 'URLs', endpoint: `/domains/${encodedDomain}/urls?limit=40` },
      { id: 'caa_records', label: 'CAA Records', endpoint: `/domains/${encodedDomain}/caa_records?limit=40` },
      { id: 'cname_records', label: 'CNAME Records', endpoint: `/domains/${encodedDomain}/cname_records?limit=40` },
      { id: 'mx_records', label: 'MX Records', endpoint: `/domains/${encodedDomain}/mx_records?limit=40` },
      { id: 'ns_records', label: 'NS Records', endpoint: `/domains/${encodedDomain}/ns_records?limit=40` },
    ];

    return await this._fetchRelationshipsParallel(relationships, domain);
  }

  /**
   * 🔥 NEW: Fetch ALL relationships for an IP address in parallel
   */
  async fetchAllIPRelationships(ip: string): Promise<GraphData> {
    const relationships = [
      { id: 'communicating_files', label: 'Communicating Files', endpoint: `/ip_addresses/${ip}/communicating_files?limit=40` },
      { id: 'downloaded_files', label: 'Downloaded Files', endpoint: `/ip_addresses/${ip}/downloaded_files?limit=40` },
      { id: 'referrer_files', label: 'Referrer Files', endpoint: `/ip_addresses/${ip}/referrer_files?limit=40` },
      { id: 'resolutions', label: 'DNS Resolutions', endpoint: `/ip_addresses/${ip}/resolutions?limit=40` },
      { id: 'urls', label: 'URLs', endpoint: `/ip_addresses/${ip}/urls?limit=40` },
    ];

    return await this._fetchRelationshipsParallel(relationships, ip);
  }

  /**
   * 🔥 NEW: Fetch ALL relationships for a URL in parallel
   */
  async fetchAllURLRelationships(url: string): Promise<GraphData> {
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');

    const relationships = [
      { id: 'downloaded_files', label: 'Downloaded Files', endpoint: `/urls/${urlId}/downloaded_files?limit=40` },
      { id: 'last_serving_ip_address', label: 'Serving IP', endpoint: `/urls/${urlId}/last_serving_ip_address` },
      { id: 'network_location', label: 'Network Location', endpoint: `/urls/${urlId}/network_location` },
      { id: 'redirecting_urls', label: 'Redirecting URLs', endpoint: `/urls/${urlId}/redirecting_urls?limit=40` },
      { id: 'redirects_to', label: 'Redirects To', endpoint: `/urls/${urlId}/redirects_to?limit=40` },
    ];

    return await this._fetchRelationshipsParallel(relationships, url);
  }

  /**
   * 🔥 HELPER: Generic parallel relationship fetcher
   */
  private async _fetchRelationshipsParallel(
    relationships: Array<{ id: string; label: string; endpoint: string }>,
    indicator: string
  ): Promise<GraphData> {
    console.log(`[VT-Orchestrator] 🌐 Fetching ${relationships.length} relationship types for ${indicator.substring(0, 30)}...`);

    const key = this._pickAvailableKey();
    if (!key) {
      console.warn('[VT-Orchestrator] ⚠️ No API key available for relationships');
      return { nodes: [], totalRelationships: 0, relationships: [] };
    }

    const results = await Promise.allSettled(
      relationships.map(async (rel) => {
        try {
          const url = `https://www.virustotal.com/api/v3${rel.endpoint}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await apiFetch(url, {
            method: 'GET',
            headers: { 'x-apikey': key.key },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.status === 404 || response.status === 403) {
            console.log(`[VT-Orchestrator] ℹ️ ${rel.id}: Not available (${response.status})`);
            return { ...rel, data: [] };
          }

          if (!response.ok) {
            console.warn(`[VT-Orchestrator] ⚠️ ${rel.id}: HTTP ${response.status}`);
            return { ...rel, data: [] };
          }

          const json = await response.json();
          const data = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);

          return { ...rel, data };
        } catch (error) {
          console.warn(`[VT-Orchestrator] ⚠️ ${rel.id} failed:`, error);
          return { ...rel, data: [] };
        }
      })
    );

    const nodes: GraphNode[] = [];
    const relationshipsData: GraphRelationship[] = [];
    let totalItems = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data.length > 0) {
        const { id, label, data } = result.value;

        const items = this._deduplicateItems(
          this._extractItemsFromRelationship(data, id)
        );

        if (items.length > 0) {
          nodes.push({
            id,
            label,
            count: items.length,
            items: items.slice(0, 40)
          });

          relationshipsData.push({ id, label, data });
          totalItems += items.length;
        }
      }
    });

    console.log(`[VT-Orchestrator] ✅ Graph built: ${nodes.length} relationship types, ${totalItems} total items`);

    return {
      nodes,
      totalRelationships: totalItems,
      relationships: relationshipsData
    };
  }

  /**
   * 🔥 NEW: Smart graph builder - automatically detects IOC type
   */
  async buildGraph(indicator: string, type?: IndicatorType): Promise<GraphData> {
    const { normalized, detectedType } = normalizeIndicator(indicator, type);

    console.log(`[VT-Orchestrator] 🎯 Building graph for ${detectedType}: ${normalized.substring(0, 30)}...`);

    switch (detectedType) {
      case 'hash':
        return await this.fetchAllFileRelationships(normalized);
      case 'domain':
        return await this.fetchAllDomainRelationships(normalized);
      case 'ip':
        return await this.fetchAllIPRelationships(normalized);
      case 'url':
        return await this.fetchAllURLRelationships(normalized);
      default:
        throw new Error(`Unsupported IOC type for graph: ${detectedType}`);
    }
  }

  // ============================================================================
  // EXISTING SPECIALIZED FETCH METHODS
  // ============================================================================

  async fetchCodeInsights(fileHash: string): Promise<any> {
    const key = this._pickAvailableKey();
    if (!key) {
      console.warn('[VT-Orchestrator] ⚠️ No API key available for Code Insights');
      return null;
    }

    const url = `https://www.virustotal.com/api/v3/files/${fileHash}/code_insight`;

    try {
      const response = await apiFetch(url, {
        method: 'GET',
        headers: { 'x-apikey': key.key },
      });

      if (response.status === 404) {
        console.log(`[VT-Orchestrator] ℹ️ No Code Insights for ${fileHash.substring(0, 12)}...`);
        return null;
      }

      if (response.status === 403) {
        console.log(`[VT-Orchestrator] ℹ️ Code Insights requires Premium API (403)`);
        return null;
      }

      if (response.status === 400) {
        console.log(`[VT-Orchestrator] ℹ️ Code Insights not available for this file (400)`);
        return null;
      }

      if (!response.ok) {
        console.warn(`[VT-Orchestrator] ⚠️ Code Insights error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`[VT-Orchestrator] ✅ Code Insights fetched`);

      return data.data?.attributes || data.data || null;
    } catch (error) {
      console.error(`[VT-Orchestrator] ❌ Code Insights error:`, error);
      return null;
    }
  }

  async fetchMitreAttack(fileHash: string): Promise<any> {
    const key = this._pickAvailableKey();
    if (!key) {
      console.warn('[VT-Orchestrator] ⚠️ No API key available for MITRE ATT&CK');
      return null;
    }

    const url = `https://www.virustotal.com/api/v3/files/${fileHash}/behaviour_mitre_trees`;

    try {
      const response = await apiFetch(url, {
        method: 'GET',
        headers: { 'x-apikey': key.key },
      });

      if (response.status === 404) {
        console.log(`[VT-Orchestrator] ℹ️ No MITRE ATT&CK for ${fileHash.substring(0, 12)}...`);
        return null;
      }

      if (!response.ok) {
        console.warn(`[VT-Orchestrator] ⚠️ MITRE ATT&CK error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`[VT-Orchestrator] ✅ MITRE ATT&CK fetched`);
      return data.data;
    } catch (error) {
      console.error(`[VT-Orchestrator] ❌ MITRE ATT&CK error:`, error);
      return null;
    }
  }

  async fetchGraphSummary(fileHash: string): Promise<any> {
    const key = this._pickAvailableKey();
    if (!key) {
      console.warn('[VT-Orchestrator] ⚠️ No API key available for Graph Summary');
      return null;
    }

    const url = `https://www.virustotal.com/api/v3/files/${fileHash}/behaviour_summary`;

    try {
      const response = await apiFetch(url, {
        method: 'GET',
        headers: { 'x-apikey': key.key },
      });

      if (response.status === 404) {
        console.log(`[VT-Orchestrator] ℹ️ No Graph Summary for ${fileHash.substring(0, 12)}...`);
        return null;
      }

      if (!response.ok) {
        console.warn(`[VT-Orchestrator] ⚠️ Graph Summary error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`[VT-Orchestrator] ✅ Graph Summary fetched`);
      return data.data;
    } catch (error) {
      console.error(`[VT-Orchestrator] ❌ Graph Summary error:`, error);
      return null;
    }
  }

  async fetchFileRelationships(fileHash: string, relationship: string): Promise<any> {
    const key = this._pickAvailableKey();
    if (!key) {
      console.warn('[VT-Orchestrator] ⚠️ No API key available for relationships');
      throw new Error('No API key available'); // ✅ Throw instead of return []
    }

    const url = `https://www.virustotal.com/api/v3/files/${fileHash}/${relationship}?limit=40`;

    try {
      const response = await apiFetch(url, {
        method: 'GET',
        headers: { 'x-apikey': key.key },
      });

      if (response.status === 404) {
        console.log(`[VT-Orchestrator] ℹ️ No ${relationship} for ${fileHash.substring(0, 12)}...`);
        return [];
      }

      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}`;
        console.error(`[VT-Orchestrator] ❌ ${relationship} error: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log(`[VT-Orchestrator] ✅ ${relationship} fetched: ${data.data?.length || 0} items`);
      return data.data || [];
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[VT-Orchestrator] ❌ ${relationship} error:`, errorMsg);
      throw error; // ✅ Re-throw so caller knows it failed
    }
  }

  // ============================================================================
  // PUBLIC UTILITY METHODS
  // ============================================================================

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      queueDepth: this.requestQueue.length,
      cacheHitRatio: this.stats.totalRequests > 0 ? this.stats.cacheHits / this.stats.totalRequests : 0,
    };
  }

  async runQueue(): Promise<void> {
    if (!this.queueProcessorRunning) {
      await this._startQueueProcessor();
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}
