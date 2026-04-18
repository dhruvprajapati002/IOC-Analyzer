import axios from 'axios';
import { BaseThreatIntelClient } from './base.client';
import { ClientResult } from '../types/threat-intel.types';
import { apiKeyManager } from '../utils/api-key-manager';

const IPQS_API_BASE = 'https://ipqualityscore.com/api/json';

export class IPQSClient extends BaseThreatIntelClient {
  readonly name = 'ipqs';
  readonly supports: ('ip' | 'domain' | 'url' | 'hash')[] = ['ip', 'domain', 'url'];  // ✅ FIXED
  
  async query(iocValue: string, iocType: string): Promise<ClientResult> {
    const startTime = Date.now();
    
    if (!this.supportsIOCType(iocType)) {
      return this.createErrorResult('unsupported_ioc_type');
    }
    
    // Get next API key using round-robin
    const apiKey = apiKeyManager.getNextKey('ipqs');
    if (!apiKey) {
      return this.createErrorResult('no_api_key');
    }
    
    try {
      let endpoint = '';
      
      if (iocType === 'ip') {
        endpoint = `${IPQS_API_BASE}/ip/${apiKey}/${iocValue}`;
      } else {
        const encodedUrl = encodeURIComponent(iocValue);
        endpoint = `${IPQS_API_BASE}/url/${apiKey}/${encodedUrl}`;
      }
      
      const response = await axios.get(endpoint, { timeout: 5000 });
      
      if (response.data.success) {
        // Report successful API key usage
        apiKeyManager.reportSuccess('ipqs', apiKey);
        return this.createSuccessResult(response.data, Date.now() - startTime);
      }
      
      // Report API error
      apiKeyManager.reportFailure('ipqs', apiKey);
      return this.createErrorResult('api_error', response.data.message);
      
    } catch (error: any) {
      console.error('IPQS client error:', error.message);
      // Report exception/failure
      apiKeyManager.reportFailure('ipqs', apiKey);
      return this.createErrorResult('exception', error.message);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    // Check if we have at least one key available
    const apiKey = apiKeyManager.getNextKey('ipqs');
    return apiKey !== null;
  }
}
