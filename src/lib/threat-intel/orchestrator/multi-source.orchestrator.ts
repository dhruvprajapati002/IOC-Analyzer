// src/lib/threat-intel/orchestrator/multi-source.orchestrator.ts

import type { 
  IOCAnalysisResult, 
  IOCType, 
  UnifiedThreatData, 
  Severity, 
  Verdict,
  Detection 
} from '../types/threat-intel.types';
import { VirusTotalClient } from '../clients/vt.client';
import { GreyNoiseClient } from '../clients/greynoise.client';
import { IPQSClient } from '../clients/ipqs.client';
import { ThreatFoxClient } from '../clients/threatfox.client';
import { MalwareBazaarClient } from '../clients/malwarebazaar.client';
import { URLhausClient } from '../clients/urlhaus.client';
import { VTNormalizer } from '../normalizers/vt.normalizer';
import { GreyNoiseNormalizer } from '../normalizers/greynoise.normalizer';
import { IPQSNormalizer } from '../normalizers/ipqs.normalizer';
import { ThreatFoxNormalizer } from '../normalizers/threatfox.normalizer';
import { MalwareBazaarNormalizer } from '../normalizers/malwarebazaar.normalizer';
import { URLhausNormalizer } from '../normalizers/urlhaus.normalizer';
import { extractFileInfo, parseMitreAttack, extractFamilyLabels } from '../services/vt-extractor.service';

/**
 * Severity hierarchy for aggregation
 */
const SEVERITY_RANK: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  clean: 1,
  unknown: 0
};

export class MultiSourceOrchestrator {
  private clients: Map<string, any>;
  private normalizers: Map<string, any>;

  constructor() {
    // Initialize clients
    this.clients = new Map();
    this.clients.set('virustotal', new VirusTotalClient());
    this.clients.set('greynoise', new GreyNoiseClient());
    this.clients.set('ipqs', new IPQSClient());
    this.clients.set('threatfox', new ThreatFoxClient());
    this.clients.set('malwarebazaar', new MalwareBazaarClient());
    this.clients.set('urlhaus', new URLhausClient());

    // Initialize normalizers
    this.normalizers = new Map();
    this.normalizers.set('virustotal', new VTNormalizer());
    this.normalizers.set('greynoise', new GreyNoiseNormalizer());
    this.normalizers.set('ipqs', new IPQSNormalizer());
    this.normalizers.set('threatfox', new ThreatFoxNormalizer());
    this.normalizers.set('malwarebazaar', new MalwareBazaarNormalizer());
    this.normalizers.set('urlhaus', new URLhausNormalizer());
  }

