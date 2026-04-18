// Client-side VirusTotal API utility
// Uses server-side /api/ioc endpoint

import { apiFetch } from "../apiFetch";

export interface VTAnalysisStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  timeout?: number;
  threatTypes?: string[];
  detections?: Array<{
    engine: string;
    category: string;
    result: string;
  }>;
}

export interface VTAnalysisResult {
  ioc: string;
  type: string;
  verdict: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unknown' | 'error';
  stats: VTAnalysisStats;
  error?: string;
  source?: 'virustotal' | 'cache' | 'error';
  threatTypes?: string[];
  topDetections?: string[];
  cached?: boolean;
}

export class ClientVirusTotalService {
  // 🔥 FIXED: Use correct endpoint
  private readonly serverEndpoint = '/api/ioc';

  constructor() {
    console.log('[VT-Client] Initialized client-side VirusTotal service');
  }

  async analyzeIOC(ioc: string, type: string): Promise<VTAnalysisResult> {
    try {
      console.log(`[VT-Client] 🔍 Analyzing ${ioc} (${type})`);

      const startTime = Date.now();

      // 🔥 FIXED: Use /api/ioc endpoint with array format
      const response = await apiFetch(this.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iocs: [ioc],
          label: 'Client Analysis',
        }),
      });

      const elapsed = Date.now() - startTime;
      console.log(`[VT-Client] ⏱️ Response received in ${elapsed}ms`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.results || result.results.length === 0) {
        throw new Error('Analysis failed');
      }

      // 🔥 Get first result from array
      const data = result.results[0];

      if (!data || !data.stats) {
        throw new Error('Invalid response structure');
      }

      const totalScans = data.stats.malicious + data.stats.suspicious +
        data.stats.harmless + data.stats.undetected;

      // Extract threat types
      const threatTypes = data.threatIntel?.threatTypes || [];
      const topDetections = data.threatIntel?.detections
        ?.slice(0, 5)
        .map((d: any) => `${d.engine}: ${d.result}`) || [];

      console.log(`[VT-Client] ✅ Analysis completed:`);
      console.log(`  ├─ Verdict: ${data.verdict}`);
      console.log(`  ├─ Stats: M=${data.stats.malicious}, S=${data.stats.suspicious}`);
      console.log(`  ├─ Total scans: ${totalScans}`);
      console.log(`  ├─ 🦠 Threat types: ${threatTypes.join(', ') || 'None'}`);
      console.log(`  └─ Cached: ${data.cached}`);

      if (totalScans === 0) {
        console.warn('[VT-Client] ⚠️ WARNING: Total scans is 0');
      }

      return {
        ioc: data.ioc,
        type: data.type,
        verdict: data.verdict,
        stats: data.stats,
        source: data.cached ? 'cache' : 'virustotal',
        cached: data.cached,
        threatTypes,
        topDetections,
      };
    } catch (error) {
      console.error(`[VT-Client] ❌ Error analyzing ${ioc}:`, error);

      let errorMessage = 'Unknown error';
      let verdict: VTAnalysisResult['verdict'] = 'error';

      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('401')) {
          errorMessage = 'API authentication failed';
          verdict = 'unknown';
        } else if (error.message.includes('404')) {
          errorMessage = 'IOC not found';
          verdict = 'undetected';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded';
          verdict = 'unknown';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        ioc,
        type,
        verdict,
        stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 },
        error: errorMessage,
        source: 'error',
      };
    }
  }

  async analyzeBatch(
    iocs: Array<{ ioc: string; type: string }>,
    onProgress?: (current: number, total: number, result: VTAnalysisResult) => void
  ): Promise<VTAnalysisResult[]> {
    const total = iocs.length;
    console.log(`[VT-Client] 📦 Batch analysis of ${total} IOCs`);

    // 🔥 FIXED: Send all IOCs at once to /api/ioc
    try {
      const response = await apiFetch(this.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iocs: iocs.map(i => i.ioc),
          label: 'Batch Analysis',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.results) {
        throw new Error('Batch analysis failed');
      }

      // Convert results to VTAnalysisResult format
      const results: VTAnalysisResult[] = result.results.map((data: any, index: number) => {
        const threatTypes = data.threatIntel?.threatTypes || [];
        const topDetections = data.threatIntel?.detections
          ?.slice(0, 5)
          .map((d: any) => `${d.engine}: ${d.result}`) || [];

        // Call progress callback
        if (onProgress) {
          const vtResult: VTAnalysisResult = {
            ioc: data.ioc,
            type: data.type,
            verdict: data.verdict,
            stats: data.stats,
            source: data.cached ? 'cache' : 'virustotal',
            cached: data.cached,
            threatTypes,
            topDetections,
          };
          onProgress(index + 1, total, vtResult);
        }

        return {
          ioc: data.ioc,
          type: data.type,
          verdict: data.verdict,
          stats: data.stats,
          source: data.cached ? 'cache' : 'virustotal',
          cached: data.cached,
          threatTypes,
          topDetections,
        };
      });

      const successCount = results.filter(r => r.verdict !== 'error').length;
      const threatTypesFound = new Set<string>();

      results.forEach(r => {
        if (r.threatTypes) {
          r.threatTypes.forEach(t => threatTypesFound.add(t));
        }
      });

      console.log(`[VT-Client] ✅ Batch complete: ${successCount}/${total} successful`);
      console.log(`[VT-Client] 🦠 Threats: ${Array.from(threatTypesFound).join(', ') || 'None'}`);

      return results;
    } catch (error) {
      console.error('[VT-Client] ❌ Batch analysis failed:', error);

      // Return error results for all IOCs
      return iocs.map(({ ioc, type }) => ({
        ioc,
        type,
        verdict: 'error' as const,
        stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 },
        error: error instanceof Error ? error.message : 'Batch analysis failed',
        source: 'error' as const,
      }));
    }
  }

  static summarizeResults(results: VTAnalysisResult[]) {
    const threatTypes = new Set<string>();

    const summary = {
      total: results.length,
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
      errors: 0,
      totalDetections: 0,
      detectionRate: 0,
      threatTypes: [] as string[],
    };

    results.forEach(result => {
      if (result.verdict === 'error') {
        summary.errors++;
      } else if (result.verdict === 'malicious') {
        summary.malicious++;
        summary.totalDetections += result.stats.malicious;
      } else if (result.verdict === 'suspicious') {
        summary.suspicious++;
        summary.totalDetections += result.stats.suspicious;
      } else if (result.verdict === 'harmless') {
        summary.harmless++;
      } else if (result.verdict === 'undetected') {
        summary.undetected++;
      }

      if (result.threatTypes) {
        result.threatTypes.forEach(t => threatTypes.add(t));
      }
    });

    const scannedResults = results.filter(r => r.verdict !== 'error');
    if (scannedResults.length > 0) {
      summary.detectionRate =
        (summary.malicious + summary.suspicious) / scannedResults.length;
    }

    summary.threatTypes = Array.from(threatTypes);

    return summary;
  }

  static isThreat(result: VTAnalysisResult): boolean {
    return result.verdict === 'malicious' ||
      result.verdict === 'suspicious' ||
      result.stats.malicious > 0 ||
      result.stats.suspicious > 2;
  }

  static getThreatLevel(result: VTAnalysisResult): {
    level: 'critical' | 'high' | 'medium' | 'low' | 'none' | 'unknown';
    color: string;
    label: string;
  } {
    if (result.verdict === 'error') {
      return { level: 'unknown', color: 'gray', label: 'Unknown' };
    }

    const malicious = result.stats.malicious || 0;
    const suspicious = result.stats.suspicious || 0;
    const totalScans = malicious + suspicious +
      (result.stats.harmless || 0) +
      (result.stats.undetected || 0);

    if (totalScans === 0) {
      return { level: 'unknown', color: 'gray', label: 'Not Analyzed' };
    }

    const detectionRate = (malicious + suspicious) / totalScans;

    if (malicious > 10 || detectionRate > 0.3) {
      return { level: 'critical', color: 'red', label: 'Critical Threat' };
    }
    if (malicious > 5 || detectionRate > 0.15) {
      return { level: 'high', color: 'orange', label: 'High Risk' };
    }
    if (malicious > 2 || suspicious > 5 || detectionRate > 0.05) {
      return { level: 'medium', color: 'yellow', label: 'Medium Risk' };
    }
    if (malicious > 0 || suspicious > 0) {
      return { level: 'low', color: 'blue', label: 'Low Risk' };
    }

    return { level: 'none', color: 'green', label: 'Clean' };
  }
}

export const vtService = new ClientVirusTotalService();
export const { summarizeResults, isThreat, getThreatLevel } = ClientVirusTotalService;
