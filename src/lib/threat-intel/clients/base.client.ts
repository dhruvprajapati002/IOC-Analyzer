import { ClientResult } from '../types/threat-intel.types';

/**
 * Base interface all threat intelligence clients must implement
 */
export interface ThreatIntelClient {
  readonly name: string;
  readonly supports: ('ip' | 'domain' | 'url' | 'hash')[];
  
  /**
   * Query the threat intelligence source
   */
  query(iocValue: string, iocType: string): Promise<ClientResult>;
  
  /**
   * Check if source is available/healthy
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get remaining API quota (-1 = unlimited)
   */
  getQuota(): Promise<number>;
}

/**
 * Abstract base class with common functionality
 */
export abstract class BaseThreatIntelClient implements ThreatIntelClient {
  abstract readonly name: string;
  abstract readonly supports: ('ip' | 'domain' | 'url' | 'hash')[];
  
  abstract query(iocValue: string, iocType: string): Promise<ClientResult>;
  
  async isAvailable(): Promise<boolean> {
    // Override in child classes if needed
    return true;
  }
  
  async getQuota(): Promise<number> {
    // Override in child classes if needed
    return -1;  // Unlimited by default
  }
  
  /**
   * Helper: Check if IOC type is supported
   */
  protected supportsIOCType(iocType: string): boolean {
    return this.supports.includes(iocType as any);
  }
  
  /**
   * Helper: Create error result
   */
  protected createErrorResult(reason: string, error?: string): ClientResult {
    return {
      available: false,
      reason,
      error
    };
  }
  
  /**
   * Helper: Create success result
   */
  protected createSuccessResult(data: any, responseTime: number): ClientResult {
    return {
      available: true,
      data,
      response_time_ms: responseTime
    };
  }
}