 // src/lib/threat-intel/orchestrator/multi-source.orchestrator.ts

/**
 * Analyze IOC across all relevant sources
 */
async analyzeIOC(ioc: string, iocType: IOCType): Promise<IOCAnalysisResult> {
  console.log(`[Orchestrator] 🎯 Analyzing ${iocType}: ${ioc}`);

  // Initialize result with defaults
  const result: IOCAnalysisResult = {
    ioc,
    type: iocType,
    verdict: 'unknown',
    severity: 'unknown',
    stats: {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0
    },
    threatIntel: {
      threatTypes: [],
      detections: [],
      severity: 'unknown',
      confidence: 0
    },
    sources_available: [],
    sources_failed: [],
    cached: false,
    fetchedAt: new Date().toISOString()
  };

  // Query all sources in parallel
  const sourcePromises: Promise<{ source: string; data: UnifiedThreatData }>[] = [];

  for (const [sourceName, client] of this.clients.entries()) {
    sourcePromises.push(this.querySource(sourceName, client, ioc, iocType));
  }

  const sourceResults = await Promise.allSettled(sourcePromises);

  // Collect all successful source data
  const successfulSources: UnifiedThreatData[] = [];

  for (const promiseResult of sourceResults) {
    if (promiseResult.status === 'fulfilled') {
      const { source, data } = promiseResult.value;

      if (data.available) {
        successfulSources.push(data);
        result.sources_available!.push(source);

        // Store source-specific data
        this.storeSourceData(result, source, data);

        // ✅ Extract file info, sandbox analysis, and MITRE data for hash type
        if (source === 'virustotal' && result.type === 'hash') {
          // Handle both fresh VT response and cached data
          const vtRaw = data.raw_data?.raw;
          const attrs = vtRaw?.data?.attributes;
          const fullData = data.raw_data?.full_data || data.raw_data?.raw;
          const fullDataAttrs = fullData?.data?.attributes || fullData;
          
          if ((vtRaw && attrs) || fullDataAttrs) {
            // Extract file info using vt-extractor service
            try {
              const fileInfo = extractFileInfo(data.raw_data, result.ioc);
              if (fileInfo) {
                result.fileInfo = fileInfo;
                console.log('[Orchestrator] ✅ Extracted file info:', fileInfo.name);
              }
            } catch (error: any) {
              console.error('[Orchestrator] ⚠️ Failed to extract file info:', error.message);
            }

            // Extract sandbox analysis with verdicts
            const sandboxVerdicts = vtRaw?.sandbox_verdicts || attrs?.sandbox_verdicts || fullDataAttrs?.sandbox_verdicts;
            if (sandboxVerdicts && Object.keys(sandboxVerdicts).length > 0) {
              const verdicts: Array<{
                sandbox: string;
                verdict: string;
                malware_classification: string[];
                confidence: number;
                sandbox_name: string;
              }> = Object.entries(sandboxVerdicts).map(([sandboxKey, verdictData]: [string, any]) => ({
                sandbox: sandboxKey,
                verdict: verdictData.category || verdictData.verdict || 'unknown',
                malware_classification: Array.isArray(verdictData.malware_classification) 
                  ? verdictData.malware_classification 
                  : Array.isArray(verdictData.malware_names)
                  ? verdictData.malware_names
                  : verdictData.malware_classification 
                  ? [verdictData.malware_classification]
                  : [],
                confidence: typeof verdictData.confidence === 'number' ? verdictData.confidence : 0,
                sandbox_name: verdictData.sandbox_name || sandboxKey
              }));

              const maliciousCount = verdicts.filter(v => v.verdict === 'malicious').length;
              const suspiciousCount = verdicts.filter(v => v.verdict === 'suspicious').length;
              const cleanCount = verdicts.filter(v => 
                v.verdict === 'harmless' || 
                v.verdict === 'clean' || 
                v.verdict === 'undetected'
              ).length;

              result.sandboxAnalysis = {
                verdicts: verdicts,
                summary: {
                  malicious: maliciousCount,
                  suspicious: suspiciousCount,
                  clean: cleanCount,
                  total: verdicts.length
                }
              };
              console.log(`[Orchestrator] ✅ Extracted ${verdicts.length} sandbox verdicts (M:${maliciousCount}, S:${suspiciousCount}, C:${cleanCount})`);
            }

            // Extract MITRE ATT&CK tactics and techniques
            try {
              // Check multiple possible locations for MITRE data
              const mitreData = vtRaw?.mitre_attack_techniques || 
                               attrs?.mitre_attack_techniques || 
                               fullDataAttrs?.mitre_attack_techniques ||
                               fullData?.mitre_attack_techniques;
              
              console.log('[Orchestrator] 🔍 Checking for MITRE data...');
              console.log('[Orchestrator] 🔍 vtRaw?.mitre_attack_techniques:', !!vtRaw?.mitre_attack_techniques);
              console.log('[Orchestrator] 🔍 attrs?.mitre_attack_techniques:', !!attrs?.mitre_attack_techniques);
              console.log('[Orchestrator] 🔍 fullDataAttrs?.mitre_attack_techniques:', !!fullDataAttrs?.mitre_attack_techniques);
              console.log('[Orchestrator] 🔍 fullData?.mitre_attack_techniques:', !!fullData?.mitre_attack_techniques);
              
              if (mitreData) {
                console.log('[Orchestrator] 🔍 Found MITRE data, type:', typeof mitreData, 'isArray:', Array.isArray(mitreData));
                console.log('[Orchestrator] 🔍 MITRE data keys:', Object.keys(mitreData).slice(0, 5));
                const mitreAttack = parseMitreAttack(mitreData);
                if (mitreAttack && (mitreAttack.tactics.length > 0 || mitreAttack.techniques.length > 0)) {
                  result.mitreAttack = mitreAttack;
                  console.log(`[Orchestrator] ⚔️ Extracted MITRE: ${mitreAttack.tactics.length} tactics, ${mitreAttack.techniques.length} techniques`);
                } else {
                  console.log('[Orchestrator] ⚠️ MITRE data found but no tactics/techniques extracted');
                }
              } else {
                console.log('[Orchestrator] ℹ️ No MITRE data found in VT response');
                console.log('[Orchestrator] ℹ️ Available keys in attrs:', attrs ? Object.keys(attrs).filter(k => k.includes('mitre') || k.includes('attack')).join(', ') : 'none');
              }
            } catch (error: any) {
              console.error('[Orchestrator] ⚠️ Failed to extract MITRE data:', error.message);
              console.error('[Orchestrator] ⚠️ Error stack:', error.stack);
            }

            // Extract family labels using vt-extractor
            try {
              const familyLabels = extractFamilyLabels(data.raw_data);
              if (familyLabels.length > 0 && result.vtData) {
                if (!result.vtData.malware_families) {
                  result.vtData.malware_families = [];
                }
                // Merge with existing families
                const existingFamilies = new Set(result.vtData.malware_families);
                familyLabels.forEach(label => existingFamilies.add(label));
                result.vtData.malware_families = Array.from(existingFamilies);
                console.log(`[Orchestrator] 🧬 Extracted ${familyLabels.length} family labels`);
              }
            } catch (error: any) {
              console.error('[Orchestrator] ⚠️ Failed to extract family labels:', error.message);
            }

            // ✅ Extract popular_threat_classification and suggested_threat_label
            try {
              const popularClass = attrs?.popular_threat_classification || 
                                   fullDataAttrs?.popular_threat_classification;
              
              if (popularClass && result.vtData) {
                result.vtData.popular_threat_classification = popularClass;
                result.vtData.suggested_threat_label = popularClass.suggested_threat_label || null;
                
                // Extract popular_threat_label from most common category/name
                if (!result.vtData.popular_threat_label) {
                  const topCategory = popularClass.popular_threat_category?.[0]?.value;
                  const topName = popularClass.popular_threat_name?.[0]?.value;
                  if (topName && topCategory) {
                    result.vtData.popular_threat_label = `${topCategory}.${topName}`;
                  } else if (topName) {
                    result.vtData.popular_threat_label = topName;
                  } else if (topCategory) {
                    result.vtData.popular_threat_label = topCategory;
                  }
                }
                
                console.log(`[Orchestrator] 🎯 Extracted popular classification:`, {
                  suggested: result.vtData.suggested_threat_label,
                  popular: result.vtData.popular_threat_label,
                  categories: popularClass.popular_threat_category?.length || 0,
                  names: popularClass.popular_threat_name?.length || 0
                });
              }
            } catch (error: any) {
              console.error('[Orchestrator] ⚠️ Failed to extract popular threat classification:', error.message);
            }
          }
        }

        // ✅ FIX: Merge stats from VT (check multiple possible locations)
        if (source === 'virustotal') {
          // Try different possible locations for stats
          const stats = data.details?.stats || 
                     data.raw_data?.summary || 
                     data.raw_data?.data?.attributes?.last_analysis_stats;
          
          if (stats) {
            console.log('[Orchestrator] ✅ Found VT stats:', stats);
            result.stats = {
              malicious: stats.malicious || 0,
              suspicious: stats.suspicious || 0,
              harmless: stats.harmless || 0,
              undetected: stats.undetected || 0
            };
          } else {
            console.log('[Orchestrator] ⚠️ No stats found in VT data');
          }
        }

        // Collect detections
        if (data.details?.detections) {
          result.threatIntel.detections.push(...data.details.detections);
        }

      } else {
        result.sources_failed!.push(source);
      }
    }
  }

  // Aggregate data from all successful sources
  if (successfulSources.length > 0) {
    this.aggregateResults(result, successfulSources);
  }

  console.log(`[Orchestrator] ✅ Analysis complete - ${successfulSources.length} sources succeeded`);
  console.log(`[Orchestrator] 📊 Final verdict: ${result.verdict} / ${result.severity}`);
  console.log(`[Orchestrator] 📊 Final stats:`, result.stats);

  return result;
}


