import axios from 'axios';
import { BaseThreatIntelClient } from './base.client';
import { ClientResult } from '../types/threat-intel.types';
import { apiKeyManager } from '../utils/api-key-manager';

const GREYNOISE_API = 'https://api.greynoise.io/v3/community';

export class GreyNoiseClient extends BaseThreatIntelClient {
  readonly name = 'greynoise';
  readonly supports: ('ip' | 'domain' | 'url' | 'hash')[] = ['ip'];  // ✅ FIXED
  
  async query(iocValue: string, iocType: string): Promise<ClientResult> {
    const startTime = Date.now();
    
    if (!this.supportsIOCType(iocType)) {
      return this.createErrorResult('unsupported_ioc_type');
    }
    
    // Get next API key using round-robin
    const apiKey = apiKeyManager.getNextKey('greynoise');
    if (!apiKey) {
      return this.createErrorResult('no_api_key');
    }
    
    try {
      const response = await axios.get(`${GREYNOISE_API}/${iocValue}`, {
        headers: { 'key': apiKey },
        timeout: 5000
      });
      
      if (response.data.ip) {
        // Report successful API key usage
        apiKeyManager.reportSuccess('greynoise', apiKey);
        return this.createSuccessResult(response.data, Date.now() - startTime);
      }
      
      // Report API error
      apiKeyManager.reportFailure('greynoise', apiKey);
      return this.createErrorResult('api_error');
      
    } catch (error: any) {
      console.error('GreyNoise client error:', error.message);
      // Report exception/failure
      apiKeyManager.reportFailure('greynoise', apiKey);
      return this.createErrorResult('exception', error.message);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    // Check if we have at least one key available
    const apiKey = apiKeyManager.getNextKey('greynoise');
    return apiKey !== null;
  }
}
