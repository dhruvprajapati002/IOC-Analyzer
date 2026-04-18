// src/lib/threat-intel/orchestrator/threat-intel.orchestrator.ts

import { VTDataExtractor } from './extractors';
import { IOCStorageDocument } from '../types/storage.types';
import { ThreatIntelResult, IOCType } from '../types/threat-intel.types';
import { randomUUID } from 'crypto';

export class ThreatIntelOrchestrator {
  
  /**
   * Analyze IOC and return storage document
   */
  async analyzeIOC(
    iocValue: string, 
    iocType: IOCType, 
    userId?: string
  ): Promise<IOCStorageDocument> {
    console.log(`[Orchestrator] 🎯 Analyzing ${iocType}: ${iocValue}`);
    
    // Query all sources (you need to implement this)
    const clientResults = await this.queryAllSources(iocValue, iocType);
    
    // Aggregate results (you need to implement this)
    const aggregated = this.aggregateResults(clientResults);
    
    // Transform to storage format with extracted data
    const storageDoc = this.transformToStorageFormat(aggregated);
    
    console.log(`[Orchestrator] ✅ Analysis complete: ${iocValue}`);
  
    
    return storageDoc;
  }
  
  /**
   * Transform threat intel result to storage format
   */
  private transformToStorageFormat(result: ThreatIntelResult): IOCStorageDocument {
    const vtRaw = result.sources.virustotal?.data?.raw?.raw;
    const mbData = result.sources.malwarebazaar?.data;
    
    // Extract detection stats
    const detectionStats = VTDataExtractor.extractDetectionStats(vtRaw);
    const totalEngines = Object.values(detectionStats).reduce((a: any, b: any) => a + b, 0);
    
    // Extract threat classification
    const threatClassification = VTDataExtractor.extractThreatClassification(vtRaw);
    
    // Extract sandbox analysis
    const sandboxAnalysis = VTDataExtractor.extractSandboxAnalysis(vtRaw);
    
    return {
      _id: randomUUID(),
      ioc: result.ioc,
      ioc_type: result.type,
      
      verdict: result.verdict,
      severity: result.severity,
      confidence: result.confidence,
      
      stats: {
        ...detectionStats,
        total_engines: totalEngines,
      },
      
      threat_intel: {
        threat_types: result.threatTypes,
        threat_names: threatClassification.threat_names.map((t: any) => t.value),
        suggested_threat_label: threatClassification.suggested_label,
        malware_families: this.extractMalwareFamilies(result, mbData),
        tags: this.extractAllTags(result, mbData),
        detections: VTDataExtractor.extractDetections(vtRaw, 20),
      },
      
      vt_data: {
        status: result.sources.virustotal?.data?.raw?.status || 'unknown',
        vt_link: this.buildVTLink(result.ioc, result.type),
        last_analysis_date: vtRaw?.data?.attributes?.last_analysis_date 
          ? new Date(vtRaw.data.attributes.last_analysis_date * 1000)
          : new Date(),
        
        threat_classification: threatClassification,
        detection_stats: detectionStats,
        community: VTDataExtractor.extractCommunityVotes(vtRaw),
        reputation: vtRaw?.data?.attributes?.reputation || 0,
        submission: VTDataExtractor.extractSubmissionInfo(vtRaw),
        
        file_info: VTDataExtractor.extractFileInfo(vtRaw),
        packers: VTDataExtractor.extractPackers(vtRaw),
        detectiteasy: VTDataExtractor.extractDetectItEasy(vtRaw),
        elf_info: VTDataExtractor.extractELFInfo(vtRaw),
        yara_matches: VTDataExtractor.extractYARAMatches(vtRaw),
        
        // ✅ ADD: Sandbox analysis
        sandbox_analysis: sandboxAnalysis.verdicts.length > 0 ? sandboxAnalysis : undefined,
      },
      
      multi_source_data: {
        malwarebazaar: mbData ? {
          available: true,
          verdict: mbData.verdict,
          score: mbData.score,
          signature: mbData.signature,
          file_name: mbData.file_name,
          file_type: mbData.file_type,
          file_size: mbData.file_size,
          malware_families: mbData.malware_families,
          tags: mbData.tags,
        } : undefined,
        
        greynoise: undefined,
        ipqs: undefined,
      },
      
      sources_available: result.sources_available,
      sources_failed: result.sources_failed,
      fetched_at: new Date(),
      updated_at: new Date(),
      cached: false,
      cache_ttl_sec: 3600,
    };
  }
  