  /**
   * Query a single source and normalize
   */
  private async querySource(
    sourceName: string,
    client: any,
    ioc: string,
    iocType: IOCType
  ): Promise<{ source: string; data: UnifiedThreatData }> {
    try {
      console.log(`[Orchestrator] 🔍 Querying ${sourceName}...`);

      const clientResult = await client.query(ioc, iocType);
      const normalizer = this.normalizers.get(sourceName);

      if (!normalizer) {
        throw new Error(`No normalizer found for ${sourceName}`);
      }

      const normalizedData = normalizer.normalize(clientResult);

      return { source: sourceName, data: normalizedData };

    } catch (error: any) {
      console.error(`[Orchestrator] ❌ ${sourceName} error:`, error.message);
      
      // Return unavailable data
      return {
        source: sourceName,
        data: {
          available: false,
          score: 0,
          verdict: 'unknown',
          confidence: 0,
          source: sourceName
        }
      };
    }
  }

  /**
   * Store source-specific data in result
   */
  private storeSourceData(result: IOCAnalysisResult, source: string, data: UnifiedThreatData): void {
    switch (source) {
      case 'virustotal':
        result.vtData = data;
        break;
      case 'greynoise':
        result.greynoiseData = data;
        break;
      case 'ipqs':
        result.ipqsData = data;
        break;
      case 'threatfox':
        result.threatfoxData = data;
        break;
      case 'malwarebazaar':
        result.malwarebazaarData = data;
        break;
      case 'urlhaus':
        result.urlhausData = data;
        break;
    }
  }

