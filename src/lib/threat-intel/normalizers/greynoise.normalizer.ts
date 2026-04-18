import { BaseNormalizer } from './base.normalizer';
import { UnifiedThreatData, ClientResult } from '../types/threat-intel.types';

export class GreyNoiseNormalizer extends BaseNormalizer {
  normalize(result: ClientResult): UnifiedThreatData {
    if (!result.available || !result.data) {
      return this.createUnavailableResponse('GreyNoise');
    }
    
    const data = result.data;
    
    // RIOT = legitimate service (Google, Cloudflare, etc.)
    if (data.riot) {
      return {
        available: true,
        score: 0,
        verdict: 'whitelisted',
        confidence: 1.0,
        source: 'GreyNoise',
        threat_types: ['Legitimate Service'],
        details: {
          name: data.name,
          riot: true,
          classification: data.classification
        },
        raw_data: data
      };
    }
    
    let score = 0;
    let verdict: any = 'clean';
    
    if (data.classification === 'malicious') {
      score = 75;
      verdict = 'malicious';
    } else if (data.classification === 'unknown' && data.noise) {
      score = 40;  // Scanner but not confirmed malicious
      verdict = 'suspicious';
    } else if (data.classification === 'benign') {
      score = 0;
      verdict = 'clean';
    }
    
    return {
      available: true,
      score: score,
      verdict: verdict,
      confidence: 0.85,
      source: 'GreyNoise',
      threat_types: data.noise ? ['Internet Scanner'] : [],
      details: {
        noise: data.noise,
        riot: data.riot,
        classification: data.classification,
        name: data.name,
        last_seen: data.last_seen
      },
      raw_data: data
    };
  }
}
