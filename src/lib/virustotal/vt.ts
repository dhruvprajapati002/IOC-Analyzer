import { VirusTotalClient, LookupResult, IndicatorType } from './vt-orchestrator';
import { IOCType } from '../validators';

// Enhanced response with status indicators
interface VTResponse {
  data: {
    attributes: {
      last_analysis_stats?: {
        malicious: number;
        suspicious: number;
        undetected: number;
        harmless: number;
        timeout?: number;
      };
      reputation?: number;
      categories?: Record<string, string>;
      tags?: string[];
      last_modification_date?: number;
      creation_date?: number;
    };
    id: string;
    type: string;
  };
  // 🔥 ADD THESE STATUS FIELDS
  meta?: {
    success: boolean;
    error?: string;
    source: 'virustotal' | 'cache' | 'error' | 'no_api_key';
    timestamp: string;
  };
}

class EnhancedVirusTotalClient {
  private orchestrator: VirusTotalClient | null = null;
  private hasValidApiKey: boolean = false;

  constructor() {
    try {
      const apiKeys = this.getApiKeysFromEnv();

      if (apiKeys.length === 0) {
        console.warn('⚠️ [VT-Client] No VirusTotal API keys configured. VT lookups will return null.');
        this.hasValidApiKey = false;
        return; // Don't throw error - gracefully handle
      }

      console.log(`✅ [VT-Client] Initialized with ${apiKeys.length} API key(s)`);
      this.hasValidApiKey = true;

      // Initialize orchestrator with 45-minute cache TTL
      this.orchestrator = new VirusTotalClient(apiKeys, { ttlMs: 45 * 60 * 1000 });
    } catch (error) {
      console.error('❌ [VT-Client] Failed to initialize:', error);
      this.hasValidApiKey = false;
    }
  }

  /**
   * Parse API keys from environment variables supporting multiple formats
   */
  private getApiKeysFromEnv(): string[] {
    const keys: string[] = [];

    // Method 1: Comma-separated array (preferred)
    if (process.env.VT_API_KEYS) {
      const arrayKeys = process.env.VT_API_KEYS
        .split(',')
        .map(key => key.trim())
        .filter(key => key.length > 0);
      keys.push(...arrayKeys);
    }

    // Method 2: Individual numbered keys (backward compatibility)
    const individualKeys = [
      process.env.VT_API_KEY,
      process.env.VT_API_KEY_1,
      process.env.VT_API_KEY_2,
      process.env.VT_API_KEY_3,
      process.env.VT_API_KEY_4,
      process.env.VT_API_KEY_5,
    ].filter(Boolean) as string[];

    // Add individual keys that aren't already in the array
    for (const key of individualKeys) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }

    // Remove duplicates and validate
    const uniqueKeys = [...new Set(keys)].filter(key => key && key.length >= 32);

