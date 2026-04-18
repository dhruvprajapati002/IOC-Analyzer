// src/lib/threat-intel/normalizers/threatfox.normalizer.ts

import { BaseNormalizer } from './base.normalizer';
import { UnifiedThreatData, ClientResult } from '../types/threat-intel.types';

export class ThreatFoxNormalizer extends BaseNormalizer {
  normalize(result: ClientResult): UnifiedThreatData {
    if (!result.available) {
      return this.createUnavailableResponse('ThreatFox');
    }

    if (!result.data || result.data.length === 0) {
      return {
        available: true,
        score: 0,
        verdict: 'unknown',
        confidence: 0.50,
        source: 'ThreatFox',
        details: { severity: 'unknown' }
      };
    }

    const threat = result.data[0];
    let score = threat.confidence_level || 75;
    let severity = 'medium';

    // Boost score for C2 servers
    if (threat.threat_type === 'botnet_cc') {
      score = Math.max(score, 85);
      severity = 'high';
    } else if (threat.threat_type === 'payload_delivery') {
      score = Math.max(score, 80);
      severity = 'high';
    }

    // Extract malware families
    const malwareFamilies: string[] = [];
    if (threat.malware_printable) malwareFamilies.push(threat.malware_printable);
    if (threat.malware_alias) {
      malwareFamilies.push(...threat.malware_alias.split(',').map((s: string) => s.trim()));
    }

    return {
      available: true,
      score,
      verdict: this.determineVerdict(score),
      confidence: (threat.confidence_level || 75) / 100,
      source: 'ThreatFox',
      malware_families: this.cleanArray(malwareFamilies),
      threat_types: [threat.threat_type_desc, ...(threat.tags || [])],
      details: {
        severity,
        threat_type: threat.threat_type,
        malware: threat.malware,
        confidence_level: threat.confidence_level,
        first_seen: threat.first_seen,
        last_seen: threat.last_seen
      }
    };
  }
}
