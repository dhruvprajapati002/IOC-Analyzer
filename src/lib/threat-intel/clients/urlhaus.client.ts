import axios from 'axios';
import { BaseThreatIntelClient } from './base.client';
import { ClientResult } from '../types/threat-intel.types';

const URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1/url/';

export class URLhausClient extends BaseThreatIntelClient {
  readonly name = 'urlhaus';
  readonly supports: ('ip' | 'domain' | 'url' | 'hash')[] = ['url', 'domain'];  // ✅ FIXED
  
  async query(iocValue: string, iocType: string): Promise<ClientResult> {
    const startTime = Date.now();
    
    if (!this.supportsIOCType(iocType)) {
      return this.createErrorResult('unsupported_ioc_type');
    }
    
    if (!process.env.ABUSE_CH_API_KEY) {
      return this.createErrorResult('no_api_key');
    }
    
    try {
      let urlToCheck = iocValue;
      if (iocType === 'domain' && !iocValue.startsWith('http')) {
        urlToCheck = `http://${iocValue}`;
      }
      
      const response = await axios.post(
        URLHAUS_API,
        `url=${encodeURIComponent(urlToCheck)}`,
        {
          headers: {
            'Auth-Key': process.env.ABUSE_CH_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 5000
        }
      );
      
      if (response.data.query_status === 'ok') {
        return this.createSuccessResult(response.data, Date.now() - startTime);
      } else if (response.data.query_status === 'no_results') {
        return this.createSuccessResult(null, Date.now() - startTime);
      }
      
      return this.createErrorResult('api_error');
      
    } catch (error: any) {
      console.error('URLhaus client error:', error.message);
      return this.createErrorResult('exception', error.message);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return !!process.env.ABUSE_CH_API_KEY;
  }
}