  /**
   * Extract malware families from all sources
   */
  private extractMalwareFamilies(result: ThreatIntelResult, mbData?: any): string[] {
    const families = new Set<string>();
    
    // From VT family labels
    if (result.sources.virustotal?.data?.family_labels) {
      result.sources.virustotal.data.family_labels.forEach((f: string) => {
        // Filter out generic labels
        if (!['peexe', 'elf', 'upx', 'arm', 'assembly', 'detect-debug-environment', 'long-sleeps', 'obfuscated'].includes(f.toLowerCase())) {
          families.add(f);
        }
      });
    }
    
    // From MalwareBazaar
    if (mbData?.malware_families) {
      mbData.malware_families.forEach((f: string) => families.add(f));
    }
    
    // From threat types (extract specific malware names)
    result.threatTypes.forEach((t: string) => {
      const lower = t.toLowerCase();
      // Add if it looks like a specific malware family (not generic terms)
      if (lower.length > 3 && !['malware', 'trojan', 'backdoor', 'botnet', 'rat', 'exe', 'dll', 'elf'].includes(lower)) {
        families.add(t);
      }
    });
    
    return Array.from(families);
  }
  
  /**
   * Extract all tags from all sources
   */
  private extractAllTags(result: ThreatIntelResult, mbData?: any): string[] {
    const tags = new Set<string>();
    
    // From VT family labels
    if (result.sources.virustotal?.data?.family_labels) {
      result.sources.virustotal.data.family_labels.forEach((tag: string) => {
        tags.add(tag.toLowerCase());
      });
    }
    
    // From VT tags
    if (result.sources.virustotal?.data?.raw?.raw?.data?.attributes?.tags) {
      result.sources.virustotal.data.raw.raw.data.attributes.tags.forEach((tag: string) => {
        tags.add(tag.toLowerCase());
      });
    }
    
    // From MalwareBazaar tags
    if (mbData?.tags) {
      mbData.tags.forEach((tag: string) => tags.add(tag.toLowerCase()));
    }
    
    // From threat types (convert to tags)
    result.threatTypes.forEach((t: string) => {
      tags.add(t.toLowerCase());
    });
    
    return Array.from(tags);
  }
  
  /**
   * Build VirusTotal link for IOC
   */
  private buildVTLink(ioc: string, type: string): string {
    switch (type) {
      case 'hash':
        return `https://www.virustotal.com/gui/file/${ioc}`;
      case 'ip':
        return `https://www.virustotal.com/gui/ip-address/${ioc}`;
      case 'domain':
        return `https://www.virustotal.com/gui/domain/${ioc}`;
      case 'url':
        return `https://www.virustotal.com/gui/url/${Buffer.from(ioc).toString('base64').replace(/=/g, '')}`;
      default:
        return `https://www.virustotal.com/gui/search/${encodeURIComponent(ioc)}`;
    }
  }
  
  /**
   * Query all threat intel sources (placeholder - you need to implement this)
   */
  private async queryAllSources(iocValue: string, iocType: IOCType): Promise<any> {
    // TODO: Implement actual source querying
    // This should call VT, MalwareBazaar, GreyNoise, etc.
    return {};
  }
  
  /**
   * Aggregate results from all sources (placeholder - you need to implement this)
   */
  private aggregateResults(clientResults: any): ThreatIntelResult {
    // TODO: Implement actual aggregation logic
    return {} as ThreatIntelResult;
  }
}
