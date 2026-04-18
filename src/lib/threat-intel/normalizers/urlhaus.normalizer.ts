// src/lib/threat-intel/normalizers/urlhaus.normalizer.ts

import { BaseNormalizer } from './base.normalizer';
import { UnifiedThreatData, ClientResult } from '../types/threat-intel.types';

export class URLhausNormalizer extends BaseNormalizer {
  normalize(result: ClientResult): UnifiedThreatData {
    if (!result.available) {
      return this.createUnavailableResponse('URLhaus');
    }

    if (!result.data) {
      return {
        available: true,
        score: 0,
        verdict: 'clean',
        confidence: 0.85,
        source: 'URLhaus',
        details: { severity: 'clean' }
      };
    }

    const data = result.data;
    let score = 70;
    let severity = 'medium';

    if (data.url_status === 'online') {
      score = 90;
      severity = 'high'; // Active threat
    }

    // Extract malware families
    const malwareFamilies: string[] = [];
    if (data.payloads && Array.isArray(data.payloads)) {
      data.payloads.forEach((payload: any) => {
        if (payload.signature) malwareFamilies.push(payload.signature);
      });
    }

    return {
      available: true,
      score,
      verdict: 'malicious',
      confidence: 0.90,
      source: 'URLhaus',
      malware_families: this.cleanArray(malwareFamilies),
      threat_types: [data.threat, ...(data.tags || [])],
      details: {
        severity,
        url_status: data.url_status,
        threat: data.threat,
        date_added: data.date_added,
        host: data.host
      }
    };
  }
}