  /**
   * Aggregate final verdict and severity from all sources
   * LOGIC: Use enhanced VT scoring for hashes, highest severity for others
   */
  private aggregateResults(result: IOCAnalysisResult, sources: UnifiedThreatData[]): void {
    let highestSeverity: Severity = 'unknown';
    let highestSeverityRank = 0;
    let totalConfidence = 0;

    const allThreatTypes = new Set<string>();
    const allMalwareFamilies = new Set<string>();

    // ✅ Special handling for hash IOCs with VT stats
    if (result.type === 'hash' && result.stats && result.stats.malicious > 0) {
      const { malicious, suspicious, harmless, undetected } = result.stats;
      const total = malicious + suspicious + harmless + undetected;
      
      if (total > 0) {
        // Calculate VT score with enhanced logic
        const maliciousRatio = malicious / total;
        const suspiciousRatio = suspicious / total;
        let vtScore = Math.round((maliciousRatio * 100) + (suspiciousRatio * 50));
        
        // Boost for high malicious counts (consensus)
        if (malicious >= 40) vtScore = Math.min(vtScore + 15, 100);
        else if (malicious >= 30) vtScore = Math.min(vtScore + 12, 100);
        else if (malicious >= 20) vtScore = Math.min(vtScore + 10, 100);
        else if (malicious >= 10) vtScore = Math.min(vtScore + 7, 100);
        else if (malicious >= 5) vtScore = Math.min(vtScore + 5, 100);
        
        // Penalty for low scan counts
        if (total < 20) vtScore = Math.round(vtScore * 0.7);
        
        console.log(
          `[Orchestrator] 🎯 Enhanced VT Score: ${malicious}M/${suspicious}S/${total}T ` +
          `→ ratio=${maliciousRatio.toFixed(2)}, final=${vtScore}`
        );
        
        // Determine severity from enhanced score
        if (vtScore >= 75) {
          highestSeverity = 'critical';
          highestSeverityRank = SEVERITY_RANK.critical;
        } else if (vtScore >= 60) {
          highestSeverity = 'high';
          highestSeverityRank = SEVERITY_RANK.high;
        } else if (vtScore >= 40) {
          highestSeverity = 'medium';
          highestSeverityRank = SEVERITY_RANK.medium;
        } else if (vtScore > 0) {
          highestSeverity = 'low';
          highestSeverityRank = SEVERITY_RANK.low;
        }
        
        console.log(`[Orchestrator] 📊 VT-based severity: ${highestSeverity} (score: ${vtScore})`);
      }
    }

    // Find highest severity from all sources (may override VT if higher)
    for (const source of sources) {
      // Get severity from source details or convert from verdict
      const severity = this.extractSeverity(source);
      const severityRank = SEVERITY_RANK[severity];

      if (severityRank > highestSeverityRank) {
        highestSeverityRank = severityRank;
        highestSeverity = severity;
      }

      totalConfidence += source.confidence;

      // Aggregate threat types
      if (source.threat_types) {
        source.threat_types.forEach(t => allThreatTypes.add(t));
      }

      // Aggregate malware families
      if (source.malware_families) {
        source.malware_families.forEach(f => allMalwareFamilies.add(f));
      }
    }

    // Set final severity
    result.severity = highestSeverity;
    result.threatIntel.severity = highestSeverity;

    // Set final verdict based on severity
    result.verdict = this.severityToVerdict(highestSeverity);

    // Set confidence (average of all sources)
    const avgConfidence = totalConfidence / sources.length;
    result.threatIntel.confidence = Number(avgConfidence.toFixed(2));

    // Set aggregated threat intel
    result.threatIntel.threatTypes = Array.from(allThreatTypes);
    
    // Limit detections to top 20
    if (result.threatIntel.detections.length > 20) {
      result.threatIntel.detections = result.threatIntel.detections.slice(0, 20);
    }

    // Store malware families in VT data (for backward compatibility)
    if (result.vtData && allMalwareFamilies.size > 0) {
      if (!result.vtData.malware_families) {
        result.vtData.malware_families = [];
      }
      result.vtData.malware_families = Array.from(allMalwareFamilies);
    }
  }

