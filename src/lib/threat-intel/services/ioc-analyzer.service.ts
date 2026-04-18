// src/lib/threat-intel/services/ioc-analyzer.service.ts

import { detectIOCType } from '@/lib/validators';
import { MultiSourceOrchestrator } from '../orchestrator/multi-source.orchestrator';
import { calculateIPRiskScore, calculateNonIPSeverity, getRiskLevelDetails } from './risk-scoring.service';
import { getGeolocationData, checkAbuseIPDB } from './ip-reputation.service';
import { saveIOCAnalysis } from '@/lib/ioc-cache';
import { getCacheTTL } from '@/lib/cache/cache-ttl';
import type { IOCAnalysisResult, IOCType } from '../types/threat-intel.types';

const orchestrator = new MultiSourceOrchestrator();

/**
 * Main IOC analysis function
 */
export async function analyzeIOC(
  ioc: string,
  label?: string,
  userId?: string
): Promise<IOCAnalysisResult> {
  const startTime = Date.now();
  const trimmedIOC = ioc.trim().toLowerCase();
  const iocType = detectIOCType(trimmedIOC) as IOCType;

  console.log(`[IOC-Analyzer] 🔍 Analyzing ${iocType}: ${trimmedIOC}`);

  try {
    // ✅ Step 1: Query all threat intelligence sources via orchestrator
    const result = await orchestrator.analyzeIOC(trimmedIOC, iocType);

    // ✅ Step 2: Handle IP-specific enrichment
    if (iocType === 'ip') {
      await enrichIPData(result);
    }

    // ✅ Step 3: Save to Mongo cache for history tracking
    if (userId) {
      try {
        const ttl = getCacheTTL(result.type as any, 'api_search');
        await saveIOCAnalysis({
          ioc: result.ioc,
          type: result.type,
          userId: userId,
          username: undefined, // Will be filled from token
          label: label,
          source: 'api_search',
          analysisResult: result, // ✅ NEW: Pass full multi-source result
          fetchedAt: new Date(),
          cacheTtlSec: ttl
        });
        console.log(`[IOC-Analyzer] ✅ Cached ${trimmedIOC} in Mongo`);
      } catch (error: any) {
        console.error('[IOC-Analyzer] ❌ Failed to cache:', error.message);
        // Don't fail the request
      }
    }

    const analysisTime = Date.now() - startTime;
    console.log(`[IOC-Analyzer] ✅ Completed in ${analysisTime}ms`);

    return result;

  } catch (error: any) {
    console.error(`[IOC-Analyzer] ❌ Error analyzing ${trimmedIOC}:`, error);
    throw error;
  }
}

/**
 * Enrich IP data with geolocation and AbuseIPDB
 */
async function enrichIPData(result: IOCAnalysisResult): Promise<void> {
  console.log('[IOC-Analyzer] 🌍 Enriching IP data...');

  try {
    // Fetch geolocation and AbuseIPDB in parallel
    const [geoData, abuseData] = await Promise.all([
      getGeolocationData(result.ioc),
      checkAbuseIPDB(result.ioc)
    ]);

    // Calculate IP risk score using multi-source data
    const multiSourceData: any = {};
    if (result.vtData) multiSourceData['VirusTotal'] = result.vtData;
    if (result.ipqsData) multiSourceData['IPQualityScore'] = result.ipqsData;
    if (result.greynoiseData) multiSourceData['GreyNoise'] = result.greynoiseData;
    if (result.threatfoxData) multiSourceData['ThreatFox'] = result.threatfoxData;

    const riskResult = calculateIPRiskScore(multiSourceData, abuseData);
    const riskDetails = getRiskLevelDetails(riskResult.level, riskResult.score);

    // Add IP-specific data to result
    result.riskScore = riskResult.score;
    result.riskLevel = riskResult.level;
    result.riskDetails = riskDetails;
    
    // Override verdict/severity with IP risk calculation
    result.verdict = riskResult.verdict;
    result.severity = riskResult.severity as any;
    result.threatIntel.riskScore = riskResult.score;
    result.threatIntel.riskLevel = riskResult.level;
    result.threatIntel.confidence = riskResult.confidence;

    // Add reputation data
    if (geoData || abuseData) {
      result.reputation = {
        geolocation: geoData as any,
        abuseipdb: abuseData as any,
        riskScore: riskResult.score,
        riskLevel: riskResult.level
      };
    }

  } catch (error: any) {
    console.error('[IOC-Analyzer] ⚠️ IP enrichment failed:', error.message);
  }
}

/**
 * Batch analyze multiple IOCs
 */
export async function analyzeIOCBatch(
  iocs: string[],
  label?: string,
  userId?: string
): Promise<IOCAnalysisResult[]> {
  console.log(`[IOC-Analyzer] 📦 Batch analyzing ${iocs.length} IOCs`);

  const results = await Promise.all(
    iocs.map(ioc => analyzeIOC(ioc, label, userId))
  );

  return results;
}
