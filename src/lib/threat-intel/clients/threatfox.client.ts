import axios from 'axios';
import { BaseThreatIntelClient } from './base.client';
import { ClientResult } from '../types/threat-intel.types';

const THREATFOX_API = 'https://threatfox-api.abuse.ch/api/v1/';

export class ThreatFoxClient extends BaseThreatIntelClient {
  readonly name = 'threatfox';
  readonly supports: ('ip' | 'domain' | 'url' | 'hash')[] = ['ip', 'domain'];  // ✅ FIXED
  
  async query(iocValue: string, iocType: string): Promise<ClientResult> {
    const startTime = Date.now();
    
    if (!this.supportsIOCType(iocType)) {
      return this.createErrorResult('unsupported_ioc_type');
    }
    
    if (!process.env.ABUSE_CH_API_KEY) {
      return this.createErrorResult('no_api_key');
    }
    
    try {
      const response = await axios.post(
        THREATFOX_API,
        `query=search_ioc&search_term=${iocValue}`,
        {
          headers: {
            'Auth-Key': process.env.ABUSE_CH_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 5000
        }
      );
      
      if (response.data.query_status === 'ok' && response.data.data) {
        return this.createSuccessResult(response.data.data, Date.now() - startTime);
      } else if (response.data.query_status === 'no_result') {
        return this.createSuccessResult(null, Date.now() - startTime);
      }
      
      return this.createErrorResult('api_error');
      
    } catch (error: any) {
      console.error('ThreatFox client error:', error.message);
      return this.createErrorResult('exception', error.message);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return !!process.env.ABUSE_CH_API_KEY;
  }
}