  /**
   * Extract severity from source data
   */
  private extractSeverity(source: UnifiedThreatData): Severity {
    // If source has severity in details, use it
    if (source.details?.severity) {
      return source.details.severity as Severity;
    }

    // Otherwise convert from score
    const score = source.score || 0;
    
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    if (score > 0) return 'low';
    if (source.verdict === 'clean') return 'clean';
    
    return 'unknown';
  }

  /**
   * Convert severity to verdict
   */
  private severityToVerdict(severity: Severity): Verdict {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'malicious';
      case 'medium':
        return 'suspicious';
      case 'low':
      case 'clean':
        return 'clean';
      default:
        return 'unknown';
    }
  }
}

/**
 * Deduplicate detections array
 */
function deduplicateDetections(detections: any[]): any[] {
  if (!detections || !Array.isArray(detections)) return [];
  
  const seen = new Set<string>();
  const unique: any[] = [];
  
  for (const det of detections) {
    const key = `${det.engine}:${det.category}:${det.result}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(det);
    }
  }
  
  return unique;
}

/**
 * Extract limited VT analysis results (only essential fields)
 */
function extractLimitedVTResults(results: any): any {
  if (!results || typeof results !== 'object') return null;
  
  const limited: any = {};
  for (const [engineName, data] of Object.entries(results)) {
    if (data && typeof data === 'object') {
      const engineData = data as any;
      limited[engineName] = {
        method: engineData.method,
        engine_name: engineData.engine_name,
        category: engineData.category,
        result: engineData.result
      };
    }
  }
  return limited;
}

/**
 * Format IOC analysis result for API response
 */
export function formatIOCResponse(
  result: IOCAnalysisResult,
  cached: boolean = false
): any {
  console.log(`[Formatter] 📋 Formatting ${result.type}: ${result.ioc}`);
  console.log(`  ├─ Verdict: ${result.verdict}`);
  console.log(`  ├─ Severity: ${result.severity}`);
  if (result.riskScore !== undefined) {
    console.log(`  ├─ Risk: ${result.riskScore}/100 (${result.riskLevel})`);
  }
  console.log(`  └─ Sources: ${result.sources_available?.join(', ')}`);

  const response: any = {
    ioc: result.ioc,
    type: result.type,
    verdict: result.verdict,
    severity: result.severity,

    // IP-specific fields
    ...(result.type === 'ip' && result.riskScore !== undefined && {
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      riskDetails: result.riskDetails
    }),

    // Statistics
    stats: result.stats,

    // Threat intelligence
    threatIntel: result.threatIntel,

    // VT data (keep existing structure for backward compatibility + add full data)
    vtData: result.vtData ? (() => {
      // Check if data comes from cache (has pre-processed vt_full_data) or fresh (needs processing)
      const isFromCache = !!result.vtData.vt_full_data;
      const vtFullData = result.vtData.vt_full_data || result.vtData.raw_data?.raw?.data?.attributes || {};
      
      // Strip last_analysis_results from raw response to reduce size (avoid duplication)
      const rawData = result.vtData.raw_data ? {
        ...result.vtData.raw_data,
        raw: result.vtData.raw_data.raw ? {
          ...result.vtData.raw_data.raw,
          data: result.vtData.raw_data.raw.data ? {
            ...result.vtData.raw_data.raw.data,
            attributes: result.vtData.raw_data.raw.data.attributes ? {
              ...result.vtData.raw_data.raw.data.attributes,
              last_analysis_results: undefined // Remove to avoid duplication
            } : undefined
          } : undefined
        } : undefined
      } : undefined;
      
      return {
        popular_threat_label: result.vtData.details?.popular_threat_label || null,
        threat_categories: result.vtData.threat_types || [],
        suggested_threat_label: result.vtData.details?.suggested_threat_label || null,
        family_labels: result.vtData.malware_families || [],
        stats: result.vtData.details?.stats || result.stats,
        // Detections removed - available in threatIntel.detections to avoid duplication
        raw: rawData,
        // Common VT data
        reputation: vtFullData.reputation || null,
        popular_threat_classification: vtFullData.popular_threat_classification || null,
        // Always extract limited results from raw data (not stored in vt_full_data to avoid duplication)
        last_analysis_results: extractLimitedVTResults(result.vtData.raw_data?.raw?.data?.attributes?.last_analysis_results),
        // IP-specific fields
        ...(result.type === 'ip' && {
          country: vtFullData.country || null,
          continent: vtFullData.continent || null,
          asn: vtFullData.asn || null,
          as_owner: vtFullData.as_owner || null,
          network: vtFullData.network || null,
          regional_internet_registry: vtFullData.regional_internet_registry || null
        }),
        // File-specific fields
        ...(result.type === 'hash' && {
          trid: vtFullData.trid || null,
          elf_info: vtFullData.elf_info || null,
          detectiteasy: vtFullData.detectiteasy || null,
          type_tag: vtFullData.type_tag || null,
          type_description: vtFullData.type_description || null,
          meaningful_name: vtFullData.meaningful_name || null,
          names: vtFullData.names || null,
          size: vtFullData.size || null
        }),
        // Domain/URL-specific fields
        ...(['domain', 'url'].includes(result.type) && {
          categories: vtFullData.categories || null,
          last_dns_records: vtFullData.last_dns_records || null,
          last_https_certificate_date: vtFullData.last_https_certificate_date || null
        })
      };
    })() : null,

    // Multi-source data (NEW - this is what was missing!)
    multiSourceData: {
      greynoise: result.greynoiseData ? {
        available: result.greynoiseData.available,
        verdict: result.greynoiseData.verdict,
        score: result.greynoiseData.score,
        classification: result.greynoiseData.details?.classification,
        noise: result.greynoiseData.details?.noise,
        riot: result.greynoiseData.details?.riot,
        name: result.greynoiseData.details?.name,
        last_seen: result.greynoiseData.details?.last_seen
      } : null,

      ipqs: result.ipqsData ? {
        available: result.ipqsData.available,
        verdict: result.ipqsData.verdict,
        score: result.ipqsData.score,
        fraud_score: result.ipqsData.details?.fraud_score,
        is_proxy: result.ipqsData.details?.is_proxy,
        is_vpn: result.ipqsData.details?.is_vpn,
        is_tor: result.ipqsData.details?.is_tor,
        is_bot: result.ipqsData.details?.is_bot,
        recent_abuse: result.ipqsData.details?.recent_abuse,
        country: result.ipqsData.details?.country,
        isp: result.ipqsData.details?.isp
      } : null,

      malwarebazaar: result.malwarebazaarData ? {
        available: result.malwarebazaarData.available,
        verdict: result.malwarebazaarData.verdict,
        score: result.malwarebazaarData.score,
        file_name: result.malwarebazaarData.details?.file_name,
        file_type: result.malwarebazaarData.details?.file_type,
        file_size: result.malwarebazaarData.details?.file_size,
        signature: result.malwarebazaarData.details?.signature,
        malware_families: result.malwarebazaarData.malware_families,
        tags: result.malwarebazaarData.threat_types
      } : null,

      threatfox: result.threatfoxData ? {
        available: result.threatfoxData.available,
        verdict: result.threatfoxData.verdict,
        score: result.threatfoxData.score,
        threat_type: result.threatfoxData.details?.threat_type,
        malware_families: result.threatfoxData.malware_families,
        confidence_level: result.threatfoxData.details?.confidence_level,
        first_seen: result.threatfoxData.details?.first_seen
      } : null,

      urlhaus: result.urlhausData ? {
        available: result.urlhausData.available,
        verdict: result.urlhausData.verdict,
        score: result.urlhausData.score,
        url_status: result.urlhausData.details?.url_status,
        threat: result.urlhausData.details?.threat,
        malware_families: result.urlhausData.malware_families,
        tags: result.urlhausData.threat_types
      } : null
    },

    // Additional data (keep for backward compatibility)
    fileInfo: result.fileInfo || null,
    sandboxAnalysis: result.sandboxAnalysis || null,
    mitreAttack: result.mitreAttack || null,
    reputation: result.reputation || null,

    // Metadata
    fetchedAt: result.fetchedAt,
    cached: cached,
    sources_available: result.sources_available || [],
    sources_failed: result.sources_failed || []
  };

  return response;
}

/**
 * Create error result
 */
export function createErrorResult(ioc: string, iocType: string, error: any): any {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('queued');

  return {
    ioc: ioc || 'unknown',
    type: iocType,
    verdict: 'error',
    severity: 'unknown',
    ...(iocType === 'ip' && {
      riskScore: 0,
      riskLevel: 'low'
    }),
    stats: {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0
    },
    threatIntel: {
      threatTypes: [],
      detections: [],
      severity: 'unknown',
      ...(iocType === 'ip' && {
        riskLevel: 'low',
        riskScore: 0
      }),
      confidence: 0
    },
    error: isRateLimit
      ? '⏳ Rate limit reached - try again in 60 seconds'
      : errorMessage,
    cached: false,
    rateLimited: isRateLimit
  };
}
