/**
 * API Key Manager with Round-Robin Load Balancing
 * Supports: VirusTotal, IPQS, GreyNoise, AbuseIPDB
 * 
 * Usage:
 * - Automatically rotates through multiple API keys
 * - Tracks failed keys and skips them temporarily
 * - Supports comma-separated and numbered key formats
 */

export type ServiceName = 'virustotal' | 'ipqs' | 'greynoise' | 'abuseipdb';

export interface ApiKeyInfo {
  key: string;
  id: string;
  service: ServiceName;
  failCount: number;
  lastFailTime?: Date;
  lastUsed?: Date;
  isBlacklisted: boolean;
}

export interface KeyRotationStats {
  totalRequests: number;
  totalRotations: number;
  blacklistedKeys: number;
}

class ApiKeyManager {
  private keys: Map<ServiceName, ApiKeyInfo[]> = new Map();
  private currentIndex: Map<ServiceName, number> = new Map();
  private stats: Map<ServiceName, KeyRotationStats> = new Map();
  
  // Blacklist a key after 3 consecutive failures
  private readonly MAX_FAILURES = 3;
  // Retry blacklisted keys after 30 minutes
  private readonly BLACKLIST_DURATION_MS = 30 * 60 * 1000;

  constructor() {
    this.initializeKeys();
  }

  /**
   * Initialize API keys from environment variables
   */
  private initializeKeys(): void {
    // Initialize VirusTotal keys
    this.keys.set('virustotal', this.loadKeysForService('virustotal'));
    
    // Initialize IPQS keys
    this.keys.set('ipqs', this.loadKeysForService('ipqs'));
    
    // Initialize GreyNoise keys
    this.keys.set('greynoise', this.loadKeysForService('greynoise'));
    
    // Initialize AbuseIPDB keys
    this.keys.set('abuseipdb', this.loadKeysForService('abuseipdb'));
    
    // Initialize counters
    this.currentIndex.set('virustotal', 0);
    this.currentIndex.set('ipqs', 0);
    this.currentIndex.set('greynoise', 0);
    this.currentIndex.set('abuseipdb', 0);
    
    // Initialize stats
    this.stats.set('virustotal', { totalRequests: 0, totalRotations: 0, blacklistedKeys: 0 });
    this.stats.set('ipqs', { totalRequests: 0, totalRotations: 0, blacklistedKeys: 0 });
    this.stats.set('greynoise', { totalRequests: 0, totalRotations: 0, blacklistedKeys: 0 });
    this.stats.set('abuseipdb', { totalRequests: 0, totalRotations: 0, blacklistedKeys: 0 });
    
    console.log('[ApiKeyManager] Initialized:');
    console.log(`  VirusTotal: ${this.keys.get('virustotal')?.length || 0} keys`);
    console.log(`  IPQS: ${this.keys.get('ipqs')?.length || 0} keys`);
    console.log(`  GreyNoise: ${this.keys.get('greynoise')?.length || 0} keys`);
    console.log(`  AbuseIPDB: ${this.keys.get('abuseipdb')?.length || 0} keys`);
  }

  /**
   * Load keys for a specific service from environment variables
   */
  private loadKeysForService(service: ServiceName): ApiKeyInfo[] {
    const keys: ApiKeyInfo[] = [];
    const envPrefix = this.getEnvPrefix(service);
    
    // Method 1: Comma-separated array (e.g., VT_API_KEYS)
    const arrayEnvKey = `${envPrefix}_KEYS`;
    if (process.env[arrayEnvKey]) {
      const arrayKeys = process.env[arrayEnvKey]!
        .split(',')
        .map(key => key.trim())
        .filter(key => key.length > 0);
      
      arrayKeys.forEach((key, index) => {
        keys.push({
          key,
          id: `${service}-array-${index}`,
          service,
          failCount: 0,
          isBlacklisted: false,
        });
      });
    }
    
    // Method 2: Individual numbered keys (e.g., VT_API_KEY, VT_API_KEY_1, VT_API_KEY_2)
    const singleKey = process.env[`${envPrefix}_KEY`];
    if (singleKey && !keys.find(k => k.key === singleKey)) {
      keys.push({
        key: singleKey,
        id: `${service}-0`,
        service,
        failCount: 0,
        isBlacklisted: false,
      });
    }
    
    // Check numbered keys (1-10)
    for (let i = 1; i <= 10; i++) {
      const numberedKey = process.env[`${envPrefix}_KEY_${i}`];
      if (numberedKey && !keys.find(k => k.key === numberedKey)) {
        keys.push({
          key: numberedKey,
          id: `${service}-${i}`,
          service,
          failCount: 0,
          isBlacklisted: false,
        });
      }
    }
    
    return keys;
  }

  /**
   * Get environment variable prefix for a service
   */
  private getEnvPrefix(service: ServiceName): string {
    switch (service) {
      case 'virustotal': return 'VT_API';
      case 'ipqs': return 'IPQS_API';
      case 'greynoise': return 'GREYNOISE_API';
      case 'abuseipdb': return 'ABUSEIPDB_API';
    }
  }