    return uniqueKeys;
  }

  /**
   * Enhanced lookup method using the new orchestrator
   */
  async lookupIOCEnhanced(ioc: string, type: IOCType): Promise<LookupResult | null> {
  // ✅ CHECK IF API KEY IS AVAILABLE
  if (!this.hasValidApiKey || !this.orchestrator) {
    console.warn(`⚠️ [VT-Client] No API key - skipping VT lookup for ${ioc}`);
    return null; // ✅ Return null, not empty object
  }

  try {
    console.log(`[VT-Client] Enhanced lookup starting for ${ioc} (type: ${type})`);
    const indicatorType = this.mapIOCTypeToIndicatorType(type);
    console.log(`[VT-Client] Mapped type ${type} -> ${indicatorType}`);
   
    const result = await this.orchestrator.lookupIndicator(ioc, { type: indicatorType });
   
    // ✅ CHECK if result has actual data
    if (!result || result.status === 'failed') {
      console.error(`❌ [VT-Client] Lookup failed for ${ioc}`);
      return null;
    }
    
    // ✅ CHECK if summary exists and has scans
    if (!result.summary || result.summary.totalScans === 0) {
      console.warn(`⚠️ [VT-Client] No scan data for ${ioc}`);
      return null;
    }
   
    return result;
  } catch (error) {
    console.error(`❌ [VT-Client] Enhanced lookup failed for ${ioc}:`, error);
    return null; // ✅ Return null on error
  }
}


  /**
   * Legacy lookup method for backward compatibility
   * Converts new orchestrator results to legacy format
   */
  async lookupIOC(ioc: string, type: IOCType): Promise<VTResponse> {
    // 🔥 CHECK IF API KEY IS AVAILABLE FIRST
    if (!this.hasValidApiKey || !this.orchestrator) {
      console.warn(`⚠️ [VT-Client] No API key configured - returning null response for ${ioc}`);
      return {
        data: {
          attributes: {
            last_analysis_stats: {
              malicious: 0,
              suspicious: 0,
              undetected: 0,
              harmless: 0,
            },
          },
          id: ioc,
          type,
        },
        meta: {
          success: false,
          error: 'No VirusTotal API key configured',
          source: 'no_api_key',
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      console.log(`[VT-Client] Starting lookupIOC for ${ioc} (type: ${type})`);
      const result = await this.lookupIOCEnhanced(ioc, type);
      
      // 🔥 CHECK IF RESULT IS NULL (API FAILURE)
      if (!result) {
        console.error(`❌ [VT-Client] No result returned for ${ioc}`);
        return {
          data: {
            attributes: {
              last_analysis_stats: {
                malicious: 0,
                suspicious: 0,
                undetected: 0,
                harmless: 0,
              },
            },
            id: ioc,
            type,
          },
          meta: {
            success: false,
            error: 'VirusTotal lookup failed or returned no data',
            source: 'error',
            timestamp: new Date().toISOString()
          }
        };
      }

      console.log(`✅ [VT-Client] Enhanced lookup completed for ${ioc}:`, result);
      
      // 🔥 VALIDATE THAT WE HAVE ACTUAL DATA
      if (!result.summary) {
        console.warn(`⚠️ [VT-Client] No summary data in result for ${ioc}`);
        return {
          data: {
            attributes: {
              last_analysis_stats: {
                malicious: 0,
                suspicious: 0,
                undetected: 0,
                harmless: 0,
              },
            },
            id: ioc,
            type,
          },
          meta: {
            success: false,
            error: 'No analysis summary available',
            source: 'error',
            timestamp: new Date().toISOString()
          }
        };
      }

      // Convert to legacy format with success metadata
      const legacyResponse: VTResponse = {
        data: {
          attributes: {
            last_analysis_stats: {
              malicious: result.summary.malicious || 0,
              suspicious: result.summary.suspicious || 0,
              undetected: result.summary.undetected || 0,
              harmless: result.summary.clean || 0,
            },
          },
          id: ioc,
          type: type,
        },
        meta: {
          success: true,
          source: 'virustotal',
          timestamp: new Date().toISOString()
        }
      };

      console.log(`✅ [VT-Client] Legacy response for ${ioc}:`, legacyResponse);
      return legacyResponse;
      
    } catch (error) {
      console.error(`❌ [VT-Client] Error in lookupIOC for ${ioc}:`, error);
      
      // 🔥 RETURN ERROR STATUS - DON'T FAKE CLEAN DATA
      return {
        data: {
          attributes: {
            last_analysis_stats: {
              malicious: 0,
              suspicious: 0,
              undetected: 0,
              harmless: 0,
            },
          },
          id: ioc,
          type,
        },
        meta: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get orchestrator statistics for monitoring
   */
  getStats() {
    return this.orchestrator?.getStats() || { error: 'No orchestrator initialized' };
  }

  /**
   * Clear cache (useful for testing or manual cache invalidation)
   */
  clearCache() {
    return this.orchestrator?.clearCache();
  }

  /**
   * Manually trigger queue processing
   */
  async runQueue() {
    if (!this.orchestrator) {
      throw new Error('Cannot run queue: No orchestrator initialized');
    }
    return await this.orchestrator.runQueue();
  }

  /**
   * Check if VT client is properly configured
   */
  isConfigured(): boolean {
    return this.hasValidApiKey && this.orchestrator !== null;
  }

  /**
   * Fetch Code Insights for a file hash
   */
  async fetchCodeInsights(fileHash: string): Promise<any> {
    if (!this.orchestrator) {
      console.warn('[VT-Client] Cannot fetch Code Insights: No orchestrator');
      return null;
    }
    return await this.orchestrator.fetchCodeInsights(fileHash);
  }

  /**
   * Fetch MITRE ATT&CK data for a file hash
   */
  async fetchMitreAttack(fileHash: string): Promise<any> {
    if (!this.orchestrator) {
      console.warn('[VT-Client] Cannot fetch MITRE ATT&CK: No orchestrator');
      return null;
    }
    return await this.orchestrator.fetchMitreAttack(fileHash);
  }

  /**
   * Fetch Graph Summary (behaviour summary with relationships)
   */
  async fetchGraphSummary(fileHash: string): Promise<any> {
    if (!this.orchestrator) {
      console.warn('[VT-Client] Cannot fetch Graph Summary: No orchestrator');
      return null;
    }
    return await this.orchestrator.fetchGraphSummary(fileHash);
  }

  /**
   * Fetch file relationships (execution_parents, contacted_ips, etc.)
   */
  async fetchFileRelationships(fileHash: string, relationship: string): Promise<any> {
    if (!this.orchestrator) {
      console.warn('[VT-Client] Cannot fetch relationships: No orchestrator');
      return null;
    }
    return await this.orchestrator.fetchFileRelationships(fileHash, relationship);
  }

  /**
   * Maps legacy IOC types to new indicator types
   */
  private mapIOCTypeToIndicatorType(iocType: IOCType): IndicatorType {
    switch (iocType) {
      case 'ip':
        return 'ip';
      case 'domain':
        return 'domain';
      case 'hash':
        return 'hash';
      case 'url':
        return 'url';
      default:
        throw new Error(`Unsupported IOC type: ${iocType}`);
    }
  }
}

export { EnhancedVirusTotalClient };
export const vtClient = new EnhancedVirusTotalClient();

// 🔥 ADD HEALTH CHECK EXPORT
export function isVirusTotalConfigured(): boolean {
  return vtClient.isConfigured();
}
