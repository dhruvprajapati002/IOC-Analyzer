// src/lib/threat-intel/normalizers/vt.normalizer.ts

import { BaseNormalizer } from './base.normalizer';
import { UnifiedThreatData, ClientResult, Verdict, Severity } from '../types/threat-intel.types';

export class VTNormalizer extends BaseNormalizer {
  normalize(result: ClientResult): UnifiedThreatData {
    if (!result.available || !result.data) {
      return this.createUnavailableResponse('VirusTotal');
    }

    try {
      const vtData = result.data;
      
      // ✅ Extract stats from MULTIPLE possible locations
      const rawAttributes = vtData.raw?.raw?.data?.attributes;
      const rawSummary = vtData.raw?.summary;
      
      const stats = rawAttributes?.last_analysis_stats || 
                   rawSummary?.stats || 
                   vtData.summary?.stats || 
                   vtData.summary ||
                   vtData.stats || 
                   {
                     malicious: 0,
                     suspicious: 0,
                     harmless: 0,
                     undetected: 0
                   };

      console.log('[VT Normalizer] 📊 Extracted stats:', stats);

      // Calculate total and score
      const totalScans = (stats.malicious || 0) + 
                        (stats.suspicious || 0) + 
                        (stats.harmless || stats.clean || 0) + 
                        (stats.undetected || 0);
      
      const score = totalScans > 0
        ? Math.round(((stats.malicious + stats.suspicious * 0.5) / totalScans) * 100)
        : 0;

      console.log('[VT Normalizer] 📊 Score:', score, `(${stats.malicious}/${totalScans})`);

      // Extract threat info
      const threatTypes = rawSummary?.threatTypes || 
                         vtData.threat_categories || 
                         vtData.summary?.threatTypes || 
                         vtData.threatTypes || 
                         [];
      
      const detections = rawSummary?.detections || 
                        vtData.detections || 
                        vtData.summary?.detections || 
                        [];
      
      // Extract malware families
      const malwareFamilies: string[] = [];
      
      if (vtData.family_labels) {
        malwareFamilies.push(...vtData.family_labels);
      }
      
      if (rawSummary?.familyLabels) {
        malwareFamilies.push(...rawSummary.familyLabels);
      }
      
      if (rawAttributes?.tags) {
        malwareFamilies.push(...rawAttributes.tags);
      }
      
      const popularThreatLabel = rawAttributes?.popular_threat_classification?.suggested_threat_label ||
                                vtData.popular_threat_label;
      
      if (popularThreatLabel) {
        malwareFamilies.push(popularThreatLabel);
      }

      const severity = this.scoreToSeverity(score);

      return {
        available: true,
        score: score,
        verdict: this.determineVerdict(score), // ✅ Uses base class method
        confidence: totalScans > 0 ? Math.min((stats.malicious + stats.suspicious) / totalScans, 0.95) : 0,
        source: 'VirusTotal',
        malware_families: this.cleanArray(malwareFamilies),
        threat_types: threatTypes,
        details: {
          severity,
          stats: {
            malicious: stats.malicious || 0,
            suspicious: stats.suspicious || 0,
            harmless: stats.harmless || stats.clean || 0,
            undetected: stats.undetected || 0
          },
          detections: detections.slice(0, 20),
          popular_threat_label: popularThreatLabel,
          suggested_threat_label: rawAttributes?.popular_threat_classification?.suggested_threat_label ||
                                 vtData.suggested_threat_label,
          last_analysis_date: rawAttributes?.last_analysis_date
        },
        raw_data: vtData
      };

    } catch (error: any) {
      console.error('[VT-Normalizer] ❌ Error:', error);
      console.error('[VT-Normalizer] ❌ Stack:', error.stack);
      return this.createUnavailableResponse('VirusTotal');
    }
  }
}
