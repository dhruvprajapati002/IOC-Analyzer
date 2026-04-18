// src/lib/threat-intel/normalizers/base.normalizer.ts

import { UnifiedThreatData, ClientResult, Verdict } from '../types/threat-intel.types';

export interface ThreatDataNormalizer {
  normalize(result: ClientResult): UnifiedThreatData;
}

export abstract class BaseNormalizer implements ThreatDataNormalizer {
  abstract normalize(result: ClientResult): UnifiedThreatData;

  protected createUnavailableResponse(sourceName: string): UnifiedThreatData {
    return {
      available: false,
      score: 0,
      verdict: 'unknown',
      confidence: 0,
      source: sourceName
    };
  }

  protected determineVerdict(score: number): 'malicious' | 'suspicious' | 'clean' {
    if (score >= 70) return 'malicious';
    if (score >= 40) return 'suspicious';
    return 'clean';
  }

  protected cleanArray(arr: any[]): string[] {
    return [...new Set(arr.filter(Boolean).map(String))];
  }

  /**
   * Convert score to severity for storage
   */
  protected scoreToSeverity(score: number): string {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    if (score > 0) return 'low';
    return 'clean';
  }
}