  /**
   * Get the next available API key using round-robin
   * @param service - The service name (virustotal, ipqs, greynoise)
   * @returns API key string or null if no keys available
   */
  getNextKey(service: ServiceName): string | null {
    const serviceKeys = this.keys.get(service);
    if (!serviceKeys || serviceKeys.length === 0) {
      console.warn(`[ApiKeyManager] No keys configured for ${service}`);
      return null;
    }
    
    const stats = this.stats.get(service)!;
    stats.totalRequests++;
    
    // Clean up expired blacklists
    this.cleanupBlacklist(service);
    
    // Filter out blacklisted keys
    const availableKeys = serviceKeys.filter(k => !k.isBlacklisted);
    
    if (availableKeys.length === 0) {
      console.warn(`[ApiKeyManager] All keys blacklisted for ${service}`);
      // Return any key as last resort (might have recovered)
      return serviceKeys[0]?.key || null;
    }
    
    // Get current index for this service
    let currentIdx = this.currentIndex.get(service) || 0;
    
    // Find the next available (non-blacklisted) key
    let attempts = 0;
    let selectedKey: ApiKeyInfo | undefined;
    
    while (attempts < serviceKeys.length) {
      const key = serviceKeys[currentIdx % serviceKeys.length];
      if (!key.isBlacklisted) {
        selectedKey = key;
        break;
      }
      currentIdx++;
      attempts++;
    }
    
    if (!selectedKey) {
      return null;
    }
    
    // Update last used
    selectedKey.lastUsed = new Date();
    
    // Move to next key for next request
    this.currentIndex.set(service, (currentIdx + 1) % serviceKeys.length);
    stats.totalRotations++;
    
    console.log(`[ApiKeyManager] ${service}: Using key ${selectedKey.id} (${currentIdx % serviceKeys.length + 1}/${serviceKeys.length})`);
    
    return selectedKey.key;
  }

  /**
   * Report a failed API key
   */
  reportFailure(service: ServiceName, apiKey: string): void {
    const serviceKeys = this.keys.get(service);
    if (!serviceKeys) return;
    
    const keyInfo = serviceKeys.find(k => k.key === apiKey);
    if (!keyInfo) return;
    
    keyInfo.failCount++;
    keyInfo.lastFailTime = new Date();
    
    // Blacklist if exceeded max failures
    if (keyInfo.failCount >= this.MAX_FAILURES && !keyInfo.isBlacklisted) {
      keyInfo.isBlacklisted = true;
      const stats = this.stats.get(service)!;
      stats.blacklistedKeys++;
      
      console.warn(
        `[ApiKeyManager] ⚠️ Blacklisted ${service} key ${keyInfo.id} ` +
        `(${keyInfo.failCount} failures). Will retry in ${this.BLACKLIST_DURATION_MS / 60000} min`
      );
    }
  }

  /**
   * Report a successful API key usage (reset fail count)
   */
  reportSuccess(service: ServiceName, apiKey: string): void {
    const serviceKeys = this.keys.get(service);
    if (!serviceKeys) return;
    
    const keyInfo = serviceKeys.find(k => k.key === apiKey);
    if (keyInfo) {
      keyInfo.failCount = 0;
      keyInfo.isBlacklisted = false;
    }
  }

  /**
   * Remove expired blacklists
   */
  private cleanupBlacklist(service: ServiceName): void {
    const serviceKeys = this.keys.get(service);
    if (!serviceKeys) return;
    
    const now = Date.now();
    
    serviceKeys.forEach(keyInfo => {
      if (
        keyInfo.isBlacklisted &&
        keyInfo.lastFailTime &&
        now - keyInfo.lastFailTime.getTime() > this.BLACKLIST_DURATION_MS
      ) {
        console.log(`[ApiKeyManager] ✅ Restored ${service} key ${keyInfo.id} (blacklist expired)`);
        keyInfo.isBlacklisted = false;
        keyInfo.failCount = 0;
        const stats = this.stats.get(service)!;
        stats.blacklistedKeys = Math.max(0, stats.blacklistedKeys - 1);
      }
    });
  }

  /**
   * Get statistics for a service
   */
  getStats(service: ServiceName): KeyRotationStats & { totalKeys: number; availableKeys: number } {
    const stats = this.stats.get(service) || { totalRequests: 0, totalRotations: 0, blacklistedKeys: 0 };
    const serviceKeys = this.keys.get(service) || [];
    const availableKeys = serviceKeys.filter(k => !k.isBlacklisted).length;
    
    return {
      ...stats,
      totalKeys: serviceKeys.length,
      availableKeys,
    };
  }

  /**
   * Reload keys from environment (useful after .env changes)
   */
  reloadKeys(): void {
    console.log('[ApiKeyManager] Reloading keys from environment...');
    this.keys.clear();
    this.initializeKeys();
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();
