// src/lib/threat-intel/normalizers/ipqs.normalizer.ts

import { BaseNormalizer } from './base.normalizer';
import { UnifiedThreatData, ClientResult } from '../types/threat-intel.types';

export class IPQSNormalizer extends BaseNormalizer {
  normalize(result: ClientResult): UnifiedThreatData {
    if (!result.available || !result.data) {
      return this.createUnavailableResponse('IPQualityScore');
    }

    const data = result.data;
    let score = data.fraud_score || 0;

    // Boost score for high-risk indicators
    if (data.tor) score = Math.min(score + 15, 100);
    if (data.vpn && data.fraud_score > 75) score = Math.min(score + 10, 100);
    if (data.recent_abuse) score = Math.min(score + 10, 100);
    if (data.phishing) score = Math.min(score + 20, 100);
    if (data.malware) score = Math.min(score + 20, 100);

    const threatTypes: string[] = [];
    if (data.proxy) threatTypes.push('Proxy');
    if (data.vpn) threatTypes.push('VPN');
    if (data.tor) threatTypes.push('Tor');
    if (data.bot_status) threatTypes.push('Bot');
    if (data.phishing) threatTypes.push('Phishing');
    if (data.malware) threatTypes.push('Malware');
    if (data.recent_abuse) threatTypes.push('Recent Abuse');

    const severity = this.scoreToSeverity(score);

    return {
      available: true,
      score,
      verdict: this.determineVerdict(score),
      confidence: 0.85,
      source: 'IPQualityScore',
      threat_types: threatTypes,
      details: {
        severity,
        fraud_score: data.fraud_score,
        is_proxy: data.proxy,
        is_vpn: data.vpn,
        is_tor: data.tor,
        is_bot: data.bot_status,
        recent_abuse: data.recent_abuse,
        country: data.country_code,
        isp: data.ISP,
        connection_type: data.connection_type
      }
    };
  }
}
