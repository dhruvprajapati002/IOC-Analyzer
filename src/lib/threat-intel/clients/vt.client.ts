import { vtClient } from '@/lib/virustotal/vt';
import { BaseThreatIntelClient } from './base.client';
import { ClientResult } from '../types/threat-intel.types';

export class VirusTotalClient extends BaseThreatIntelClient {
  readonly name = 'virustotal';
  readonly supports: ('ip' | 'domain' | 'url' | 'hash')[] = ['ip', 'domain', 'url', 'hash'];  // ✅ FIXED
  
  async query(iocValue: string, iocType: string): Promise<ClientResult> {
    const startTime = Date.now();
    
    if (!this.supportsIOCType(iocType)) {
      return this.createErrorResult('unsupported_ioc_type');
    }
    
    if (!vtClient.isConfigured()) {
      return this.createErrorResult('not_configured', 'VT API key not available');
    }
    
    try {
      const result = await vtClient.lookupIOCEnhanced(iocValue, iocType as any);
      
      if (!result) {
        return this.createErrorResult('no_data');
      }
      
      if (result.status === 'queued_rate_limited') {
        return this.createErrorResult(
          'rate_limited',
          `Request queued, ETA: ${result.eta}`
        );
      }
      
      if (result.status === 'failed') {
        return this.createErrorResult('api_error', result.error);
      }
      
      return this.createSuccessResult(result, Date.now() - startTime);
      
    } catch (error: any) {
      console.error('VT client error:', error.message);
      return this.createErrorResult('exception', error.message);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return vtClient.isConfigured();
  }
  
  async getQuota(): Promise<number> {
    // VT client stats don't include quota information
    return 0;
  }
}
